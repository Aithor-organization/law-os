import { useState } from "react";
import { Alert, ScrollView, Text, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { sendPasswordReset } from "@/lib/auth";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!email || sending) return;
    setSending(true);
    const { error } = await sendPasswordReset(email);
    setSending(false);
    if (error) {
      Alert.alert("전송 실패", error.message);
      return;
    }
    setSent(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="px-6 pt-4">
          <Pressable onPress={() => router.back()}>
            <Text className="font-mono text-[10px] uppercase text-dim">← back</Text>
          </Pressable>
          <Text className="mt-6 font-mono text-[10px] uppercase tracking-wider text-violet-glow">
            // reset password
          </Text>
        </View>

        <View className="mt-12 px-6">
          <Text className="font-kr text-4xl font-bold leading-tight tracking-tightest text-fg">
            비밀번호를{"\n"}잊으셨나요?
          </Text>
          <Text className="mt-4 font-kr text-base text-dim">
            가입하신 이메일로 재설정 링크를 보내드립니다.
          </Text>
        </View>

        {!sent ? (
          <>
            <View className="mt-12 px-6">
              <Input
                label="// email"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            <View className="mt-10 px-6">
              <Button variant="primary" onPress={handleSend} disabled={!email || sending}>
                {sending ? "전송 중..." : "재설정 링크 보내기"}
              </Button>
            </View>
          </>
        ) : (
          <View className="mt-12 mx-6 rounded-[6px] border border-cyan/30 bg-surface-high px-6 py-8">
            <Text className="font-mono text-[10px] uppercase tracking-wider text-cyan">
              // sent
            </Text>
            <Text className="mt-4 font-kr text-lg font-semibold text-fg">
              이메일을 확인하세요
            </Text>
            <Text className="mt-2 font-kr text-sm text-dim">
              {email}로 재설정 링크를 발송했습니다. 10분 내 만료됩니다.
            </Text>
            <View className="mt-6">
              <Button variant="ghost" onPress={() => router.replace("/(auth)/login" as any)}>
                로그인으로 돌아가기
              </Button>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
