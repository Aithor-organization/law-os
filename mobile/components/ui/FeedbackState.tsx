import { ReactNode, useEffect, useRef } from "react";
import { Animated, Easing, Text, View, ActivityIndicator } from "react-native";

interface LoadingStateProps {
  message?: string;
}

// Unified loading indicator for list/screen body sections.
// Render inside the scroll/card area, not at screen root.
export function LoadingState({ message = "불러오는 중..." }: LoadingStateProps) {
  // #A855F7 matches tailwind `violet` token (see tailwind.config.js).
  // Inlined because ActivityIndicator.color can't consume NativeWind classes.
  return (
    <View className="flex-row items-center gap-3 rounded border border-white/10 bg-surface p-4">
      <ActivityIndicator size="small" color="#A855F7" />
      <Text className="flex-1 font-kr text-sm text-dim" numberOfLines={1}>
        {message}
      </Text>
    </View>
  );
}

// Pulsing skeleton block for loading placeholders that mimic content shape.
// Use when you can predict the result's layout (list of N cards, avatar row,
// etc.) — gives smoother perceived load than a spinner since the final
// content slides in with same footprint.
interface SkeletonProps {
  height?: number; // defaults 16pt
  width?: number | string; // defaults "100%"
  rounded?: boolean; // adds rounded-full for avatar/pill shapes
}

export function Skeleton({
  height = 16,
  width = "100%",
  rounded = false,
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.6,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={{
        height,
        width: width as number | `${number}%`,
        backgroundColor: "rgba(255,255,255,0.08)",
        borderRadius: rounded ? 9999 : 4,
        opacity,
      }}
    />
  );
}

// Card-shaped skeleton row that matches PressableCard footprint (p-4 + border).
// Use for lists while data loads.
export function SkeletonCard() {
  return (
    <View className="rounded border border-white/10 bg-surface p-4">
      <View className="flex-row items-center gap-3">
        <Skeleton height={40} width={40} rounded />
        <View style={{ flex: 1 }}>
          <Skeleton height={14} width="70%" />
          <View style={{ height: 8 }} />
          <Skeleton height={10} width="40%" />
        </View>
      </View>
    </View>
  );
}

interface EmptyStateProps {
  title: string;
  hint?: string;
  action?: ReactNode;
}

// Unified empty state. Use when a list or section has no content.
//
// Invariants:
// - title single-line (numberOfLines=1, truncate on overflow)
// - hint limited to 2 lines (numberOfLines=2) — keep messaging short
// - No fixed height: caller decides outer container sizing. If multiple
//   EmptyStates appear side-by-side they should share the same wrapper
//   (e.g., same grid cell size) — the component itself cannot enforce
//   uniformity across callers.
export function EmptyState({ title, hint, action }: EmptyStateProps) {
  return (
    <View className="rounded border border-white/10 bg-surface p-6">
      <Text className="font-mono text-[10px] uppercase tracking-wider text-dim">
        // empty
      </Text>
      <Text
        className="mt-3 font-kr text-base font-semibold text-fg"
        numberOfLines={1}
      >
        {title}
      </Text>
      {hint ? (
        <Text
          className="mt-2 font-kr text-sm text-dim"
          numberOfLines={2}
        >
          {hint}
        </Text>
      ) : null}
      {action ? <View className="mt-4">{action}</View> : null}
    </View>
  );
}
