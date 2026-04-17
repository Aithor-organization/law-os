import { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, View, Pressable, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { listConversations, type Conversation } from "@/lib/conversations";

type Filter = "all" | "normal" | "debate" | "archived";

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

  // Refresh when the tab gains focus (after creating a conversation elsewhere).
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
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-white/5 px-6 py-4">
        <Text className="font-kr text-2xl font-bold text-fg">대화</Text>
        <Pressable
          onPress={() => router.push("/chat/new" as any)}
          className="h-10 w-10 items-center justify-center rounded bg-violet"
          style={{
            shadowColor: "#A855F7",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
          }}
        >
          <Text className="font-mono text-xl text-white">+</Text>
        </Pressable>
      </View>

      {/* Filter tabs */}
      <View className="flex-row gap-4 border-b border-white/5 px-6 py-3">
        {(
          [
            { key: "all", label: "전체" },
            { key: "normal", label: "일반" },
            { key: "debate", label: "Deep Debate" },
            { key: "archived", label: "보관함" },
          ] as { key: Filter; label: string }[]
        ).map((t) => (
          <Pressable key={t.key} onPress={() => setFilter(t.key)}>
            <Text
              className={`font-mono text-xs uppercase ${
                filter === t.key ? "text-violet-glow" : "text-dim"
              }`}
            >
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* List */}
      <ScrollView
        className="flex-1 px-6 pt-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#A855F7" />
        }
      >
        {error && (
          <View className="mb-4 rounded border border-danger/40 bg-danger/10 p-3">
            <Text className="font-mono text-[10px] text-danger">// {error}</Text>
          </View>
        )}

        {loading && !error && (
          <Text className="mt-12 text-center font-mono text-[10px] text-dim">
            // loading...
          </Text>
        )}

        {!loading && filtered.length === 0 && !error && (
          <View className="mt-16 items-center">
            <Text className="font-mono text-[10px] uppercase text-dim">
              // no conversations yet
            </Text>
            <Text className="mt-2 font-kr text-sm text-dim">
              우측 상단의 + 를 눌러 첫 대화를 시작하세요
            </Text>
          </View>
        )}

        {filtered.map((conv) => (
          <Pressable
            key={conv.id}
            onPress={() => router.push(`/chat/${conv.id}` as any)}
            className="mb-3 rounded border border-white/5 bg-surface p-4"
          >
            <View className="flex-row items-start justify-between">
              <View className="mr-3 h-10 w-10 items-center justify-center rounded bg-violet/20">
                <Text className="text-base">
                  {conv.mode === "debate" ? "⚖️" : "💬"}
                </Text>
              </View>
              <View className="flex-1">
                <Text
                  className="font-kr text-base font-semibold text-fg"
                  numberOfLines={1}
                >
                  {conv.title || "제목 없음"}
                </Text>
                <Text className="mt-2 font-mono text-[10px] text-cyan">
                  // {conv.message_count} messages
                </Text>
              </View>
              <Text className="font-mono text-[10px] text-dim">
                {formatRelative(conv.last_message_at, conv.created_at)}
              </Text>
            </View>
          </Pressable>
        ))}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
