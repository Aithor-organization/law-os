import { useState } from "react";
import { ScrollView, Text, View, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { signInWithEmail } from "@/lib/auth";
import { registerPushToken } from "@/lib/pushTokens";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    setSubmitting(true);
    const { error } = await signInWithEmail(email.trim(), password);
    setSubmitting(false);
    if (error) {
      Alert.alert("로그인 실패", error.message);
      return;
    }
    // Best-effort push token registration — fire and forget so it doesn't
    // delay the nav. Fails silently on simulator / permission denied.
    void registerPushToken();
    router.replace("/(tabs)" as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-6 pt-4">
          <Text className="font-mono text-[10px] uppercase tracking-wider text-violet-glow">
            // sign in · v1.0.0
          </Text>
          <View className="mt-2 flex-row items-baseline gap-2">
            <Text className="font-mono text-2xl font-bold text-violet-glow">
              LAW.OS
            </Text>
            <Text className="font-mono text-[10px] text-cyan">v1.0.0</Text>
          </View>
        </View>

        <View className="mt-16 px-6">
          <Text className="font-kr text-4xl font-bold leading-tight tracking-tightest text-fg">
            다시 오신 것을{"\n"}환영합니다
          </Text>
          <Text className="mt-3 font-kr text-base text-dim">
            법률 공부의 연장선 · 오늘도 함께합니다
          </Text>
        </View>

        <View className="mt-12 gap-6 px-6">
          <Input
            label="// email"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Input
            label="// password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            rightIcon={
              <Pressable onPress={() => setShowPassword((s) => !s)}>
                <Text className="font-mono text-[10px] uppercase text-dim">
                  {showPassword ? "hide" : "show"}
                </Text>
              </Pressable>
            }
          />
          <Pressable
            onPress={() => router.push("/(auth)/forgot-password" as any)}
            className="self-end"
          >
            <Text className="font-mono text-xs text-dim underline">
              // forgot password?
            </Text>
          </Pressable>
        </View>

        <View className="mt-10 px-6">
          <Button
            variant="primary"
            onPress={handleLogin}
            disabled={!email || !password || submitting}
          >
            {submitting ? "로그인 중..." : "로그인"}
          </Button>
        </View>

        <View className="mt-14 items-center gap-4 px-6 pb-8">
          <View className="flex-row items-baseline gap-2">
            <Text className="font-kr text-sm text-dim">
              아직 LAW.OS가 처음이신가요?
            </Text>
            <Pressable onPress={() => router.push("/(auth)/signup" as any)}>
              <Text className="font-kr text-sm font-semibold text-violet-glow">
                가입하기 →
              </Text>
            </Pressable>
          </View>
          <Pressable onPress={() => router.push("/showcase" as any)}>
            <Text className="font-mono text-[10px] text-cyan underline">
              // dev: all screens showcase →
            </Text>
          </Pressable>
          <Text className="font-mono text-[10px] text-dim">
            // 법률 학습 도구 · 법률 상담 아님
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
