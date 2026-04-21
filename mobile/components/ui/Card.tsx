import { ReactNode } from "react";
import { Pressable, View } from "react-native";

interface CardBaseProps {
  children: ReactNode;
  selected?: boolean;
  className?: string;
}

interface PressableCardProps extends CardBaseProps {
  onPress: () => void;
}

// Visual shell for bordered content blocks (bookmarks, search results,
// conversation rows, stats, category tiles). Unifies previously drifted
// border weights (/5 vs /10 → /10) and selected-state styling across
// screens.
//
// Use <Card> for static content, <PressableCard> for tappable items.
//
// className prop is ADDITIVE (layout/spacing only: w-[48%], mb-3, etc).
// Do NOT pass overrides for base utilities (bg-*, border-*, p-*, rounded)
// — NativeWind 4 lacks built-in twMerge and the merge result is undefined.
// If an override is genuinely needed, add a new prop/variant here instead.

function cardClasses(selected: boolean, extra: string) {
  const base = "rounded p-4 bg-surface";
  const border = selected
    ? "border border-violet/40 bg-violet/10"
    : "border border-white/10";
  return `${base} ${border} ${extra}`;
}

export function Card({ children, selected = false, className = "" }: CardBaseProps) {
  return <View className={cardClasses(selected, className)}>{children}</View>;
}

export function PressableCard({
  children,
  selected = false,
  className = "",
  onPress,
}: PressableCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className={cardClasses(selected, className)}
      style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
    >
      {children}
    </Pressable>
  );
}
