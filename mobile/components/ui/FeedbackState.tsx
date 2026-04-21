import { ReactNode } from "react";
import { ActivityIndicator, Text, View } from "react-native";

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
