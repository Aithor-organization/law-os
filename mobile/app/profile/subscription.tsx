import { ScrollView, Text, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Button } from "@/components/ui/Button";

const SUB = {
  plan: "Pro 연간",
  status: "active",
  price: "₩79,000/년",
  startedAt: "2026-04-15",
  nextBillAt: "2027-04-15",
  provider: "Apple",
};

const USAGE = [
  { label: "이번달 질문", value: "847", cap: "∞" },
  { label: "Deep Debate", value: "12", cap: "∞" },
  { label: "저장된 노트", value: "142", cap: "∞" },
];

export default function SubscriptionScreen() {
  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <View className="flex-row items-center gap-4 px-6 pt-4">
        <Pressable onPress={() => router.back()}>
          <Text className="font-mono text-[10px] uppercase text-dim">← back</Text>
        </Pressable>
        <Text className="font-mono text-[10px] uppercase text-violet-glow">
          // subscription
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="mt-8 px-6">
          <Text className="font-kr text-3xl font-bold tracking-tightest text-fg">
            구독 관리
          </Text>
        </View>

        <View className="mx-6 mt-8 overflow-hidden rounded-[6px] border border-violet/40 bg-surface-high">
          <View
            className="px-5 py-6"
            style={{ backgroundColor: "rgba(168, 85, 247, 0.08)" }}
          >
            <View className="flex-row items-center justify-between">
              <Text className="font-mono text-[10px] uppercase tracking-wider text-violet-glow">
                // active plan
              </Text>
              <View className="rounded-full bg-violet/30 px-3 py-1">
                <Text className="font-mono text-[10px] uppercase text-violet-glow">
                  {SUB.status}
                </Text>
              </View>
            </View>
            <Text className="mt-3 font-kr text-2xl font-bold text-fg">{SUB.plan}</Text>
            <Text className="mt-1 font-mono text-sm text-cyan">{SUB.price}</Text>
          </View>

          <View className="gap-3 px-5 py-4">
            <View className="flex-row justify-between">
              <Text className="font-mono text-[10px] uppercase text-dim">// 시작일</Text>
              <Text className="font-mono text-xs text-fg">{SUB.startedAt}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="font-mono text-[10px] uppercase text-dim">
                // 다음 결제일
              </Text>
              <Text className="font-mono text-xs text-fg">{SUB.nextBillAt}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="font-mono text-[10px] uppercase text-dim">// 결제 수단</Text>
              <Text className="font-mono text-xs text-fg">{SUB.provider}</Text>
            </View>
          </View>
        </View>

        <View className="mt-8 px-6">
          <Text className="font-mono text-[10px] uppercase tracking-wider text-dim">
            // 이번달 사용량
          </Text>
          <View className="mt-4 gap-3">
            {USAGE.map((u) => (
              <View
                key={u.label}
                className="flex-row items-center justify-between rounded-[6px] border border-white/10 bg-surface px-4 py-3"
              >
                <Text className="font-kr text-sm text-fg">{u.label}</Text>
                <Text className="font-mono text-xs text-cyan">
                  {u.value} / {u.cap}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View className="mt-10 gap-3 px-6">
          <Button variant="ghost" onPress={() => router.push("/modals/paywall" as any)}>
            플랜 변경
          </Button>
          <Button variant="ghost" onPress={() => {}}>
            결제 내역 보기
          </Button>
          <Pressable className="items-center py-3">
            <Text className="font-kr text-xs text-danger underline">
              구독 해지
            </Text>
          </Pressable>
        </View>

        <Text className="mt-8 text-center font-mono text-[10px] text-dim">
          // {SUB.provider} 스토어를 통해 관리됩니다
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
