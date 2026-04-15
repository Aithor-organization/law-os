import { ScrollView, Text, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";

/**
 * 🎨 Stitch Reference: projects/7657386961511176864/screens/bc5c1098ac194cc9a3dd95688c4bb06a
 * Statute Detail — Dark Academia Pro
 */

// Mock data. 실제 구현 시 /statutes/:id API 응답으로 대체.
const STATUTE = {
  code: "civil",
  codeKr: "민법",
  part: "제3편 채권",
  chapter: "제5장 불법행위",
  articleNo: "제750조",
  title: "불법행위의 내용",
  text: "고의 또는 과실로 인한 위법행위로 타인에게 손해를 가한 자는 그 손해를 배상할 책임이 있다.",
  effectiveFrom: "1960-01-01",
  lastSynced: "2026-01-15",
};

const RELATED_CASES = [
  {
    caseNo: "2018다12345",
    decidedAt: "2020-03-15",
    summary:
      "불법행위 성립요건으로서 고의 또는 과실의 판단은 행위 당시를 기준으로 하며...",
    court: "대법원",
  },
  {
    caseNo: "2019다67890",
    decidedAt: "2021-05-20",
    summary:
      "전문가의 과실 판단에는 해당 직업군에 요구되는 평균적 주의의무가 적용되며...",
    court: "대법원",
  },
  {
    caseNo: "2020다11111",
    decidedAt: "2022-09-10",
    summary:
      "손해배상 범위는 상당인과관계가 있는 범위 내로 제한되며, 예외적으로...",
    court: "대법원",
  },
];

export default function StatuteDetailScreen() {
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
          // {id}
        </Text>
        <View className="flex-row gap-2">
          <Pressable className="h-10 w-10 items-center justify-center">
            <Text className="font-mono text-sm text-dim">⭐</Text>
          </Pressable>
          <Pressable className="h-10 w-10 items-center justify-center">
            <Text className="font-mono text-sm text-dim">↑</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView className="flex-1">
        {/* ═══ BREADCRUMB BADGE ═══ */}
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
              {STATUTE.codeKr} · {STATUTE.part} · {STATUTE.chapter}
            </Text>
          </View>
        </View>

        {/* ═══ TITLE ═══ */}
        <View className="mt-6 px-6">
          <Text className="font-kr text-4xl font-bold leading-tight tracking-tightest text-fg">
            {STATUTE.articleNo}
          </Text>
          <Text className="mt-2 font-kr text-lg text-dim">
            ({STATUTE.title})
          </Text>
        </View>

        {/* ═══ BODY CARD ═══ */}
        <View className="mt-6 px-6">
          <View className="flex-row">
            <View className="mr-4 w-0.5 rounded-full bg-violet-glow" />
            <View className="flex-1 rounded bg-surface p-5">
              <Text className="font-kr text-lg leading-8 text-fg">
                {STATUTE.text}
              </Text>
            </View>
          </View>
        </View>

        {/* ═══ META ═══ */}
        <View className="mt-4 px-6">
          <Text className="font-mono text-[10px] text-dim">
            // {STATUTE.code}-750 · 시행 {STATUTE.effectiveFrom} · 최종{" "}
            {STATUTE.lastSynced}
          </Text>
        </View>

        {/* ═══ RELATED CASES ═══ */}
        <View className="mt-8 px-6">
          <Text className="font-mono text-[10px] uppercase tracking-wider text-cyan">
            // 관련 판례 ({RELATED_CASES.length})
          </Text>
          <View className="mt-3 gap-3">
            {RELATED_CASES.map((c) => (
              <Pressable
                key={c.caseNo}
                onPress={() => router.push(`/case/${c.caseNo}` as any)}
                className="rounded border border-white/10 bg-surface p-4"
              >
                <View className="flex-row items-center justify-between">
                  <Text className="font-mono text-xs text-violet-glow">
                    {c.court} {c.caseNo}
                  </Text>
                  <Text className="font-mono text-[10px] text-dim">
                    {c.decidedAt}
                  </Text>
                </View>
                <Text
                  className="mt-2 font-kr text-sm text-fg"
                  numberOfLines={2}
                >
                  {c.summary}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Spacer for bottom CTAs */}
        <View className="h-24" />
      </ScrollView>

      {/* ═══ BOTTOM CTAS (fixed) ═══ */}
      <View className="border-t border-white/5 bg-surface-low px-4 py-3">
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => router.push(`/chat/statute-${id}` as any)}
            className="flex-1 h-12 flex-row items-center justify-center rounded bg-violet"
            style={{
              shadowColor: "#A855F7",
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.4,
              shadowRadius: 16,
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
