import { useState } from "react";
import { ScrollView, Text, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { setPendingSignup } from "@/lib/pendingSignup";

export default function SignupScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const canSubmit = name.length > 0 && email.includes("@") && password.length >= 8;

  const handleNext = () => {
    setPendingSignup({ name: name.trim(), email: email.trim(), password });
    router.push("/(auth)/consent-disclaimer" as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="px-6 pt-4">
          <Pressable onPress={() => router.back()}>
            <Text className="font-mono text-[10px] uppercase text-dim">← back</Text>
          </Pressable>
          <Text className="mt-6 font-mono text-[10px] uppercase tracking-wider text-violet-glow">
            // sign up · step 1 of 2
          </Text>
        </View>

        <View className="mt-8 px-6">
          <Text className="font-kr text-4xl font-bold leading-tight tracking-tightest text-fg">
            처음 오셨군요,{"\n"}환영합니다
          </Text>
          <Text className="mt-3 font-kr text-base text-dim">
            이메일과 비밀번호로 가입하세요. 다음 단계에서 약관 동의가 필요합니다.
          </Text>
        </View>

        <View className="mt-10 gap-6 px-6">
          <Input label="// name" placeholder="홍길동" value={name} onChangeText={setName} />
          <Input
            label="// email"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Input
            label="// password · 8자 이상"
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
        </View>

        <View className="mt-10 px-6">
          <Button variant="primary" disabled={!canSubmit} onPress={handleNext}>
            다음: 약관 동의 →
          </Button>
        </View>

        <View className="my-8 flex-row items-center gap-4 px-6">
          <View className="h-px flex-1 bg-white/10" />
          <Text className="font-mono text-[10px] uppercase tracking-wider text-dim">또는</Text>
          <View className="h-px flex-1 bg-white/10" />
        </View>

        <View className="gap-3 px-6">
          <Button variant="ghost" onPress={() => router.replace("/(tabs)" as any)}>
             Apple로 가입
          </Button>
          <Button variant="ghost" onPress={() => router.replace("/(tabs)" as any)}>
            G Google로 가입
          </Button>
          <Button variant="ghost" onPress={() => router.replace("/(tabs)" as any)}>
            K Kakao로 가입
          </Button>
        </View>

        <View className="mt-10 items-center gap-3 px-6 pb-8">
          <Text className="font-mono text-[10px] text-dim">
            // 법률 학습 도구 · 법률 상담 아님
          </Text>
          <Pressable onPress={() => router.replace("/(auth)/login" as any)}>
            <Text className="font-kr text-sm text-dim">
              이미 가입하셨나요?{" "}
              <Text className="font-semibold text-violet-glow">로그인 →</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
