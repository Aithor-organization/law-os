import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ICON_COLOR } from "./Icon";

interface StreakCardProps {
  streakDays: number;
  bestStreak?: number;
}

// Duolingo-style streak display with Dark Academia tone-matching.
// The fire icon uses violet-glow instead of Duolingo's yellow/orange,
// preserving the app's monochrome-violet aesthetic while borrowing
// the loss-aversion mechanic.
//
// Invariants:
// - Fixed height h-20 (80pt) row with flame icon + big number + label.
// - Number is `text-3xl` (largest in profile), single line. Label and
//   best-streak sub-line are numberOfLines={1}.
// - Zero streak shows "0" — no empty state (consistent height across states).
export function StreakCard({ streakDays, bestStreak }: StreakCardProps) {
  return (
    <View
      className="h-20 flex-row items-center gap-4 rounded border border-white/10 bg-surface px-5"
      style={{
        shadowColor: "#A855F7",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: streakDays > 0 ? 0.3 : 0,
        shadowRadius: 16,
      }}
    >
      <View
        className="h-12 w-12 items-center justify-center rounded-full bg-violet/20"
        style={{
          shadowColor: "#A855F7",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: streakDays > 0 ? 0.6 : 0.15,
          shadowRadius: 12,
        }}
      >
        <Ionicons
          name="flame"
          size={24}
          color={streakDays > 0 ? ICON_COLOR.violetGlow : ICON_COLOR.dim}
        />
      </View>
      <View className="flex-1">
        <View className="flex-row items-baseline gap-2">
          <Text
            className="font-mono text-3xl font-bold text-fg"
            numberOfLines={1}
          >
            {streakDays}
          </Text>
          <Text
            className="font-kr text-sm text-dim"
            numberOfLines={1}
          >
            일 연속 학습
          </Text>
        </View>
        {typeof bestStreak === "number" && bestStreak > 0 ? (
          <Text
            className="mt-1 font-mono text-[10px] uppercase tracking-wider text-dim"
            numberOfLines={1}
          >
            // best · {bestStreak}일
          </Text>
        ) : null}
      </View>
    </View>
  );
}
