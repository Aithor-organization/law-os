import { ScrollView, Text, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

// 대화 목록 (Conversation List) — 데모: 모든 항목이 active chat으로 이동
const CONVERSATIONS = [
  {
    id: "1",
    title: "민법 750조 불법행위 요건",
    preview: "불법행위가 성립하려면 고의 또는 과실이...",
    time: "2분 전",
    mode: "normal" as const,
    count: 5,
  },
  {
    id: "2",
    title: "Deep Debate: 채권자대위권",
    preview: "원고측: 채권자는 자신의 이름으로...",
    time: "1시간 전",
    mode: "debate" as const,
    count: 12,
  },
  {
    id: "3",
    title: "형법 제250조 살인죄",
    preview: "고의와 과실의 구분이 핵심이며...",
    time: "어제",
    mode: "normal" as const,
    count: 8,
  },
  {
    id: "4",
    title: "헌법 기본권 제한",
    preview: "비례의 원칙에 따라 목적의 정당성...",
    time: "3일 전",
    mode: "normal" as const,
    count: 3,
  },
];

export default function ChatListScreen() {
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
        {["전체", "일반", "Deep Debate", "보관함"].map((t, i) => (
          <Pressable key={t}>
            <Text
              className={`font-mono text-xs uppercase ${
                i === 0 ? "text-violet-glow" : "text-dim"
              }`}
            >
              {t}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* List */}
      <ScrollView className="flex-1 px-6 pt-4">
        {CONVERSATIONS.map((conv) => (
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
                  {conv.title}
                </Text>
                <Text className="mt-1 font-kr text-xs text-dim" numberOfLines={2}>
                  {conv.preview}
                </Text>
                <Text className="mt-2 font-mono text-[10px] text-cyan">
                  // {conv.count} messages
                </Text>
              </View>
              <Text className="font-mono text-[10px] text-dim">{conv.time}</Text>
            </View>
          </Pressable>
        ))}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
