import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";

/**
 * Dismissible-free legal disclaimer banner shown above AI-generated content.
 *
 * 변호사법 §109 (non-lawyer legal counsel prohibition) + AI accuracy
 * disclaimer. Rendered persistently at the top of chat screens — NOT
 * dismissible, because the user must see it every session per legal
 * review guidance.
 *
 * Variants:
 *   - compact (default): one-line mono hint that links to /profile/legal
 *   - full: two-line kr+mono explaining non-advice + accuracy
 *
 * The full variant is intended for first-time acknowledgment flows
 * (future work); for MVP we render compact on every chat screen.
 */

type Props = {
  variant?: "compact" | "full";
};

export function DisclaimerBanner({ variant = "compact" }: Props) {
  const handlePress = () => {
    router.push("/profile/legal" as any);
  };

  if (variant === "full") {
    return (
      <Pressable
        onPress={handlePress}
        accessibilityRole="link"
        accessibilityLabel="법적 고지 전문 보기"
        className="border-b border-violet/20 bg-violet/5 px-4 py-3"
      >
        <Text
          className="font-mono text-[10px] uppercase tracking-wider text-violet-glow"
          numberOfLines={1}
        >
          // 법적 고지 · 변호사법 §109
        </Text>
        <Text
          className="mt-1 font-kr text-xs leading-5 text-dim"
          numberOfLines={2}
        >
          본 서비스는 법학 학습 보조 도구이며 법률 자문이 아닙니다. AI 답변은
          오류가 있을 수 있으니 원문(조문·판례)과 대조하세요.
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="link"
      accessibilityLabel="법적 고지 전문 보기"
      hitSlop={8}
      className="flex-row items-center justify-between border-b border-white/5 bg-surface-low px-4 py-2"
    >
      <Text
        className="flex-1 font-mono text-[10px] uppercase tracking-wider text-dim"
        numberOfLines={1}
      >
        // 학습용 · 법률 자문 아님 · 변호사법 §109
      </Text>
      <Text className="ml-2 font-mono text-[10px] text-violet-glow" numberOfLines={1}>
        자세히 →
      </Text>
    </Pressable>
  );
}
