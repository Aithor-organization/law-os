import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import Animated, {
  FadeIn,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Icon, ICON_COLOR } from "@/components/ui/Icon";

// 페이지 3: 북마크 토글 시연
// 아이콘이 outline → filled로 전환 + scale bounce.
export function BookmarkPage({ active }: { active: boolean }) {
  const [filled, setFilled] = useState(false);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (!active) {
      setFilled(false);
      scale.value = 1;
      return;
    }
    let cancelled = false;
    const loop = () => {
      if (cancelled) return;
      setTimeout(() => {
        if (cancelled) return;
        setFilled((prev) => !prev);
        scale.value = withSequence(
          withTiming(1.3, { duration: 150 }),
          withTiming(1, { duration: 150 }),
        );
        loop();
      }, 1400);
    };
    loop();
    return () => {
      cancelled = true;
    };
  }, [active, scale]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View className="flex-1 px-6 pt-12">
      <Animated.View entering={FadeInUp.duration(400)}>
        <Text className="font-mono text-[10px] uppercase tracking-wider text-cyan">
          // 03 · bookmarks
        </Text>
        <Text className="mt-2 font-kr text-3xl font-bold tracking-tightest text-fg">
          중요한 답변은{"\n"}한 번에 저장
        </Text>
        <Text className="mt-3 font-kr text-base leading-6 text-dim">
          답변·조문·판례를 북마크해두면 프로필 → 북마크에서 한눈에 다시
          볼 수 있습니다.
        </Text>
      </Animated.View>

      {/* Bookmark demo card */}
      <View className="mt-12 rounded-[6px] border border-white/10 bg-surface p-5">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="font-kr text-base font-semibold text-fg">
              민법 제103조 · 반사회질서 무효
            </Text>
            <Text className="mt-1 font-mono text-[10px] text-dim">
              // saved 2025-04-30
            </Text>
          </View>
          <Animated.View style={iconStyle}>
            <Icon
              name="bookmark"
              size={32}
              color={filled ? ICON_COLOR.cyan : ICON_COLOR.dim}
            />
          </Animated.View>
        </View>

        {filled ? (
          <Animated.View
            entering={FadeIn.duration(200)}
            className="mt-3 self-start rounded bg-cyan/20 px-2 py-1"
          >
            <Text className="font-mono text-[10px] text-cyan">
              // 북마크에 저장됨
            </Text>
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}
