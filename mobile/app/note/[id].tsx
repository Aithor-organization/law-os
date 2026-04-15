import { ScrollView, Text, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";

/**
 * 🎨 Stitch Reference: projects/7657386961511176864/screens/7a071be618304efcbb9c127af58e8e44
 * Note Detail — 서재에 저장된 Q&A 상세
 */

const NOTE = {
  noteNo: "2,847",
  breadcrumb: ["민법", "채권", "불법행위"],
  tags: ["#750조", "#불법행위", "#손해배상", "#중요", "#시험출제"],
  question: "민법 750조에서 '고의 또는 과실'의 판단 기준은 무엇이며, 판례는 어떻게 보는가?",
  answer:
    "민법 제750조의 '고의 또는 과실'은 불법행위의 주관적 요건으로, 판단 기준은 다음과 같습니다.\n\n**고의**는 가해자가 자신의 행위로 인해 위법한 결과가 발생할 것을 인식하고 이를 용인한 상태를 말합니다. 대법원 [판례 1]은 미필적 고의도 포함된다고 판시했습니다.\n\n**과실**은 주의의무 위반으로, 판단 기준은 '사회 평균인의 통상의 주의'입니다. 전문가의 경우 [판례 2]에서 보듯 해당 직업군의 평균적 주의의무가 기준이 됩니다.\n\n**입증책임**은 원칙적으로 피해자에게 있으나, 의료 과실 등 증거의 구조적 편재가 있는 경우 법원은 과실의 일응의 추정을 인정하기도 합니다.",
  sources: [
    { type: "statute" as const, id: "civil-750", label: "민법 제750조", sub: "(불법행위의 내용)" },
    { type: "case" as const, id: "2018da12345", label: "대법원 2018다12345", sub: "고의 · 미필적 고의" },
    { type: "case" as const, id: "2019da67890", label: "대법원 2019다67890", sub: "전문가의 주의의무" },
  ],
  savedAt: "2026-01-15",
  reviewCount: 3,
  nextReviewAt: "2026-02-15",
};

export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams();

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      {/* ═══ HEADER ═══ */}
      <View className="flex-row items-center justify-between border-b border-white/5 px-4 py-3">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center"
        >
          <Text className="font-mono text-xs text-dim">← back</Text>
        </Pressable>
        <Text className="font-mono text-[10px] uppercase text-cyan">
          // note · {NOTE.noteNo}
        </Text>
        <View className="flex-row gap-2">
          <Pressable className="h-10 w-10 items-center justify-center">
            <Text className="font-mono text-sm text-violet-glow">⭐</Text>
          </Pressable>
          <Pressable className="h-10 w-10 items-center justify-center">
            <Text className="font-mono text-sm text-dim">⋯</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView className="flex-1">
        {/* ═══ BREADCRUMB ═══ */}
        <View className="px-6 pt-6">
          <View className="flex-row flex-wrap gap-1">
            {NOTE.breadcrumb.map((crumb, i) => (
              <View key={crumb} className="flex-row items-center gap-1">
                <Text className="font-mono text-[10px] uppercase tracking-wider text-violet-glow">
                  {crumb}
                </Text>
                {i < NOTE.breadcrumb.length - 1 ? (
                  <Text className="font-mono text-[10px] text-dim">/</Text>
                ) : null}
              </View>
            ))}
          </View>

          {/* Tags */}
          <View className="mt-3 flex-row flex-wrap gap-2">
            {NOTE.tags.map((tag) => (
              <View
                key={tag}
                className="rounded border border-white/10 bg-surface px-2 py-1"
              >
                <Text className="font-mono text-[10px] text-dim">{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ═══ QUESTION ═══ */}
        <View className="mt-8 px-6">
          <View className="flex-row items-center gap-2">
            <View className="h-6 w-6 items-center justify-center rounded-full bg-violet/20">
              <Text className="font-mono text-xs font-bold text-violet-glow">
                Q
              </Text>
            </View>
            <Text className="font-mono text-[10px] uppercase tracking-wider text-violet-glow">
              question
            </Text>
          </View>
          <View className="mt-3 rounded bg-surface p-4">
            <Text className="font-kr text-base leading-6 text-fg">
              {NOTE.question}
            </Text>
          </View>
        </View>

        {/* ═══ ANSWER ═══ */}
        <View className="mt-6 px-6">
          <View className="flex-row items-center gap-2">
            <View className="h-6 w-6 items-center justify-center rounded-full bg-cyan/20">
              <Text className="font-mono text-xs font-bold text-cyan">A</Text>
            </View>
            <Text className="font-mono text-[10px] uppercase tracking-wider text-cyan">
              answer
            </Text>
          </View>
          <View className="mt-3 flex-row">
            <View className="mr-3 w-0.5 rounded-full bg-cyan" />
            <View className="flex-1 rounded bg-surface p-4">
              <Text className="font-kr text-sm leading-6 text-fg">
                {NOTE.answer}
              </Text>
            </View>
          </View>
        </View>

        {/* ═══ SOURCES ═══ */}
        <View className="mt-6 px-6">
          <Text className="font-mono text-[10px] uppercase tracking-wider text-cyan">
            // 출처 ({NOTE.sources.length})
          </Text>
          <View className="mt-3 gap-2">
            {NOTE.sources.map((s) => (
              <Pressable
                key={s.id}
                onPress={() =>
                  router.push(
                    s.type === "statute"
                      ? (`/statute/${s.id}` as any)
                      : (`/case/${s.id}` as any),
                  )
                }
                className="flex-row items-center gap-3 rounded border border-white/10 bg-surface p-3"
              >
                <View
                  className={`h-8 w-8 items-center justify-center rounded ${
                    s.type === "statute" ? "bg-violet/20" : "bg-cyan/20"
                  }`}
                >
                  <Text
                    className={`font-mono text-[10px] ${
                      s.type === "statute" ? "text-violet-glow" : "text-cyan"
                    }`}
                  >
                    {s.type === "statute" ? "조" : "판"}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="font-kr text-sm font-semibold text-fg">
                    {s.label}
                  </Text>
                  <Text className="font-mono text-[10px] text-dim">
                    {s.sub}
                  </Text>
                </View>
                <Text className="font-mono text-xs text-dim">→</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ═══ REVIEW META ═══ */}
        <View className="mt-8 px-6">
          <View className="rounded border border-white/5 bg-surface-low p-4">
            <Text className="font-mono text-[10px] uppercase tracking-wider text-dim">
              // review metadata
            </Text>
            <View className="mt-3 flex-row justify-between">
              <View>
                <Text className="font-mono text-[10px] text-dim">saved</Text>
                <Text className="font-mono text-xs text-cyan">
                  {NOTE.savedAt}
                </Text>
              </View>
              <View>
                <Text className="font-mono text-[10px] text-dim">reviewed</Text>
                <Text className="font-mono text-xs text-cyan">
                  {NOTE.reviewCount}x
                </Text>
              </View>
              <View>
                <Text className="font-mono text-[10px] text-dim">next</Text>
                <Text className="font-mono text-xs text-violet-glow">
                  {NOTE.nextReviewAt}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View className="h-24" />
      </ScrollView>

      {/* ═══ FAB: 복습 시작 ═══ */}
      <View className="absolute bottom-6 right-6">
        <Pressable
          onPress={() => router.push("/(tabs)/library" as any)}
          className="h-14 flex-row items-center gap-2 rounded bg-violet px-6"
          style={{
            shadowColor: "#A855F7",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 24,
          }}
        >
          <Text className="font-mono text-sm text-white">🔁</Text>
          <Text className="font-kr text-sm font-semibold text-white">
            복습 시작
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
