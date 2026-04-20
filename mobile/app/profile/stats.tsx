import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import { listBookmarks } from "@/lib/bookmarks";
import { listNotes } from "@/lib/notes";

type Stats = {
  bookmarks: number;
  notes: number;
  starred: number;
  reviewed: number;
};

export default function StatsScreen() {
  const [stats, setStats] = useState<Stats>({
    bookmarks: 0,
    notes: 0,
    starred: 0,
    reviewed: 0,
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [bmRes, allNotes, starred] = await Promise.all([
      listBookmarks(),
      listNotes({ limit: 500 }),
      listNotes({ starred: true, limit: 500 }),
    ]);
    const reviewed = allNotes.data.filter((n) => (n.review_count ?? 0) > 0).length;
    setStats({
      bookmarks: bmRes.data.length,
      notes: allNotes.data.length,
      starred: starred.data.length,
      reviewed,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <View className="flex-row items-center justify-between border-b border-white/5 px-4 py-3">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="뒤로"
          className="h-10 w-10 items-center justify-center"
        >
          <Text className="font-mono text-xs text-dim">←</Text>
        </Pressable>
        <Text className="font-kr text-base font-semibold text-fg">학습 통계</Text>
        <View className="h-10 w-10" />
      </View>

      <ScrollView className="flex-1">
        {loading ? (
          <View className="items-center py-16">
            <ActivityIndicator size="small" color="#A855F7" />
          </View>
        ) : (
          <>
            <View className="mx-6 mt-6 flex-row flex-wrap gap-3">
              <View className="w-[48%] rounded border border-white/10 bg-surface p-4">
                <Text className="font-mono text-3xl text-cyan">{stats.bookmarks}</Text>
                <Text className="mt-1 font-mono text-[10px] uppercase text-dim">
                  // 북마크
                </Text>
              </View>
              <View className="w-[48%] rounded border border-white/10 bg-surface p-4">
                <Text className="font-mono text-3xl text-cyan">{stats.notes}</Text>
                <Text className="mt-1 font-mono text-[10px] uppercase text-dim">
                  // 저장한 노트
                </Text>
              </View>
              <View className="w-[48%] rounded border border-white/10 bg-surface p-4">
                <Text className="font-mono text-3xl text-violet-glow">{stats.starred}</Text>
                <Text className="mt-1 font-mono text-[10px] uppercase text-dim">
                  // 즐겨찾기
                </Text>
              </View>
              <View className="w-[48%] rounded border border-white/10 bg-surface p-4">
                <Text className="font-mono text-3xl text-violet-glow">{stats.reviewed}</Text>
                <Text className="mt-1 font-mono text-[10px] uppercase text-dim">
                  // 복습 완료
                </Text>
              </View>
            </View>

            <View className="mx-6 mt-8">
              <Text className="font-mono text-[10px] uppercase tracking-wider text-dim">
                // activity
              </Text>
              <View className="mt-3 rounded border border-white/10 bg-surface p-5">
                <Text className="font-kr text-sm text-fg">
                  총 {stats.notes}개의 노트를 저장했고, 그 중 {stats.reviewed}개를 한 번 이상
                  복습했습니다.
                </Text>
                <Text className="mt-3 font-kr text-sm text-dim">
                  노트 상세 화면에서 "복습 완료"를 누르면 다음 복습 예정일이 자동 설정됩니다.
                </Text>
              </View>
            </View>

            <View className="mx-6 mt-8 mb-10">
              <Text className="font-mono text-[10px] uppercase tracking-wider text-dim">
                // tips
              </Text>
              <View className="mt-3 rounded border border-white/10 bg-surface p-5">
                <Text className="font-kr text-sm text-fg">
                  · 노트 상세에서 별표(즐겨찾기)를 눌러 핵심 개념을 모아보세요.
                </Text>
                <Text className="mt-2 font-kr text-sm text-fg">
                  · 채팅 답변에서 "노트로 저장"으로 질문과 답변을 함께 보관할 수 있습니다.
                </Text>
                <Text className="mt-2 font-kr text-sm text-fg">
                  · 북마크한 조문/판례는 검색 시 최상단에 표시됩니다.
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
