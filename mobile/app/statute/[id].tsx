import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";

import { isBookmarked, toggleBookmark } from "@/lib/bookmarks";
import { getStatuteDetail, type StatuteDetail } from "@/lib/statutes";

/**
 * 🎨 Stitch Reference: projects/7657386961511176864/screens/bc5c1098ac194cc9a3dd95688c4bb06a
 * Statute Detail — Dark Academia Pro
 */

const COURT_LABEL: Record<string, string> = {
  supreme: "대법원",
  constitutional: "헌법재판소",
  high: "고등법원",
  district: "지방법원",
};

export default function StatuteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const statuteId = Array.isArray(id) ? id[0] : id;
  const [statute, setStatute] = useState<StatuteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkBusy, setBookmarkBusy] = useState(false);

  useEffect(() => {
    if (!statuteId) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      const [detailResult, bookmarkState] = await Promise.all([
        getStatuteDetail(statuteId),
        isBookmarked({ sourceType: "statute", sourceId: statuteId }),
      ]);
      if (cancelled) return;

      setLoading(false);
      setBookmarked(bookmarkState);
      if (detailResult.error || !detailResult.data) {
        setError(detailResult.error?.message ?? "조문을 불러오지 못했습니다.");
        return;
      }

      setStatute(detailResult.data);
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [statuteId]);

  const onToggleBookmark = useCallback(async () => {
    if (!statuteId || bookmarkBusy) return;
    setBookmarkBusy(true);
    const previous = bookmarked;
    // Optimistic toggle.
    setBookmarked(!previous);
    const { bookmarked: next, error: bookmarkError } = await toggleBookmark({
      sourceType: "statute",
      sourceId: statuteId,
    });
    setBookmarkBusy(false);
    if (bookmarkError) {
      setBookmarked(previous);
      Alert.alert("북마크 실패", bookmarkError.message);
      return;
    }
    setBookmarked(next);
  }, [statuteId, bookmarked, bookmarkBusy]);

  const onShare = useCallback(async () => {
    if (!statute) return;
    const header = `${statute.codeKr} ${statute.articleNo}${
      statute.title ? ` (${statute.title})` : ""
    }`;
    try {
      await Share.share({
        title: header,
        message: `${header}\n\n${statute.body}\n\n— LAW.OS`,
      });
    } catch (shareError) {
      Alert.alert(
        "공유 실패",
        shareError instanceof Error ? shareError.message : String(shareError),
      );
    }
  }, [statute]);

  const seedPrompt = useMemo(() => {
    if (!statute) return "";
    return `${statute.codeKr} ${statute.articleNo} ${statute.title ?? ""}에 대해 핵심 요건과 학습 포인트를 설명해줘`;
  }, [statute]);

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <View className="flex-row items-center justify-between border-b border-white/5 px-4 py-3">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center"
        >
          <Text className="font-mono text-xs text-dim">← back</Text>
        </Pressable>
        <Text className="font-mono text-[10px] uppercase text-cyan">
          // {statuteId}
        </Text>
        <View className="flex-row gap-2">
          <Pressable
            onPress={onToggleBookmark}
            disabled={bookmarkBusy || !statuteId}
            accessibilityRole="button"
            accessibilityLabel={bookmarked ? "북마크 해제" : "북마크 추가"}
            accessibilityState={{ selected: bookmarked }}
            className="h-10 w-10 items-center justify-center"
          >
            <Text
              className={`font-mono text-sm ${
                bookmarked ? "text-violet-glow" : "text-dim"
              }`}
            >
              {bookmarked ? "★" : "☆"}
            </Text>
          </Pressable>
          <Pressable
            onPress={onShare}
            disabled={!statute}
            accessibilityRole="button"
            accessibilityLabel="공유"
            className="h-10 w-10 items-center justify-center"
          >
            <Text className="font-mono text-sm text-dim">↑</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView className="flex-1">
        {loading ? (
          <View className="items-center px-6 pt-16">
            <ActivityIndicator size="small" color="#A855F7" />
            <Text className="mt-4 font-kr text-sm text-dim">조문을 불러오는 중...</Text>
          </View>
        ) : error || !statute ? (
          <View className="px-6 pt-16">
            <View className="rounded border border-danger/40 bg-danger/10 p-4">
              <Text className="font-mono text-[10px] text-danger">// {error ?? "statute_not_found"}</Text>
            </View>
          </View>
        ) : (
          <>
            <View className="px-6 pt-6">
              <View
                className="self-start rounded border border-violet/30 bg-violet/10 px-3 py-1.5"
                style={{
                  shadowColor: "#A855F7",
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                }}
              >
                <Text className="font-mono text-[10px] uppercase tracking-wider text-violet-glow">
                  {statute.codeKr}
                  {statute.part ? ` · ${statute.part}` : ""}
                  {statute.chapter ? ` · ${statute.chapter}` : ""}
                </Text>
              </View>
            </View>

            <View className="mt-6 px-6">
              <Text className="font-kr text-4xl font-bold leading-tight tracking-tightest text-fg">
                {statute.articleNo}
              </Text>
              <Text className="mt-2 font-kr text-lg text-dim">
                ({statute.title ?? "제목 없음"})
              </Text>
            </View>

            <View className="mt-6 px-6">
              <View className="flex-row">
                <View className="mr-4 w-0.5 rounded-full bg-violet-glow" />
                <View className="flex-1 rounded bg-surface p-5">
                  <Text className="font-kr text-lg leading-8 text-fg">{statute.body}</Text>
                </View>
              </View>
            </View>

            <View className="mt-4 px-6">
              <Text className="font-mono text-[10px] text-dim">
                // {statute.id} · public statute row
              </Text>
            </View>

            <View className="mt-8 px-6">
              <Text className="font-mono text-[10px] uppercase tracking-wider text-cyan">
                // 관련 판례 ({statute.relatedCases.length})
              </Text>
              <View className="mt-3 gap-3">
                {statute.relatedCases.length > 0 ? (
                  statute.relatedCases.map((item) => (
                    <Pressable
                      key={item.id}
                      onPress={() => router.push(`/case/${item.id}` as any)}
                      className="rounded border border-white/10 bg-surface p-4"
                    >
                      <View className="flex-row items-center justify-between">
                        <Text className="font-mono text-xs text-violet-glow">
                          {(COURT_LABEL[item.court] ?? item.court)} {item.caseNo}
                        </Text>
                        <Text className="font-mono text-[10px] text-dim">
                          {item.decidedAt}
                        </Text>
                      </View>
                      <Text className="mt-2 font-kr text-sm text-fg" numberOfLines={2}>
                        {item.summary ?? "요약 없음"}
                      </Text>
                    </Pressable>
                  ))
                ) : (
                  <View className="rounded border border-white/10 bg-surface p-4">
                    <Text className="font-kr text-sm text-dim">
                      아직 연결된 판례 데이터가 없습니다. 다음 단계에서 citations / case linkage를 붙일 예정입니다.
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View className="h-24" />
          </>
        )}
      </ScrollView>

      <View className="border-t border-white/5 bg-surface-low px-4 py-3">
        <View className="flex-row gap-2">
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/chat/new",
                params: { seed: seedPrompt },
              } as any)
            }
            disabled={!statute}
            className="flex-1 h-12 flex-row items-center justify-center rounded bg-violet"
            style={{
              shadowColor: "#A855F7",
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.4,
              shadowRadius: 16,
              opacity: statute ? 1 : 0.5,
            }}
          >
            <Text className="font-kr text-sm font-semibold text-white">
              이 조문에 대해 질문하기
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/modals/save-note" as any)}
            className="h-12 w-12 items-center justify-center rounded border border-white/10"
          >
            <Text className="font-mono text-xs text-fg">💾</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
