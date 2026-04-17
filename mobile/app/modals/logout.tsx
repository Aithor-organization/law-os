import { useState } from "react";
import { Text, View, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Button } from "@/components/ui/Button";
import { signOut } from "@/lib/auth";

export default function LogoutModal() {
  const [submitting, setSubmitting] = useState(false);

  const confirm = async () => {
    setSubmitting(true);
    const { error } = await signOut();
    setSubmitting(false);
    if (error) {
      Alert.alert("로그아웃 실패", error.message);
      return;
    }
    router.replace("/(auth)/login" as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-bg/95" edges={["top", "bottom"]}>
      <View className="flex-1 items-center justify-center px-6">
        <View className="w-full max-w-sm rounded-[6px] border border-white/10 bg-surface-high p-6">
          <Text className="font-mono text-[10px] uppercase tracking-wider text-violet-glow">
            // logout · confirm
          </Text>
          <Text className="mt-4 font-kr text-2xl font-bold leading-tight tracking-tight text-fg">
            정말 로그아웃 할까요?
          </Text>
          <Text className="mt-3 font-kr text-sm leading-6 text-dim">
            다시 로그인하면 모든 대화와 서재 노트는 그대로 유지됩니다.
            오프라인 캐시만 삭제됩니다.
          </Text>

          <View className="mt-8 gap-3">
            <Button variant="primary" onPress={confirm} disabled={submitting}>
              {submitting ? "로그아웃 중..." : "로그아웃"}
            </Button>
            <Pressable onPress={() => router.back()} className="items-center py-3">
              <Text className="font-kr text-sm text-dim">취소</Text>
            </Pressable>
          </View>
        </View>

        <Text className="mt-6 font-mono text-[10px] text-dim">
          // session is encrypted at rest
        </Text>
      </View>
    </SafeAreaView>
  );
}
