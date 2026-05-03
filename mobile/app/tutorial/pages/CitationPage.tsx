import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  FadeInUp,
  SlideInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

// 페이지 2: 인용 [1][2] 칩 → 본문 슬라이드업
// 칩이 펄스(scale 1 → 1.15 → 1)로 주의를 끌고, 일정 후 본문이 등장.
export function CitationPage({ active }: { active: boolean }) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (!active) {
      pulse.value = 1;
      return;
    }
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 500 }),
        withTiming(1, { duration: 500 }),
      ),
      -1,
      false,
    );
  }, [active, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <View className="flex-1 px-6 pt-12">
      <Animated.View entering={FadeInUp.duration(400)}>
        <Text className="font-mono text-[10px] uppercase tracking-wider text-cyan">
          // 02 · citations
        </Text>
        <Text className="mt-2 font-kr text-3xl font-bold tracking-tightest text-fg">
          인용을 탭하면{"\n"}원문이 보입니다
        </Text>
        <Text className="mt-3 font-kr text-base leading-6 text-dim">
          답변에 표시된 [1][2] 같은 인용 칩을 탭하면 해당 조문이나 판례의
          원문을 즉시 확인할 수 있습니다.
        </Text>
      </Animated.View>

      {/* Mini answer with pulsing citation chips */}
      <View className="mt-12 rounded-[6px] border border-violet/30 bg-violet/5 p-4">
        <Text className="font-mono text-[10px] uppercase text-violet-glow">
          // ai answer
        </Text>
        <Text className="mt-2 font-kr text-sm leading-5 text-fg">
          민법 제103조는 반사회질서 법률행위의 무효를 규정합니다.
        </Text>
        <View className="mt-3 flex-row gap-2">
          <Animated.View
            style={pulseStyle}
            className="rounded border border-cyan/60 bg-cyan/20 px-3 py-1"
          >
            <Text className="font-mono text-xs text-cyan">[1] 조문</Text>
          </Animated.View>
          <Animated.View
            style={pulseStyle}
            className="rounded border border-cyan/60 bg-cyan/20 px-3 py-1"
          >
            <Text className="font-mono text-xs text-cyan">[2] 판례</Text>
          </Animated.View>
        </View>
      </View>

      {/* Origin source preview slides up after a moment */}
      {active ? (
        <Animated.View
          entering={SlideInDown.delay(1200).duration(500)}
          className="mt-3 rounded-[6px] border border-white/10 bg-surface-high p-4"
        >
          <Text className="font-mono text-[10px] uppercase text-cyan">
            // 민법 제103조 · 원문
          </Text>
          <Text className="mt-2 font-kr text-sm leading-5 text-fg">
            "선량한 풍속 기타 사회질서에 위반한 사항을 내용으로 하는
            법률행위는 무효로 한다."
          </Text>
        </Animated.View>
      ) : null}
    </View>
  );
}
