import { useState } from "react";
import { ScrollView, Text, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

/**
 * 🎨 Stitch Reference: projects/7657386961511176864/screens/3f20490d4b48480aa10157ce29d13fe4
 * Design: Dark Academia Pro / Sovereign Terminal
 *
 * 🛠 Demo mode: 모든 인증 버튼은 즉시 tabs 홈으로 진입합니다.
 */
export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const goHome = () => router.replace("/(tabs)" as any);

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
          <Button variant="primary" onPress={goHome}>
            로그인 (데모: 바로 진입)
          </Button>
        </View>

        <View className="my-10 flex-row items-center gap-4 px-6">
          <View className="h-px flex-1 bg-white/10" />
          <Text className="font-mono text-[10px] uppercase tracking-wider text-dim">
            또는 · or
          </Text>
          <View className="h-px flex-1 bg-white/10" />
        </View>

        <View className="gap-3 px-6">
          <Button variant="ghost" onPress={goHome}>
             Apple로 계속하기
          </Button>
          <Button variant="ghost" onPress={goHome}>
            G Google로 계속하기
          </Button>
          <Button variant="ghost" onPress={goHome}>
            K Kakao로 계속하기
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
