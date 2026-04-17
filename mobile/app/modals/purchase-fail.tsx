import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Button } from "@/components/ui/Button";

export default function PurchaseFailModal() {
  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <View className="flex-1 items-center justify-center px-6">
        <View className="h-24 w-24 items-center justify-center rounded-full border-2 border-danger bg-danger/10">
          <Text className="font-mono text-5xl text-danger">✕</Text>
        </View>

        <Text className="mt-8 font-mono text-[10px] uppercase tracking-wider text-danger">
          // purchase failed
        </Text>
        <Text className="mt-3 font-kr text-3xl font-bold leading-tight tracking-tightest text-fg">
          결제를 완료하지 못했어요
        </Text>
        <Text className="mt-4 text-center font-kr text-base leading-7 text-dim">
          카드 정보를 확인하거나 다른 결제 수단을 시도해주세요.
          금액은 청구되지 않았습니다.
        </Text>

        <View className="mt-8 w-full max-w-sm rounded-[6px] border border-danger/30 bg-surface-high p-4">
          <Text className="font-mono text-[10px] uppercase text-dim">// error code</Text>
          <Text className="mt-2 font-mono text-xs text-danger">
            CARD_DECLINED · insufficient_funds
          </Text>
        </View>

        <View className="mt-10 w-full max-w-sm gap-3">
          <Button variant="primary" onPress={() => router.replace("/modals/paywall" as any)}>
            다시 시도
          </Button>
          <Button variant="ghost" onPress={() => router.back()}>
            나중에
          </Button>
        </View>

        <Text className="mt-6 font-mono text-[10px] text-dim">
          // 문의: hello@lawos.kr
        </Text>
      </View>
    </SafeAreaView>
  );
}
