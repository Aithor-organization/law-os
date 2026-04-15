import { useState } from "react";
import { ScrollView, Text, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Button } from "@/components/ui/Button";

/**
 * 🎨 Stitch Reference:
 * - Step 1: b0e79726b27b4e36b191ca2f2862e772
 * - Step 2: de39bda81eaf498c902872f1374f9945
 * - Step 3: 75492506a2744e969365715e8be5f675
 *
 * 3-step wizard with local state. 마지막 단계 완료 시 tabs로 진입.
 */

const SUBJECTS = [
  { code: "civil", label: "민법", sub: "1,118 조문" },
  { code: "criminal", label: "형법", sub: "372 조문" },
  { code: "constitutional", label: "헌법", sub: "130 조문" },
  { code: "commercial", label: "상법", sub: "935 조문" },
];

const USER_TYPES = [
  { code: "law_school", label: "로스쿨 재학" },
  { code: "bar_exam", label: "변시 수험생" },
  { code: "undergrad", label: "법학과 학부생" },
  { code: "other", label: "기타" },
];

export default function OnboardingScreen() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [userType, setUserType] = useState<string | null>(null);
  const [goal, setGoal] = useState<string | null>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  const toggleSubject = (code: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  };

  const handleNext = () => {
    if (step < 3) {
      setStep((s) => (s + 1) as 1 | 2 | 3);
    } else {
      router.replace("/(tabs)" as any);
    }
  };

  const canProceed =
    (step === 1 && userType && goal) ||
    (step === 2 && selectedSubjects.length > 0) ||
    step === 3;

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Progress indicator */}
        <View className="px-6 pt-4">
          <View className="flex-row items-center justify-between">
            <Text className="font-mono text-[10px] uppercase tracking-wider text-violet-glow">
              // step {step} of 3 · onboarding
            </Text>
            <Pressable onPress={() => router.replace("/(tabs)" as any)}>
              <Text className="font-mono text-[10px] text-dim">skip →</Text>
            </Pressable>
          </View>
          <View className="mt-3 flex-row gap-2">
            {[1, 2, 3].map((i) => (
              <View
                key={i}
                className={`h-1 flex-1 rounded-full ${
                  i <= step ? "bg-violet" : "bg-white/10"
                }`}
              />
            ))}
          </View>
        </View>

        {/* ═══ STEP 1: 학년 / 목표 ═══ */}
        {step === 1 ? (
          <View className="mt-10 px-6">
            <Text className="font-kr text-3xl font-bold leading-tight tracking-tightest text-fg">
              어떤 분이신가요?
            </Text>
            <Text className="mt-2 font-kr text-base text-dim">
              학습 환경을 맞춤 설정해드립니다
            </Text>

            <Text className="mt-8 font-mono text-[10px] uppercase tracking-wider text-cyan">
              // 학년 · 구분
            </Text>
            <View className="mt-3 gap-2">
              {USER_TYPES.map((t) => (
                <Pressable
                  key={t.code}
                  onPress={() => setUserType(t.code)}
                  className={`flex-row items-center justify-between rounded border px-4 py-4 ${
                    userType === t.code
                      ? "border-violet bg-violet/10"
                      : "border-white/10 bg-surface"
                  }`}
                >
                  <Text
                    className={`font-kr text-base ${
                      userType === t.code ? "text-violet-glow" : "text-fg"
                    }`}
                  >
                    {t.label}
                  </Text>
                  {userType === t.code ? (
                    <Text className="font-mono text-xs text-violet-glow">✓</Text>
                  ) : null}
                </Pressable>
              ))}
            </View>

            <Text className="mt-8 font-mono text-[10px] uppercase tracking-wider text-cyan">
              // 학습 목표
            </Text>
            <View className="mt-3 flex-row flex-wrap gap-2">
              {[
                "변호사시험 합격",
                "학점 관리",
                "로스쿨 입학",
                "판례 탐구",
                "실무 준비",
              ].map((g) => (
                <Pressable
                  key={g}
                  onPress={() => setGoal(g)}
                  className={`rounded border px-4 py-2 ${
                    goal === g
                      ? "border-violet bg-violet/10"
                      : "border-white/10 bg-surface"
                  }`}
                >
                  <Text
                    className={`font-kr text-sm ${
                      goal === g ? "text-violet-glow" : "text-fg"
                    }`}
                  >
                    {g}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {/* ═══ STEP 2: 과목 선택 ═══ */}
        {step === 2 ? (
          <View className="mt-10 px-6">
            <Text className="font-kr text-3xl font-bold leading-tight tracking-tightest text-fg">
              어떤 과목을{"\n"}공부하시나요?
            </Text>
            <Text className="mt-2 font-kr text-base text-dim">
              여러 개 선택 가능 · 나중에 변경할 수 있습니다
            </Text>

            <View className="mt-8 gap-3">
              {SUBJECTS.map((s) => {
                const active = selectedSubjects.includes(s.code);
                return (
                  <Pressable
                    key={s.code}
                    onPress={() => toggleSubject(s.code)}
                    className={`flex-row items-center justify-between rounded border p-5 ${
                      active
                        ? "border-violet bg-violet/10"
                        : "border-white/10 bg-surface"
                    }`}
                  >
                    <View>
                      <Text
                        className={`font-kr text-xl font-bold ${
                          active ? "text-violet-glow" : "text-fg"
                        }`}
                      >
                        {s.label}
                      </Text>
                      <Text className="font-mono text-[10px] text-cyan">
                        // {s.sub}
                      </Text>
                    </View>
                    <View
                      className={`h-6 w-6 items-center justify-center rounded ${
                        active ? "bg-violet" : "border border-white/20"
                      }`}
                    >
                      {active ? (
                        <Text className="font-mono text-xs text-white">✓</Text>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* ═══ STEP 3: 튜토리얼 ═══ */}
        {step === 3 ? (
          <View className="mt-10 px-6">
            <Text className="font-kr text-3xl font-bold leading-tight tracking-tightest text-fg">
              준비 완료!
            </Text>
            <Text className="mt-2 font-kr text-base text-dim">
              LAW.OS 사용법을 간단히 알려드릴게요
            </Text>

            <View className="mt-8 gap-4">
              {[
                {
                  num: "01",
                  title: "질문하면 답이 옵니다",
                  desc: "민법·형법·헌법 전체 조문과 판례에 대해 AI 튜터가 출처와 함께 답변합니다.",
                },
                {
                  num: "02",
                  title: "답변은 자동 저장됩니다",
                  desc: "👍 피드백한 답변은 서재에 자동 분류 저장되어 나중에 복습할 수 있습니다.",
                },
                {
                  num: "03",
                  title: "Deep Debate로 깊이 있게",
                  desc: "Pro 모드에서 4명의 AI가 원고/피고/재판관/해설자 역할로 토론합니다.",
                },
              ].map((item) => (
                <View
                  key={item.num}
                  className="flex-row gap-4 rounded border border-white/10 bg-surface p-4"
                >
                  <Text className="font-mono text-2xl text-violet-glow">
                    {item.num}
                  </Text>
                  <View className="flex-1">
                    <Text className="font-kr text-base font-semibold text-fg">
                      {item.title}
                    </Text>
                    <Text className="mt-1 font-kr text-sm leading-5 text-dim">
                      {item.desc}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View className="h-24" />
      </ScrollView>

      {/* ═══ BOTTOM CTA ═══ */}
      <View className="border-t border-white/5 bg-bg px-6 py-4">
        <Button
          variant="primary"
          onPress={handleNext}
          disabled={!canProceed}
        >
          {step === 3 ? "LAW.OS 시작하기" : "다음"}
        </Button>
      </View>
    </SafeAreaView>
  );
}
