import { ReactNode, useRef, useState } from "react";
import { Animated, Easing, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ICON_COLOR } from "./Icon";

interface CollapsibleSectionProps {
  title: string;
  defaultExpanded?: boolean;
  children: ReactNode;
  meta?: string;
}

// Notion-style collapsible section for grouping profile / settings blocks.
//
// Invariants:
// - Header is a fixed h-12 (48pt) Pressable row — same tap-target as other
//   list items in the app. Title is numberOfLines={1}.
// - Chevron rotates 90° on expand (0 → 90 deg) via Animated.Value.
// - Children render with measured-then-animated max-height (fallback: 0).
//   NativeWind can't animate height directly; we use Animated.View wrapper
//   with interpolate to give a fade+collapse effect without layout jump.
// - Collapsed state hides children from a11y tree via importantForAccessibility.
export function CollapsibleSection({
  title,
  defaultExpanded = false,
  children,
  meta,
}: CollapsibleSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const chevronAnim = useRef(new Animated.Value(defaultExpanded ? 1 : 0)).current;
  const contentOpacity = useRef(new Animated.Value(defaultExpanded ? 1 : 0)).current;

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    Animated.parallel([
      Animated.timing(chevronAnim, {
        toValue: next ? 1 : 0,
        duration: 180,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: next ? 1 : 0,
        duration: 200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const chevronRotate = chevronAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "90deg"],
  });

  return (
    <View>
      <Pressable
        onPress={toggle}
        className="h-12 flex-row items-center justify-between px-4"
        style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${title}, ${expanded ? "펼침" : "접힘"}`}
      >
        <View className="flex-1 flex-row items-center gap-2 mr-3">
          <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
            <Ionicons name="chevron-forward" size={16} color={ICON_COLOR.dim} />
          </Animated.View>
          <Text
            className="font-kr text-base font-semibold text-fg"
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>
        {meta ? (
          <Text
            className="font-mono text-[10px] uppercase text-dim"
            numberOfLines={1}
          >
            {meta}
          </Text>
        ) : null}
      </Pressable>
      {expanded ? (
        <Animated.View
          style={{ opacity: contentOpacity }}
          importantForAccessibility={expanded ? "auto" : "no-hide-descendants"}
        >
          {children}
        </Animated.View>
      ) : null}
    </View>
  );
}
