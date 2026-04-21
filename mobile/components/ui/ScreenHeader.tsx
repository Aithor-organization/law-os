import { ReactNode } from "react";
import { Text, View } from "react-native";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: ReactNode;
}

// Unified top-of-screen header for tab screens.
// Use as the first child inside a screen's <SafeAreaView>, before the
// scroll container. Keeps title typography, border, and action slot
// consistent across tabs.
export function ScreenHeader({ title, subtitle, rightAction }: ScreenHeaderProps) {
  return (
    <View className="border-b border-white/5 px-6 py-4">
      <View className="flex-row items-center justify-between">
        <Text className="font-kr text-2xl font-bold text-fg">{title}</Text>
        {rightAction ?? null}
      </View>
      {subtitle ? (
        <Text className="mt-2 font-kr text-sm text-dim">{subtitle}</Text>
      ) : null}
    </View>
  );
}
