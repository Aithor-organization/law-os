import { useState } from "react";
import { ScrollView, Text, View, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Button } from "@/components/ui/Button";
import { signUpWithEmail, recordConsent } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { getPendingSignup, clearPendingSignup } from "@/lib/pendingSignup";

const CONSENTS = [
  {
    key: "tos",
    title: "이용약관 동의 (필수)",
    body: "서비스 이용 조건 및 책임 범위에 대한 약관입니다.",
    href: "/profile/tos" as const,
  },
  {
    key: "privacy",
    title: "개인정보 처리방침 동의 (필수)",
    body: "이메일, 이름, 학습 기록 등 수집·이용에 대한 고지입니다.",
    href: "/profile/privacy" as const,
  },
  {
    key: "legal",
    title: "법적 고지 동의 (필수)",
    body: "LAW.OS는 법학 학습 도구이며 법률 자문이 아닙니다. 구체적인 법률 문제는 반드시 변호사에게 상담하세요.",
    href: "/profile/legal" as const,
  },
];

export default function ConsentDisclaimerScreen() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const allChecked = CONSENTS.every((c) => checked[c.key]);

  const toggle = (k: string) => setChecked((s) => ({ ...s, [k]: !s[k] }));
  const checkAll = () =>
    setChecked(Object.fromEntries(CONSENTS.map((c) => [c.key, true])));

  const handleConfirm = async () => {
    const pending = getPendingSignup();
    if (!pending) {
      Alert.alert(
        "가입 정보 없음",
        "가입 화면으로 돌아가 이름/이메일/비밀번호를 다시 입력해주세요.",
      );
      router.replace("/(auth)/signup" as any);
      return;
    }

    setSubmitting(true);
    const { data, error } = await signUpWithEmail(pending);
    if (error) {
      setSubmitting(false);
      Alert.alert("가입 실패", error.message);
      return;
    }

    // If email confirmation is enabled in Supabase, session will be null until
    // the user clicks the verification link. Guide them accordingly.
    if (!data.session) {
      setSubmitting(false);
      clearPendingSignup();
      Alert.alert(
        "이메일을 확인해주세요",
        `${pending.email}로 인증 메일을 보냈습니다. 메일의 링크를 클릭한 뒤 로그인해주세요.`,
        [{ text: "로그인으로", onPress: () => router.replace("/(auth)/login" as any) }],
      );
      return;
    }

    // Session active → write consent timestamps to profiles row (DB trigger
    // already created it). PIPA requires a durable audit trail; if this
    // write fails we must not leave a consent-less account behind, so we
    // sign out as a best-effort rollback. A full server-side delete would
    // be better but requires an admin-scoped edge function.
    const consentResult = await recordConsent(pending.name);
    setSubmitting(false);
    if (consentResult.error) {
      // Roll back local session so the consent-less account can't be used.
      // The orphan auth row itself still exists — flag for support follow-up.
      await supabase.auth.signOut().catch(() => {});
      Alert.alert(
        "가입 실패 · 재시도 필요",
        `동의 정보 저장에 실패했습니다 (${consentResult.error.message}). 네트워크를 확인하고 다시 가입해주세요. 문제가 지속되면 support@lawos.kr 로 연락주세요.`,
        [{ text: "가입 화면으로", onPress: () => router.replace("/(auth)/signup" as any) }],
      );
      return;
    }
    clearPendingSignup();
    router.replace("/(auth)/onboarding" as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="px-6 pt-4">
          <Pressable onPress={() => router.back()}>
            <Text className="font-mono text-[10px] uppercase text-dim">← back</Text>
          </Pressable>
          <Text className="mt-6 font-mono text-[10px] uppercase tracking-wider text-violet-glow">
            // sign up · step 2 of 2 · consent
          </Text>
        </View>

        <View className="mt-8 px-6">
          <Text className="font-kr text-4xl font-bold leading-tight tracking-tightest text-fg">
            약관에{"\n"}동의해주세요
          </Text>
          <Text className="mt-3 font-kr text-base text-dim">
            서비스 이용을 위해 아래 3가지 항목에 모두 동의가 필요합니다.
          </Text>
        </View>

        <Pressable
          onPress={checkAll}
          className="mx-6 mt-8 flex-row items-center justify-between rounded-[6px] border border-violet/40 bg-surface-high px-4 py-4"
        >
          <Text className="font-kr text-base font-semibold text-fg">
            모두 동의합니다
          </Text>
          <View
            className={`h-6 w-6 items-center justify-center rounded-[4px] ${
              allChecked ? "bg-violet" : "border border-white/20"
            }`}
          >
            {allChecked && <Text className="font-mono text-xs text-white">✓</Text>}
          </View>
        </Pressable>

        <View className="mt-6 gap-4 px-6">
          {CONSENTS.map((c) => (
            <Pressable
              key={c.key}
              onPress={() => toggle(c.key)}
              className="rounded-[6px] border border-white/10 bg-surface px-4 py-4"
            >
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <Text className="font-kr text-base font-semibold text-fg">
                    {c.title}
                  </Text>
                  <Text className="mt-2 font-kr text-xs leading-5 text-dim">
                    {c.body}
                  </Text>
                </View>
                <View
                  className={`mt-1 h-5 w-5 items-center justify-center rounded-[4px] ${
                    checked[c.key] ? "bg-violet" : "border border-white/20"
                  }`}
                >
                  {checked[c.key] && (
                    <Text className="font-mono text-[10px] text-white">✓</Text>
                  )}
                </View>
              </View>
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  router.push(c.href as any);
                }}
                hitSlop={8}
                accessibilityRole="link"
                accessibilityLabel={`${c.title} 전문 보기`}
                className="mt-3 self-start"
              >
                <Text className="font-mono text-[10px] uppercase text-cyan">
                  // 전문 보기 →
                </Text>
              </Pressable>
            </Pressable>
          ))}
        </View>

        <View className="mt-10 gap-3 px-6 pb-8">
          <Button
            variant="primary"
            disabled={!allChecked || submitting}
            onPress={handleConfirm}
          >
            {submitting ? "가입 중..." : "동의하고 계정 만들기"}
          </Button>
          <Text className="text-center font-mono text-[10px] text-dim">
            // 동의 시각은 계정 생성 시 기록됩니다
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
