import { ReactNode, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
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
// Why Reanimated 4 (not RN Animated):
//   The previous RN Animated implementation animated chevronAnim via
//   useNativeDriver: true + interpolate(). On collapse the chevron stuck at
//   90° because the native side cached the interpolated transform output and
//   wouldn't accept the reverse animation reliably across re-renders.
//   Reanimated drives `withTiming(expanded ? "90deg" : "0deg")` directly
//   inside a worklet so the rotation tracks `expanded` deterministically.
export function CollapsibleSection({
  title,
  defaultExpanded = false,
  children,
  meta,
}: CollapsibleSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: withTiming(expanded ? "90deg" : "0deg", {
          duration: 180,
          easing: Easing.inOut(Easing.ease),
        }),
      },
    ],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: withTiming(expanded ? 1 : 0, {
      duration: 200,
      easing: Easing.inOut(Easing.ease),
    }),
  }));

  const toggle = () => setExpanded((prev) => !prev);

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
          <Animated.View style={chevronStyle}>
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
          style={contentStyle}
          importantForAccessibility={expanded ? "auto" : "no-hide-descendants"}
        >
          {children}
        </Animated.View>
      ) : null}
    </View>
  );
}
