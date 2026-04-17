import { ScrollView, Text, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

/**
 * 🎨 Stitch Reference: projects/7657386961511176864/screens/d9bf6414f5334c4b98bef3561b8d2224
 * Paywall Modal — 무료 한도 초과 업그레이드
 */

const BENEFITS = [
  { icon: "✓", label: "하루 무제한 질문", sub: "자유롭게 공부하세요" },
  { icon: "✓", label: "Deep Debate 모드", sub: "4명 AI 패널 토론" },
  { icon: "✓", label: "답변 우선 응답", sub: "평균 1.2초" },
  { icon: "✓", label: "오프라인 캐시", sub: "지하철에서도 OK" },
];

const PLANS = [
  {
    code: "monthly",
    label: "월간",
    price: "₩9,900",
    period: "/월",
    note: null,
  },
  {
    code: "annual",
    label: "연간",
    price: "₩79,000",
    period: "/년",
    note: "33% 할인",
    wasPrice: "₩118,800",
    recommended: true,
  },
  {
    code: "student",
    label: "학생",
    price: "₩4,900",
    period: "/월",
    note: "학생증 인증 필요",
  },
];

export default function PaywallModal() {
  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      {/* Background glow overlay */}
      <View
        className="absolute inset-0"
        style={{
          backgroundColor: "#A855F7",
          opacity: 0.08,
          pointerEvents: "none",
        }}
      />

      <ScrollView className="flex-1">
        {/* ═══ CLOSE BUTTON ═══ */}
        <View className="flex-row justify-end px-6 pt-4">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center"
          >
            <Text className="font-mono text-sm text-dim">✕</Text>
          </Pressable>
        </View>

        {/* ═══ QUOTA COUNTER ═══ */}
        <View className="items-center px-6 pt-4">
          <Text
            className="font-mono text-5xl font-bold text-cyan"
            style={{
              shadowColor: "#06B6D4",
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.5,
              shadowRadius: 16,
            }}
          >
            10 / 10
          </Text>
          <Text className="mt-2 font-kr text-base text-dim">
            오늘의 질문 한도에 도달했습니다
          </Text>
        </View>

        {/* ═══ HEADLINE ═══ */}
        <View className="mt-10 items-center px-6">
          <Text
            className="text-center font-kr text-4xl font-bold leading-tight tracking-tightest text-fg"
            style={{
              shadowColor: "#A855F7",
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.4,
              shadowRadius: 20,
            }}
          >
            Pro로{"\n"}업그레이드하세요
          </Text>
          <Text className="mt-3 text-center font-kr text-base text-dim">
            무제한 질문 · Deep Debate · 우선 응답
          </Text>
        </View>

        {/* ═══ BENEFITS ═══ */}
        <View className="mt-10 px-6">
          <View className="gap-3">
            {BENEFITS.map((b) => (
              <View
                key={b.label}
                className="flex-row items-center gap-3 rounded border border-white/10 bg-surface p-3"
              >
                <View className="h-8 w-8 items-center justify-center rounded bg-cyan/20">
                  <Text className="font-mono text-sm text-cyan">{b.icon}</Text>
                </View>
                <View className="flex-1">
                  <Text className="font-kr text-sm font-semibold text-fg">
                    {b.label}
                  </Text>
                  <Text className="font-mono text-[10px] text-dim">
                    // {b.sub}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ═══ PLANS ═══ */}
        <View className="mt-10 px-6">
          <Text className="font-mono text-[10px] uppercase tracking-wider text-cyan">
            // 플랜 선택
          </Text>
          <View className="mt-3 gap-3">
            {PLANS.map((p) => (
              <Pressable
                key={p.code}
                onPress={() => router.push("/modals/purchase-success" as any)}
                className={`rounded border p-4 ${
                  p.recommended
                    ? "border-violet bg-violet/10"
                    : "border-white/10 bg-surface"
                }`}
              >
                <View className="flex-row items-center justify-between">
                  <View>
                    <View className="flex-row items-center gap-2">
                      <Text
                        className={`font-kr text-base font-bold ${
                          p.recommended ? "text-violet-glow" : "text-fg"
                        }`}
                      >
                        {p.label}
                      </Text>
                      {p.note ? (
                        <View className="rounded bg-violet px-2 py-0.5">
                          <Text className="font-mono text-[10px] text-white">
                            {p.note}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    {p.wasPrice ? (
                      <Text className="mt-1 font-mono text-[10px] text-dim line-through">
                        {p.wasPrice}
                      </Text>
                    ) : null}
                  </View>
                  <View className="flex-row items-baseline">
                    <Text
                      className={`font-mono text-2xl font-bold ${
                        p.recommended ? "text-violet-glow" : "text-fg"
                      }`}
                    >
                      {p.price}
                    </Text>
                    <Text className="font-mono text-xs text-dim">
                      {p.period}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ═══ FOOTER ═══ */}
        <View className="mt-8 items-center gap-3 px-6 pb-10">
          <Pressable onPress={() => router.push("/profile/subscription" as any)}>
            <Text className="font-mono text-xs text-dim underline">
              이미 구독 중 · 복원하기
            </Text>
          </Pressable>
          <Text className="font-mono text-[10px] text-dim">
            // 7일 무료 체험 · 언제든 해지 · 영수증 제공
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
