import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
  type ListRenderItem,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import Markdown from "react-native-markdown-display";
import { listMessages, type Message } from "@/lib/conversations";
import { sendChatMessage, type ChatTier, type LawRecommendation } from "@/lib/chat";
import { subscribeLaw } from "@/lib/laws";
import { DisclaimerBanner } from "@/components/ui/DisclaimerBanner";

// Dark Academia Pro markdown styles
const markdownStyles = {
  body: {
    color: "#F4F4F5",
    fontFamily: "Pretendard",
    fontSize: 14,
    lineHeight: 24,
  },
  strong: { color: "#F4F4F5", fontFamily: "Pretendard-Bold" },
  em: { color: "#DDB7FF", fontStyle: "italic" as const },
  bullet_list: { marginTop: 4 },
  ordered_list: { marginTop: 4 },
  list_item: { color: "#F4F4F5", fontFamily: "Pretendard", marginBottom: 2 },
  paragraph: { marginTop: 0, marginBottom: 8 },
  code_inline: {
    fontFamily: "JetBrainsMono",
    backgroundColor: "#1C1B1C",
    color: "#06B6D4",
    padding: 2,
    borderRadius: 4,
  },
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

type StreamingItem = { id: "__streaming__"; kind: "streaming" };
type ListItem = (Message & { kind: "message" }) | StreamingItem;

export default function ActiveChatScreen() {
  const { id, seed } = useLocalSearchParams<{ id: string; seed?: string }>();
  const [mode, setMode] = useState<ChatTier>("flash");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  // Partial assistant response while streaming (not yet persisted).
  const [streamBuffer, setStreamBuffer] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<LawRecommendation[]>([]);
  const [installingRec, setInstallingRec] = useState<Set<string>>(new Set());
  const listRef = useRef<FlatList<ListItem>>(null);
  const seedSentRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    if (!id) return;
    const { data, error } = await listMessages(id);
    if (error) {
      setLoadError(error.message);
      return;
    }
    setMessages(data);
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Abort any in-flight stream on unmount.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, []);

  const scrollToEnd = useCallback(() => {
    listRef.current?.scrollToEnd({ animated: true });
  }, []);

  // Auto-scroll on new messages / streaming chunks.
  useEffect(() => {
    const timeout = setTimeout(scrollToEnd, 50);
    return () => clearTimeout(timeout);
  }, [messages, streamBuffer, scrollToEnd]);

  const handleSend = useCallback(
    async (text: string) => {
      if (!id || !text.trim() || streaming) return;

      // Cancel previous stream if any (defensive — UI already disables send).
      abortRef.current?.abort();

      const controller = new AbortController();
      abortRef.current = controller;

      setInput("");
      setStreaming(true);
      setStreamBuffer("");
      setRecommendations([]);

      const { error, aborted } = await sendChatMessage({
        conversationId: id,
        message: text.trim(),
        tier: mode,
        signal: controller.signal,
        handlers: {
          onChunk: (chunk) => setStreamBuffer((prev) => prev + chunk),
          onError: (err) => setLoadError(err),
          onRecommendations: (recs) => setRecommendations(recs),
        },
      });

      if (abortRef.current === controller) {
        abortRef.current = null;
      }
      setStreaming(false);
      setStreamBuffer("");
      if (error && !aborted) {
        setLoadError(error.message);
      }
      if (!aborted) {
        // Re-fetch to get the persisted user + assistant messages with real ids.
        await refresh();
      }
    },
    [id, mode, streaming, refresh],
  );

  // If arriving with a `seed` query param from /chat/new, send it once.
  useEffect(() => {
    if (seedSentRef.current || !seed || streaming || messages.length > 0) return;
    seedSentRef.current = true;
    handleSend(seed);
  }, [seed, streaming, messages.length, handleSend]);

  const listData: ListItem[] = useMemo(() => {
    const items: ListItem[] = messages.map((msg) => ({ ...msg, kind: "message" }));
    if (streaming) {
      items.push({ id: "__streaming__", kind: "streaming" });
    }
    return items;
  }, [messages, streaming]);

  const handleInstallRec = useCallback(async (rec: LawRecommendation) => {
    if (installingRec.has(rec.code)) return;
    setInstallingRec((prev) => new Set(prev).add(rec.code));
    try {
      const result = await subscribeLaw(rec.code);
      // 설치 후 추천에서 제거
      setRecommendations((prev) => prev.filter((r) => r.code !== rec.code));
      if (result.ingesting) {
        Alert.alert(
          "설치 시작됨",
          `${rec.koreanName}의 조문을 가져오는 중입니다. 다음 질문부터 반영됩니다.`,
        );
      } else {
        Alert.alert("설치 완료", `${rec.koreanName}이(가) 추가되었습니다.`);
      }
    } catch (e: any) {
      Alert.alert("설치 실패", e?.message ?? String(e));
    } finally {
      setInstallingRec((prev) => {
        const next = new Set(prev);
        next.delete(rec.code);
        return next;
      });
    }
  }, [installingRec]);

  const renderItem: ListRenderItem<ListItem> = useCallback(
    ({ item }) => {
      if (item.kind === "streaming") {
        return (
          <View className="mb-6">
            <View className="mb-2 flex-row items-center gap-2">
              <View className="h-6 w-6 items-center justify-center rounded-full bg-violet/20">
                <Text className="font-mono text-[10px] text-violet-glow">AI</Text>
              </View>
              <Text className="font-mono text-[10px] uppercase text-dim">
                law.os · {mode}
              </Text>
              <ActivityIndicator size="small" color="#A855F7" />
            </View>
            <View className="flex-row">
              <View className="mr-3 w-0.5 rounded-full bg-violet" />
              <View className="flex-1 rounded bg-surface p-4">
                {streamBuffer.length > 0 ? (
                  <Markdown style={markdownStyles}>{streamBuffer}</Markdown>
                ) : (
                  <Text className="font-mono text-[10px] text-dim">
                    // 응답 생성 중...
                  </Text>
                )}
              </View>
            </View>
          </View>
        );
      }

      const msg = item;
      if (msg.role === "user") {
        return (
          <View className="mb-6 items-end">
            <View className="max-w-[80%] rounded bg-surface-high px-4 py-3">
              <Text className="font-kr text-sm text-fg">{msg.content}</Text>
            </View>
            <Text className="mt-1 font-mono text-[10px] text-dim">
              {formatTime(msg.created_at)}
            </Text>
          </View>
        );
      }

      // Per-message trust signal — uncited AI answers in a legal-domain app
      // are the highest hallucination risk. A top-of-screen banner alone is
      // not enough. When citations.length === 0 we:
      //   1. drop the accent bar to danger-tinted
      //   2. prepend a "출처 없음" warning chip before the body
      //   3. tone down the body text opacity
      // Save/share flows (bottom-sheet actions) should gate on this too —
      // wiring below in message actions.
      const hasCitations = msg.citations.length > 0;
      const accentBar = hasCitations ? "bg-violet" : "bg-danger/60";
      return (
        <View className="mb-6">
          <View className="mb-2 flex-row items-center gap-2">
            <View className="h-6 w-6 items-center justify-center rounded-full bg-violet/20">
              <Text className="font-mono text-[10px] text-violet-glow">AI</Text>
            </View>
            <Text className="font-mono text-[10px] uppercase text-dim">
              law.os · {msg.model ?? "gemini"}
            </Text>
          </View>
          <View className="flex-row">
            <View className={`mr-3 w-0.5 rounded-full ${accentBar}`} />
            <View className="flex-1 rounded bg-surface p-4">
              {!hasCitations ? (
                <View
                  accessible
                  accessibilityLabel="출처 없는 답변 경고"
                  className="mb-3 flex-row items-center gap-2 rounded border border-danger/40 bg-danger/10 px-3 py-2"
                >
                  <Text className="font-mono text-[10px] text-danger">⚠</Text>
                  <Text
                    className="flex-1 font-kr text-[11px] leading-4 text-danger"
                    numberOfLines={2}
                  >
                    출처 없는 답변. 법령·판례와 직접 대조하세요.
                  </Text>
                </View>
              ) : null}
              <View style={{ opacity: hasCitations ? 1 : 0.85 }}>
                <Markdown style={markdownStyles}>{msg.content}</Markdown>
              </View>
              {hasCitations && (
                <View className="mt-4 gap-2 border-t border-white/5 pt-4">
                  <Text className="font-mono text-[10px] uppercase tracking-wider text-cyan">
                    // citations · {msg.citations.length}
                  </Text>
                  {msg.citations.map((citation) => (
                    <Pressable
                      key={citation.id}
                      accessibilityRole="button"
                      accessibilityLabel={`${citation.source_type === "statute" ? "조문" : "판례"} ${citation.label}`}
                      onPress={() =>
                        router.push({
                          pathname: "/modals/citation",
                          params: {
                            sourceType: citation.source_type,
                            sourceId: citation.source_id,
                            snippet: citation.snippet,
                            score: citation.score != null ? String(citation.score) : "",
                            label: citation.label,
                            subtitle: citation.subtitle ?? "",
                          },
                        } as any)
                      }
                      className="rounded border border-white/10 bg-surface-low p-3"
                    >
                      <Text className="font-mono text-[10px] uppercase text-violet-glow">
                        {citation.source_type === "statute" ? "조문" : "판례"}
                      </Text>
                      <Text className="mt-1 font-kr text-sm font-semibold text-fg">
                        {citation.label}
                      </Text>
                      {citation.subtitle && (
                        <Text className="mt-1 font-mono text-[10px] text-dim">
                          {citation.subtitle}
                        </Text>
                      )}
                      <Text
                        className="mt-2 font-kr text-xs leading-5 text-dim"
                        numberOfLines={3}
                      >
                        {citation.snippet}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
              <Text className="mt-3 font-mono text-[10px] text-dim">
                {formatTime(msg.created_at)}
              </Text>
            </View>
          </View>
        </View>
      );
    },
    [mode, streamBuffer],
  );

  const listEmpty = useMemo(() => {
    if (streaming || seed) return null;
    return (
      <View className="mt-12 items-center">
        <Text className="font-mono text-[10px] uppercase text-dim">// empty</Text>
        <Text className="mt-2 font-kr text-sm text-dim">
          첫 질문을 입력해 대화를 시작하세요
        </Text>
      </View>
    );
  }, [streaming, seed]);

  // Perplexity-style follow-up suggestions — shown after the last
  // assistant message when not streaming. Static set for MVP; future
  // iteration can derive them from the assistant response content.
  const FOLLOWUP_QUESTIONS = [
    "더 자세히 설명해주세요",
    "관련 판례가 있나요?",
    "실무에서는 어떻게 적용되나요?",
    "쉬운 예시로 알려주세요",
  ];

  const lastMessage = messages[messages.length - 1];
  const showFollowUps =
    !streaming && lastMessage?.role === "assistant" && messages.length > 0;

  const listFooter = useMemo(
    () => (
      <View className="mt-2 gap-6">
        {showFollowUps ? (
          <View>
            <Text className="mb-3 font-mono text-[10px] uppercase tracking-wider text-cyan">
              // 이어서 질문하기
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {FOLLOWUP_QUESTIONS.map((q) => (
                <Pressable
                  key={q}
                  onPress={() => handleSend(q)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={`팔로우업: ${q}`}
                  style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
                  className="h-9 items-center justify-center rounded-full border border-violet/30 bg-violet/10 px-3"
                >
                  <Text
                    className="font-kr text-xs text-violet-glow"
                    numberOfLines={1}
                  >
                    {q}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
        <View className="items-center">
          <Text className="font-mono text-[10px] text-dim">
            // 학습 참고용 · 실제 분쟁은 변호사 상담 필요
          </Text>
        </View>
      </View>
    ),
    [showFollowUps, handleSend],
  );

  const listHeader = useMemo(() => {
    if (!loadError && recommendations.length === 0) return null;
    return (
      <View className="mb-4">
        {loadError ? (
          <View className="mb-3 rounded border border-danger/40 bg-danger/10 p-3">
            <Text className="font-mono text-[10px] text-danger">
              // error: {loadError}
            </Text>
          </View>
        ) : null}
        {recommendations.map((rec) => {
          const installing = installingRec.has(rec.code);
          return (
            <View
              key={rec.code}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderWidth: 1,
                borderColor: "rgba(168,85,247,0.3)",
                backgroundColor: "rgba(168,85,247,0.08)",
                borderRadius: 8,
                marginBottom: 8,
              }}
            >
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text className="font-kr text-sm text-fg">
                  📚 {rec.koreanName} 설치 제안
                </Text>
                <Text className="mt-1 font-mono text-[10px] text-dim">
                  {rec.matchedArticle} 관련
                </Text>
              </View>
              <Pressable
                onPress={() => handleInstallRec(rec)}
                disabled={installing}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 6,
                  backgroundColor: installing
                    ? "rgba(168,85,247,0.3)"
                    : "#A855F7",
                }}
              >
                <Text className="font-mono text-[10px] text-white">
                  {installing ? "설치 중..." : "설치"}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    );
  }, [loadError, recommendations, installingRec, handleInstallRec]);

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      {/* ═══ HEADER ═══ */}
      <View className="flex-row items-center justify-between border-b border-white/5 px-4 py-3">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="뒤로가기"
          className="h-10 w-10 items-center justify-center"
        >
          <Text className="font-mono text-xs text-dim">← back</Text>
        </Pressable>
        <View className="flex-1 items-center">
          <Text className="font-kr text-sm font-semibold text-fg" numberOfLines={1}>
            LAW.OS
          </Text>
          <Text className="font-mono text-[10px] text-cyan">
            // conv · {id?.slice(0, 8)}
          </Text>
        </View>
        <Pressable
          onPress={() => {
            const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
            const lastUser = [...messages].reverse().find((m) => m.role === "user");
            router.push({
              pathname: "/modals/save-note",
              params: {
                question: lastUser?.content ?? "",
                answer: lastAssistant?.content ?? "",
                messageId: lastAssistant?.id ?? "",
              },
            } as any);
          }}
          accessibilityRole="button"
          accessibilityLabel="노트로 저장"
          className="h-10 w-10 items-center justify-center"
        >
          <Text className="font-mono text-xs text-dim">⋯</Text>
        </Pressable>
      </View>

      {/* 법적 고지 — 변호사법 §109 compliance */}
      <DisclaimerBanner />

      {/* Mode toggle */}
      <View className="flex-row items-center justify-center gap-3 border-b border-white/5 px-6 py-2">
        <Pressable
          onPress={() => setMode("flash")}
          accessibilityRole="button"
          accessibilityLabel="Flash 모드"
        >
          <Text
            className={`font-mono text-[10px] uppercase tracking-wider ${
              mode === "flash" ? "text-violet-glow" : "text-dim"
            }`}
          >
            // flash · 빠름
          </Text>
        </Pressable>
        <Text className="text-dim">·</Text>
        <Pressable
          onPress={() => setMode("pro")}
          accessibilityRole="button"
          accessibilityLabel="Pro 모드"
        >
          <Text
            className={`font-mono text-[10px] uppercase tracking-wider ${
              mode === "pro" ? "text-violet-glow" : "text-dim"
            }`}
          >
            ⚖️ pro · 고품질
          </Text>
        </Pressable>
      </View>

      {/* ═══ MESSAGES ═══ */}
      <FlatList
        ref={listRef}
        data={listData}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingVertical: 16, paddingHorizontal: 16 }}
        className="flex-1"
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        ListFooterComponent={listFooter}
        onContentSizeChange={scrollToEnd}
        removeClippedSubviews
        initialNumToRender={20}
        maxToRenderPerBatch={10}
        windowSize={10}
      />

      {/* ═══ INPUT BAR ═══ */}
      <View className="border-t border-white/5 bg-surface-low px-4 py-3">
        <View className="flex-row items-end gap-2">
          <View className="flex-1 rounded border border-white/10 bg-surface">
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="질문을 입력하세요..."
              placeholderTextColor="#71717A"
              multiline
              editable={!streaming}
              accessibilityLabel="질문 입력"
              className="min-h-[44px] max-h-[120px] px-3 py-3 font-kr text-sm text-fg"
              style={{ outlineStyle: "none" } as any}
            />
          </View>
          <Pressable
            onPress={() => handleSend(input)}
            disabled={streaming || input.trim().length === 0}
            accessibilityRole="button"
            accessibilityLabel="메시지 전송"
            accessibilityState={{ disabled: streaming || input.trim().length === 0 }}
            className={`h-11 w-11 items-center justify-center rounded ${
              streaming || input.trim().length === 0 ? "bg-surface-high" : "bg-violet"
            }`}
            style={{
              shadowColor: "#A855F7",
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.4,
              shadowRadius: 12,
            }}
          >
            <Text className="font-mono text-sm text-white">↑</Text>
          </Pressable>
        </View>
        <View className="mt-2 flex-row items-center justify-between">
          <Text className="font-mono text-[10px] text-dim">
            // gemini · {mode}
          </Text>
          <Text className="font-mono text-[10px] text-cyan">
            FREE · beta
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
