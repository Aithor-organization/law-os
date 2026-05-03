import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  FadeIn,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

const STREAK_DAYS = 7;
const BAR_HEIGHTS = [40, 65, 30, 80, 55, 90, 45]; // 0-100 비율

// 페이지 4: 노트 + 학습 통계
// 일별 학습 막대그래프가 좌→우로 순차 자라나는 애니메이션.
export function NotesPage({ active }: { active: boolean }) {
  return (
    <View className="flex-1 px-6 pt-12">
      <Animated.View entering={FadeInUp.duration(400)}>
        <Text className="font-mono text-[10px] uppercase tracking-wider text-cyan">
          // 04 · notes & stats
        </Text>
        <Text className="mt-2 font-kr text-3xl font-bold tracking-tightest text-fg">
          노트로 정리하고{"\n"}꾸준함을 추적
        </Text>
        <Text className="mt-3 font-kr text-base leading-6 text-dim">
          학습 메모를 남기고, 매일의 공부량을 그래프로 확인하세요.
        </Text>
      </Animated.View>

      {/* Note card */}
      <View className="mt-10 rounded-[6px] border border-white/10 bg-surface p-4">
        <Text className="font-mono text-[10px] uppercase text-violet-glow">
          // 노트 · 채권법
        </Text>
        <Text className="mt-2 font-kr text-sm leading-5 text-fg">
          채권자취소권의 요건: 사해행위 + 사해의사 + 채권 성립 시기...
        </Text>
      </View>

      {/* Streak chart */}
      <View className="mt-4 rounded-[6px] border border-white/10 bg-surface p-4">
        <View className="flex-row items-end justify-between">
          <View>
            <Text className="font-mono text-[10px] uppercase text-cyan">
              // 연속 학습
            </Text>
            <Text className="mt-1 font-mono text-3xl font-bold text-cyan">
              {STREAK_DAYS} 일
            </Text>
          </View>
          <Text className="font-mono text-[10px] text-dim">// 지난 7일</Text>
        </View>

        <View className="mt-4 h-24 flex-row items-end justify-between gap-1.5">
          {BAR_HEIGHTS.map((h, i) => (
            <Bar key={i} index={i} height={h} active={active} />
          ))}
        </View>
      </View>
    </View>
  );
}

function Bar({
  index,
  height,
  active,
}: {
  index: number;
  height: number;
  active: boolean;
}) {
  const grow = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      grow.value = 0;
      return;
    }
    grow.value = withDelay(
      index * 80,
      withTiming(height / 100, { duration: 500 }),
    );
  }, [active, height, index, grow]);

  const barStyle = useAnimatedStyle(() => ({
    height: `${grow.value * 100}%`,
  }));

  return (
    <View className="flex-1">
      <Animated.View
        style={barStyle}
        className="rounded-t bg-violet"
      />
    </View>
  );
}
