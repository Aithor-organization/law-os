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
import { getCaseDetail, type CaseDetail } from "@/lib/cases";

/**
 * 🎨 Stitch Reference: projects/7657386961511176864/screens/48da99c5072648ce820955f35ccf31ee
 * Case Detail — 판례 상세
 */

const COURT_LABEL: Record<string, string> = {
  supreme: "대법원",
  constitutional: "헌법재판소",
  high: "고등법원",
  district: "지방법원",
};

const CATEGORY_LABEL: Record<string, string> = {
  civil: "민사",
  criminal: "형사",
  constitutional: "헌법",
  admin: "행정",
  tax: "조세",
};

export default function CaseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const caseId = Array.isArray(id) ? id[0] : id;
  const [caseDetail, setCaseDetail] = useState<CaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkBusy, setBookmarkBusy] = useState(false);

  useEffect(() => {
    if (!caseId) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      const [detailResult, bookmarkState] = await Promise.all([
        getCaseDetail(caseId),
        isBookmarked({ sourceType: "case", sourceId: caseId }),
      ]);
      if (cancelled) return;

      setLoading(false);
      setBookmarked(bookmarkState);
      if (detailResult.error || !detailResult.data) {
        setError(detailResult.error?.message ?? "판례를 불러오지 못했습니다.");
        return;
      }
      setCaseDetail(detailResult.data);
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [caseId]);

  const onToggleBookmark = useCallback(async () => {
    if (!caseId || bookmarkBusy) return;
    setBookmarkBusy(true);
    const previous = bookmarked;
    setBookmarked(!previous);
    const { bookmarked: next, error: bookmarkError } = await toggleBookmark({
      sourceType: "case",
      sourceId: caseId,
    });
    setBookmarkBusy(false);
    if (bookmarkError) {
      setBookmarked(previous);
      Alert.alert("북마크 실패", bookmarkError.message);
      return;
    }
    setBookmarked(next);
  }, [caseId, bookmarked, bookmarkBusy]);

  const onShare = useCallback(async () => {
    if (!caseDetail) return;
    const header = `${caseDetail.caseNo} (${caseDetail.court} · ${caseDetail.decidedAt})`;
    const body = caseDetail.summary ?? caseDetail.judgmentPoints.join("\n") ?? "";
    try {
      await Share.share({
        title: header,
        message: `${header}\n\n${body}\n\n— LAW.OS`,
      });
    } catch (shareError) {
      Alert.alert(
        "공유 실패",
        shareError instanceof Error ? shareError.message : String(shareError),
      );
    }
  }, [caseDetail]);

  const seedPrompt = useMemo(() => {
    if (!caseDetail) return "";
    return `${caseDetail.caseNo} 판례의 핵심 사실관계와 판시사항, 시험 답안 포인트를 설명해줘`;
  }, [caseDetail]);

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
          // case · {caseId}
        </Text>
        <View className="flex-row gap-2">
          <Pressable
            onPress={onToggleBookmark}
            disabled={bookmarkBusy || !caseId}
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
            disabled={!caseDetail}
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
            <Text className="mt-4 font-kr text-sm text-dim">판례를 불러오는 중...</Text>
          </View>
        ) : error || !caseDetail ? (
          <View className="px-6 pt-16">
            <View className="rounded border border-danger/40 bg-danger/10 p-4">
              <Text className="font-mono text-[10px] text-danger">// {error ?? "case_not_found"}</Text>
            </View>
          </View>
        ) : (
          <>
            <View className="px-6 pt-6">
              <View className="flex-row flex-wrap gap-2">
                <View className="rounded border border-cyan/30 bg-cyan/10 px-3 py-1">
                  <Text className="font-mono text-[10px] uppercase text-cyan">
                    {COURT_LABEL[caseDetail.court] ?? caseDetail.court}
                  </Text>
                </View>
                <View className="rounded border border-white/10 bg-surface px-3 py-1">
                  <Text className="font-mono text-[10px] uppercase text-dim">
                    {CATEGORY_LABEL[caseDetail.category] ?? caseDetail.category}
                  </Text>
                </View>
                <View className="rounded border border-white/10 bg-surface px-3 py-1">
                  <Text className="font-mono text-[10px] text-dim">
                    {caseDetail.decidedAt}
                  </Text>
                </View>
              </View>
            </View>

            <View className="mt-6 px-6">
              <Text
                className="font-mono text-3xl font-bold tracking-tightest text-cyan"
                style={{
                  shadowColor: "#06B6D4",
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.3,
                  shadowRadius: 12,
                }}
              >
                {caseDetail.caseNo}
              </Text>
              <Text className="mt-2 font-kr text-xl font-semibold text-fg">
                {caseDetail.summary ?? "판례 요약 없음"}
              </Text>
            </View>

            <View className="mt-6 px-6">
              <Text className="font-mono text-[10px] uppercase tracking-wider text-cyan">
                // 요지
              </Text>
              <View className="mt-3 flex-row">
                <View className="mr-3 w-0.5 rounded-full bg-cyan" />
                <View className="flex-1 rounded bg-surface p-4">
                  <Text className="font-kr text-base leading-6 text-fg">
                    {caseDetail.summary ?? "등록된 판결 요지가 없습니다."}
                  </Text>
                </View>
              </View>
            </View>

            <View className="mt-8 px-6">
              <Text className="font-mono text-[10px] uppercase tracking-wider text-violet-glow">
                // 판시사항 ({caseDetail.judgmentPoints.length})
              </Text>
              <View className="mt-3 gap-3">
                {caseDetail.judgmentPoints.length > 0 ? (
                  caseDetail.judgmentPoints.map((point, i) => (
                    <View
                      key={`${caseDetail.id}-${i}`}
                      className="flex-row gap-3 rounded border border-white/10 bg-surface p-4"
                    >
                      <Text className="font-mono text-sm font-bold text-violet-glow">
                        {String(i + 1).padStart(2, "0")}
                      </Text>
                      <Text className="flex-1 font-kr text-sm leading-6 text-fg">
                        {point}
                      </Text>
                    </View>
                  ))
                ) : (
                  <View className="rounded border border-white/10 bg-surface p-4">
                    <Text className="font-kr text-sm text-dim">
                      등록된 판시사항이 없습니다.
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View className="mt-8 px-6">
              <Text className="font-mono text-[10px] uppercase tracking-wider text-cyan">
                // 전문 (preview)
              </Text>
              <View className="mt-3 rounded bg-surface-low p-4">
                <Text className="font-kr text-sm leading-6 text-dim">
                  {caseDetail.fullText?.slice(0, 1200) ?? "전문이 아직 적재되지 않았습니다."}
                  {caseDetail.fullText && caseDetail.fullText.length > 1200 ? "…" : ""}
                </Text>
              </View>
            </View>

            <View className="mt-8 px-6">
              <Text className="font-mono text-[10px] uppercase tracking-wider text-violet-glow">
                // 관련 조문 ({caseDetail.relatedStatutes.length})
              </Text>
              <View className="mt-3 gap-2">
                {caseDetail.relatedStatutes.length > 0 ? (
                  caseDetail.relatedStatutes.map((statute) => (
                    <Pressable
                      key={statute.id}
                      onPress={() => router.push(`/statute/${statute.id}` as any)}
                      className="flex-row items-center gap-3 rounded border border-white/10 bg-surface p-3"
                    >
                      <View className="h-8 w-8 items-center justify-center rounded bg-violet/20">
                        <Text className="font-mono text-[10px] text-violet-glow">조</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="font-kr text-sm font-semibold text-fg">
                          {statute.label}
                        </Text>
                        {statute.subtitle && (
                          <Text className="font-mono text-[10px] text-dim">
                            ({statute.subtitle})
                          </Text>
                        )}
                      </View>
                      <Text className="font-mono text-xs text-dim">→</Text>
                    </Pressable>
                  ))
                ) : (
                  <View className="rounded border border-white/10 bg-surface p-4">
                    <Text className="font-kr text-sm text-dim">
                      연결된 조문 데이터가 없습니다.
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
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/chat/new",
              params: { seed: seedPrompt },
            } as any)
          }
          disabled={!caseDetail}
          className="h-12 flex-row items-center justify-center rounded bg-violet"
          style={{
            shadowColor: "#A855F7",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.4,
            shadowRadius: 16,
            opacity: caseDetail ? 1 : 0.5,
          }}
        >
          <Text className="font-kr text-sm font-semibold text-white">
            이 판례에 대해 질문하기
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
