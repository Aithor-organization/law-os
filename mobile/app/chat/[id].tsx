import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Text,
  View,
  Pressable,
  TextInput,
  ActivityIndicator,
  type ListRenderItem,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import Markdown from "react-native-markdown-display";
import { listMessages, type Message } from "@/lib/conversations";
import { sendChatMessage, type ChatTier } from "@/lib/chat";

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

      const { error, aborted } = await sendChatMessage({
        conversationId: id,
        message: text.trim(),
        tier: mode,
        signal: controller.signal,
        handlers: {
          onChunk: (chunk) => setStreamBuffer((prev) => prev + chunk),
          onError: (err) => setLoadError(err),
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
            <View className="mr-3 w-0.5 rounded-full bg-violet" />
            <View className="flex-1 rounded bg-surface p-4">
              <Markdown style={markdownStyles}>{msg.content}</Markdown>
              {msg.citations.length > 0 && (
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

  const listFooter = useMemo(
    () => (
      <View className="mt-2 items-center">
        <Text className="font-mono text-[10px] text-dim">
          // 학습 참고용 · 실제 분쟁은 변호사 상담 필요
        </Text>
      </View>
    ),
    [],
  );

  const listHeader = useMemo(() => {
    if (!loadError) return null;
    return (
      <View className="mb-4 rounded border border-danger/40 bg-danger/10 p-3">
        <Text className="font-mono text-[10px] text-danger">
          // error: {loadError}
        </Text>
      </View>
    );
  }, [loadError]);

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
