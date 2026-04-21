import { ReactNode } from "react";
import { Text, View } from "react-native";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: ReactNode;
}

// Unified top-of-screen header for tab screens.
// Use as the first child inside a screen's <SafeAreaView>, before the
// scroll container.
//
// Invariants:
// - title is single-line (numberOfLines=1) and truncates with ellipsis
//   when overflow occurs. Long titles must be avoided by caller.
// - subtitle is single-line as well.
// - Row height is fixed to h-14 (56pt). When subtitle is present the
//   component grows by one text-sm line (~20pt) to h-[76px] total —
//   subtitle-aware callers must be consistent (either all tabs have
//   subtitle or none, to keep inter-tab height uniform).
export function ScreenHeader({ title, subtitle, rightAction }: ScreenHeaderProps) {
  return (
    <View className="border-b border-white/5 px-6">
      <View className="h-14 flex-row items-center justify-between">
        <Text
          className="font-kr text-2xl font-bold text-fg flex-1 mr-3"
          numberOfLines={1}
        >
          {title}
        </Text>
        {rightAction ?? null}
      </View>
      {subtitle ? (
        <Text
          className="pb-3 font-kr text-sm text-dim"
          numberOfLines={1}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
