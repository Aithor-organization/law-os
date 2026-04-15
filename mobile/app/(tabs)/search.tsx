import { ScrollView, Text, View, Pressable, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

const RECENT = ["민법 750조", "불법행위", "2018다12345", "채권자대위권", "비례원칙"];

const POPULAR = [
  { rank: 1, query: "민법 750조 불법행위" },
  { rank: 2, query: "형법 250조 살인죄" },
  { rank: 3, query: "헌법 기본권 제한" },
  { rank: 4, query: "채권자대위권" },
  { rank: 5, query: "선의취득" },
];

const CATEGORIES = [
  { code: "civil", name: "민법", count: "1,118조", icon: "⚖️" },
  { code: "criminal", name: "형법", count: "372조", icon: "🔨" },
  { code: "constitutional", name: "헌법", count: "130조", icon: "📜" },
  { code: "commercial", name: "상법", count: "935조", icon: "💼" },
];

export default function SearchScreen() {
  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <ScrollView className="flex-1">
        {/* Title */}
        <View className="px-6 pt-4">
          <Text className="font-kr text-3xl font-bold text-fg">검색</Text>
        </View>

        {/* Search bar */}
        <View className="mt-6 px-6">
          <View className="rounded border border-white/10 bg-surface">
            <TextInput
              placeholder="조문·판례·키워드..."
              placeholderTextColor="#71717A"
              className="px-4 py-3 font-kr text-base text-fg"
              style={{ outlineStyle: "none" } as any}
            />
          </View>
        </View>

        {/* Tabs */}
        <View className="mt-4 flex-row gap-4 px-6">
          {["조문", "판례", "전체"].map((t, i) => (
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

        {/* Recent */}
        <View className="mt-8 px-6">
          <Text className="font-mono text-[10px] uppercase tracking-wider text-cyan">
            // 최근 검색
          </Text>
          <View className="mt-3 flex-row flex-wrap gap-2">
            {RECENT.map((q) => (
              <Pressable
                key={q}
                onPress={() => router.push("/statute/civil-750" as any)}
                className="rounded border border-white/10 bg-surface-high px-3 py-2"
              >
                <Text className="font-kr text-xs text-fg">{q}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Popular */}
        <View className="mt-8 px-6">
          <Text className="font-mono text-[10px] uppercase tracking-wider text-cyan">
            // 인기 검색어
          </Text>
          <View className="mt-3 gap-2">
            {POPULAR.map((p) => (
              <Pressable
                key={p.rank}
                onPress={() => router.push("/statute/civil-750" as any)}
                className="flex-row items-center gap-4"
              >
                <Text className="font-mono text-sm text-cyan">
                  {String(p.rank).padStart(2, "0")}
                </Text>
                <Text className="font-kr text-sm text-fg">{p.query}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Categories */}
        <View className="mt-8 px-6 pb-8">
          <Text className="font-mono text-[10px] uppercase tracking-wider text-cyan">
            // 카테고리
          </Text>
          <View className="mt-3 flex-row flex-wrap gap-3">
            {CATEGORIES.map((c) => (
              <Pressable
                key={c.code}
                onPress={() => router.push("/statute/civil-750" as any)}
                className="w-[48%] rounded border border-white/10 bg-surface p-4"
              >
                <Text className="text-2xl">{c.icon}</Text>
                <Text className="mt-2 font-kr text-base font-semibold text-fg">
                  {c.name}
                </Text>
                <Text className="font-mono text-[10px] text-dim">
                  // {c.count}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
