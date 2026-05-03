import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import Animated, {
  FadeIn,
  FadeInUp,
  SlideInRight,
} from "react-native-reanimated";
import { Icon, ICON_COLOR } from "@/components/ui/Icon";

// 페이지 5: BYOK 안내
// 설정 화면을 미니뷰로 시연 — "// app" 섹션이 펼쳐지며 "API 키 등록" 항목
// 이 강조됨. 여기서는 정적 illustration으로 충분 (실제 설정 화면 진입은
// Phase 3에서 BYOK 입력폼 완성 후).
export function ByokPage({ active }: { active: boolean }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!active) {
      setStep(0);
      return;
    }
    const t1 = setTimeout(() => setStep(1), 600);
    const t2 = setTimeout(() => setStep(2), 1500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [active]);

  return (
    <View className="flex-1 px-6 pt-12">
      <Animated.View entering={FadeInUp.duration(400)}>
        <Text className="font-mono text-[10px] uppercase tracking-wider text-cyan">
          // 05 · your own key
        </Text>
        <Text className="mt-2 font-kr text-3xl font-bold tracking-tightest text-fg">
          본인 API 키로{"\n"}무제한 사용
        </Text>
        <Text className="mt-3 font-kr text-sm leading-5 text-dim">
          기본 모델은{" "}
          <Text className="font-semibold text-cyan">매일 5회</Text>까지
          무료입니다. 본인의 LLM API 키를 등록하면 제한이 사라집니다.
        </Text>
        <Text className="mt-2 font-kr text-xs leading-5 text-dim">
          ⚠ 무료 모델이 아닐 경우 API 사용량에 따른 요금이 본인에게
          청구될 수 있습니다.
        </Text>
      </Animated.View>

      {/* Mini settings demo */}
      <View className="mt-8 rounded-[6px] border border-white/10 bg-surface p-4">
        <Text className="font-mono text-[10px] uppercase text-dim">
          // 프로필 → 설정
        </Text>

        {step >= 1 ? (
          <Animated.View
            entering={FadeIn.duration(300)}
            className="mt-3 rounded border border-white/5 bg-surface-high px-3 py-2"
          >
            <View className="flex-row items-center justify-between">
              <Text className="font-mono text-[10px] uppercase text-cyan">
                // app
              </Text>
              <Text className="font-mono text-[10px] text-dim">3개</Text>
            </View>
          </Animated.View>
        ) : null}

        {step >= 2 ? (
          <Animated.View entering={SlideInRight.duration(400)} className="mt-2">
            <View className="flex-row items-center gap-2 rounded border border-cyan/40 bg-cyan/10 px-3 py-3">
              <Icon name="search" size={14} color={ICON_COLOR.cyan} />
              <Text className="flex-1 font-kr text-sm text-fg">
                LLM API 키 등록
              </Text>
              <Text className="font-mono text-xs text-cyan">→</Text>
            </View>
            <Text className="mt-2 font-mono text-[10px] text-dim">
              // Gemini · OpenAI · Anthropic · OpenRouter 지원
            </Text>
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}
