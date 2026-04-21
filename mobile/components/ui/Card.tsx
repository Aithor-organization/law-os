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
//
// CALLER REQUIREMENTS for uniform appearance across instances:
// 1. All cards of the same *role* (e.g., all bookmark rows) must receive
//    children of identical shape — mixing 1-line and 3-line bodies
//    breaks the "same-size" invariant the component cannot itself enforce.
// 2. All inner <Text> must set numberOfLines={1} when the content is
//    expected to be single-line (titles, subtitles, tags). Multi-line
//    description blocks should use numberOfLines={2} or {3} and never
//    be unbounded — otherwise cards grow unpredictably.
// 3. When used inside a grid (w-[48%]), pass the SAME className at every
//    call site — mixing w-[48%] and w-full within one list breaks layout.

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
