import { ScrollView, Text, View, Pressable, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Button } from "@/components/ui/Button";

export default function BlockedModal() {
  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <View className="flex-row justify-end px-6 pt-4">
        <Pressable onPress={() => router.back()}>
          <Text className="font-mono text-[10px] uppercase text-dim">close ×</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="mt-8 px-6">
          <Text className="font-mono text-[10px] uppercase tracking-wider text-amber">
            // blocked · 변호사법 대응
          </Text>
          <Text className="mt-4 font-kr text-3xl font-bold leading-tight tracking-tightest text-fg">
            개인 사건 조언은{"\n"}제공할 수 없습니다
          </Text>
          <Text className="mt-4 font-kr text-base text-dim">
            LAW.OS는 법학 학습 도구입니다. 구체적인 개인 사건에 대한
            자문·대리·판단은 변호사만이 할 수 있습니다 (변호사법 제109조).
          </Text>
        </View>

        <View className="mx-6 mt-8 rounded-[6px] border border-white/10 bg-surface-high p-5">
          <Text className="font-mono text-[10px] uppercase tracking-wider text-violet-glow">
            // 대신 이렇게 물어보세요
          </Text>
          <View className="mt-4 gap-3">
            <View>
              <Text className="font-kr text-xs text-danger">
                ❌ "제가 계약 어겼는데 어떡해요?"
              </Text>
              <Text className="mt-1 font-kr text-xs text-cyan">
                ✅ "민법상 채무불이행의 일반적 요건은?"
              </Text>
            </View>
            <View>
              <Text className="font-kr text-xs text-danger">
                ❌ "저희 부모님 상속 문제인데요"
              </Text>
              <Text className="mt-1 font-kr text-xs text-cyan">
                ✅ "법정상속분 계산 원칙은 어떻게 되나요?"
              </Text>
            </View>
          </View>
        </View>

        <View className="mx-6 mt-6 rounded-[6px] border border-cyan/20 bg-surface p-5">
          <Text className="font-mono text-[10px] uppercase tracking-wider text-cyan">
            // 실제 법률 상담이 필요하신가요?
          </Text>
          <Text className="mt-3 font-kr text-sm text-fg">대한변호사협회 법률상담</Text>
          <Pressable onPress={() => Linking.openURL("tel:02-3476-4000")}>
            <Text className="mt-1 font-mono text-sm text-violet-glow underline">
              02-3476-4000
            </Text>
          </Pressable>
          <Text className="mt-2 font-kr text-xs text-dim">
            평일 09:00–18:00 · 무료 15분 상담
          </Text>
        </View>

        <View className="mt-10 gap-3 px-6 pb-8">
          <Button variant="primary" onPress={() => router.replace("/(tabs)" as any)}>
            일반 질문으로 수정
          </Button>
          <Button variant="ghost" onPress={() => router.push("/profile/legal" as any)}>
            법적 고지 다시 읽기
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
