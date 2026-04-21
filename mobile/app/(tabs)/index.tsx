import { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, View, Pressable, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { listConversations, type Conversation } from "@/lib/conversations";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SegmentedTabs } from "@/components/ui/SegmentedTabs";
import { EmptyState, SkeletonCard } from "@/components/ui/FeedbackState";
import { PressableCard } from "@/components/ui/Card";

type Filter = "all" | "normal" | "debate" | "archived";

const FILTER_TABS: readonly { key: Filter; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "normal", label: "일반" },
  { key: "debate", label: "Debate" },
  { key: "archived", label: "보관" },
];

function formatRelative(iso: string | null, createdAt: string): string {
  const source = iso ?? createdAt;
  const then = new Date(source).getTime();
  const diffMin = Math.floor((Date.now() - then) / 60000);
  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}시간 전`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return "어제";
  if (diffDay < 7) return `${diffDay}일 전`;
  return new Date(source).toLocaleDateString("ko-KR");
}

export default function ChatListScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  const load = useCallback(async () => {
    const { data, error: err } = await listConversations();
    if (err) {
      setError(err.message);
    } else {
      setError(null);
      setConversations(data);
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const filtered = conversations.filter((c) => {
    if (filter === "all") return true;
    if (filter === "archived") return c.archived_at !== null;
    return c.mode === filter;
  });

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <ScreenHeader
        title="대화"
        subtitle="AI와 법률 주제로 대화하세요"
        rightAction={
          <Pressable
            onPress={() => router.push("/chat/new" as any)}
            className="h-10 w-10 items-center justify-center rounded bg-violet"
            style={{
              shadowColor: "#A855F7",
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.4,
              shadowRadius: 12,
            }}
            accessibilityLabel="새 대화"
          >
            <Text className="font-mono text-xl text-white">+</Text>
          </Pressable>
        }
      />

      <SegmentedTabs tabs={FILTER_TABS} value={filter} onChange={setFilter} />

      <ScrollView
        className="flex-1 px-6 pt-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#A855F7" />
        }
      >
        {error && (
          <View className="mb-4 rounded border border-danger/40 bg-danger/10 p-3">
            <Text className="font-mono text-[10px] text-danger">
              // {error}
            </Text>
          </View>
        )}

        {loading && !error && (
          <View className="gap-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </View>
        )}

        {!loading && filtered.length === 0 && !error && (
          <EmptyState
            title="대화가 없습니다"
            hint="우측 상단의 + 버튼으로 첫 대화를 시작하세요"
          />
        )}

        {filtered.map((conv) => (
          <PressableCard
            key={conv.id}
            onPress={() => router.push(`/chat/${conv.id}` as any)}
            className="mb-3"
          >
            <View className="flex-row items-center">
              <View className="mr-3 h-10 w-10 items-center justify-center rounded bg-violet/20">
                <Text className="text-base">
                  {conv.mode === "debate" ? "⚖️" : "💬"}
                </Text>
              </View>
              <View className="flex-1 mr-3">
                <Text
                  className="font-kr text-base font-semibold text-fg"
                  numberOfLines={1}
                >
                  {conv.title || "제목 없음"}
                </Text>
                <Text
                  className="mt-1 font-mono text-[10px] text-cyan"
                  numberOfLines={1}
                >
                  // {conv.message_count} messages
                </Text>
              </View>
              <Text
                className="font-mono text-[10px] text-dim"
                numberOfLines={1}
              >
                {formatRelative(conv.last_message_at, conv.created_at)}
              </Text>
            </View>
          </PressableCard>
        ))}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
