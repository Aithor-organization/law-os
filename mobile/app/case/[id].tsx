import { ScrollView, Text, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";

/**
 * 🎨 Stitch Reference: projects/7657386961511176864/screens/48da99c5072648ce820955f35ccf31ee
 * Case Detail — 판례 상세
 */

const CASE = {
  caseNo: "2018다12345",
  court: "대법원",
  decidedAt: "2020-03-15",
  category: "민사",
  title: "손해배상(기)",
  summary:
    "불법행위에 있어 고의 또는 과실의 판단 기준과 전문가의 주의의무 범위에 관한 사안",
  judgmentPoints: [
    "민법 제750조에서 말하는 '고의'에는 미필적 고의도 포함된다.",
    "전문가의 과실 판단에는 해당 직업군에 요구되는 평균적 주의의무가 적용된다.",
    "손해배상의 범위는 상당인과관계가 인정되는 손해에 한한다.",
  ],
  fullTextPreview:
    "원고는 피고의 과실로 인한 손해의 배상을 구한다. 피고는 자신의 전문직 업무를 수행하는 과정에서 통상적인 주의를 다하였다고 주장하나, 법원이 심리한 결과 해당 업무에 요구되는 전문가로서의 평균적 주의의무를 다하지 못한 사실이 인정된다.",
  relatedStatutes: [
    { id: "civil-750", label: "민법 제750조", sub: "불법행위의 내용" },
    { id: "civil-763", label: "민법 제763조", sub: "준용규정" },
    { id: "civil-393", label: "민법 제393조", sub: "손해배상의 범위" },
  ],
};

export default function CaseDetailScreen() {
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
          // case · {id}
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
        {/* ═══ BADGES ═══ */}
        <View className="px-6 pt-6">
          <View className="flex-row flex-wrap gap-2">
            <View className="rounded border border-cyan/30 bg-cyan/10 px-3 py-1">
              <Text className="font-mono text-[10px] uppercase text-cyan">
                {CASE.court}
              </Text>
            </View>
            <View className="rounded border border-white/10 bg-surface px-3 py-1">
              <Text className="font-mono text-[10px] uppercase text-dim">
                {CASE.category}
              </Text>
            </View>
            <View className="rounded border border-white/10 bg-surface px-3 py-1">
              <Text className="font-mono text-[10px] text-dim">
                {CASE.decidedAt}
              </Text>
            </View>
          </View>
        </View>

        {/* ═══ CASE NUMBER + TITLE ═══ */}
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
            {CASE.caseNo}
          </Text>
          <Text className="mt-2 font-kr text-xl font-semibold text-fg">
            {CASE.title}
          </Text>
        </View>

        {/* ═══ SUMMARY ═══ */}
        <View className="mt-6 px-6">
          <Text className="font-mono text-[10px] uppercase tracking-wider text-cyan">
            // 요지
          </Text>
          <View className="mt-3 flex-row">
            <View className="mr-3 w-0.5 rounded-full bg-cyan" />
            <View className="flex-1 rounded bg-surface p-4">
              <Text className="font-kr text-base leading-6 text-fg">
                {CASE.summary}
              </Text>
            </View>
          </View>
        </View>

        {/* ═══ JUDGMENT POINTS ═══ */}
        <View className="mt-8 px-6">
          <Text className="font-mono text-[10px] uppercase tracking-wider text-violet-glow">
            // 판시사항 ({CASE.judgmentPoints.length})
          </Text>
          <View className="mt-3 gap-3">
            {CASE.judgmentPoints.map((point, i) => (
              <View
                key={i}
                className="flex-row gap-3 rounded border border-white/10 bg-surface p-4"
              >
                <Text className="font-mono text-sm font-bold text-violet-glow">
                  {String(i + 1).padStart(2, "0")}
                </Text>
                <Text className="flex-1 font-kr text-sm leading-6 text-fg">
                  {point}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ═══ FULL TEXT PREVIEW ═══ */}
        <View className="mt-8 px-6">
          <View className="flex-row items-center justify-between">
            <Text className="font-mono text-[10px] uppercase tracking-wider text-cyan">
              // 전문 (preview)
            </Text>
            <Pressable>
              <Text className="font-mono text-[10px] text-violet-glow underline">
                전체 보기 →
              </Text>
            </Pressable>
          </View>
          <View className="mt-3 rounded bg-surface-low p-4">
            <Text className="font-kr text-sm leading-6 text-dim">
              {CASE.fullTextPreview}
            </Text>
          </View>
        </View>

        {/* ═══ RELATED STATUTES ═══ */}
        <View className="mt-8 px-6">
          <Text className="font-mono text-[10px] uppercase tracking-wider text-violet-glow">
            // 관련 조문 ({CASE.relatedStatutes.length})
          </Text>
          <View className="mt-3 gap-2">
            {CASE.relatedStatutes.map((s) => (
              <Pressable
                key={s.id}
                onPress={() => router.push(`/statute/${s.id}` as any)}
                className="flex-row items-center gap-3 rounded border border-white/10 bg-surface p-3"
              >
                <View className="h-8 w-8 items-center justify-center rounded bg-violet/20">
                  <Text className="font-mono text-[10px] text-violet-glow">
                    조
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="font-kr text-sm font-semibold text-fg">
                    {s.label}
                  </Text>
                  <Text className="font-mono text-[10px] text-dim">
                    ({s.sub})
                  </Text>
                </View>
                <Text className="font-mono text-xs text-dim">→</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="h-24" />
      </ScrollView>

      {/* ═══ BOTTOM CTA ═══ */}
      <View className="border-t border-white/5 bg-surface-low px-4 py-3">
        <Pressable
          onPress={() => router.push(`/chat/case-${id}` as any)}
          className="h-12 flex-row items-center justify-center rounded bg-violet"
          style={{
            shadowColor: "#A855F7",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.4,
            shadowRadius: 16,
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
