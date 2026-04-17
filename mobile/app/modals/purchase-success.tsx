import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Button } from "@/components/ui/Button";

export default function PurchaseSuccessModal() {
  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <View
        className="absolute inset-0"
        style={{ backgroundColor: "#A855F7", opacity: 0.08 }}
      />

      <View className="flex-1 items-center justify-center px-6">
        <View className="h-24 w-24 items-center justify-center rounded-full border-2 border-violet bg-violet/20">
          <Text className="font-mono text-5xl text-violet-glow">✓</Text>
        </View>

        <Text className="mt-8 font-mono text-[10px] uppercase tracking-wider text-violet-glow">
          // purchase complete
        </Text>
        <Text className="mt-3 font-kr text-3xl font-bold leading-tight tracking-tightest text-fg">
          환영합니다!
        </Text>
        <Text className="mt-4 text-center font-kr text-base leading-7 text-dim">
          LAW.OS Pro 멤버가 되신 것을 축하합니다.{"\n"}
          이제 무제한으로 공부할 수 있어요.
        </Text>

        <View className="mt-10 w-full max-w-sm rounded-[6px] border border-white/10 bg-surface-high p-4">
          <Text className="font-mono text-[10px] uppercase text-dim">// your plan</Text>
          <View className="mt-3 flex-row items-baseline justify-between">
            <Text className="font-kr text-lg font-semibold text-fg">Pro 연간</Text>
            <Text className="font-mono text-sm text-cyan">₩79,000/년</Text>
          </View>
          <Text className="mt-2 font-mono text-[10px] text-dim">
            // 다음 결제: 2027-04-15
          </Text>
        </View>

        <View className="mt-10 w-full max-w-sm">
          <Button variant="primary" onPress={() => router.replace("/(tabs)" as any)}>
            바로 공부 시작하기 →
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}
