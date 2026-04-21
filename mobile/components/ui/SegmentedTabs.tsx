import { Pressable, Text, View } from "react-native";

interface SegmentedTab<T extends string> {
  key: T;
  label: string;
}

interface SegmentedTabsProps<T extends string> {
  tabs: readonly SegmentedTab<T>[];
  value: T;
  onChange: (key: T) => void;
}

// Unified horizontal tab row for filters and sub-tabs (chat filters,
// search-target tabs, etc.). Active tab shows violet-glow + underline;
// touch target is enlarged with py-3 to meet mobile tap-area norms.
export function SegmentedTabs<T extends string>({
  tabs,
  value,
  onChange,
}: SegmentedTabsProps<T>) {
  return (
    <View className="flex-row gap-2 border-b border-white/5 px-6">
      {tabs.map((tab) => {
        const active = tab.key === value;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            className="py-3"
            hitSlop={8}
          >
            <Text
              className={`font-mono text-xs uppercase tracking-wider ${
                active ? "text-violet-glow" : "text-dim"
              }`}
            >
              {tab.label}
            </Text>
            <View
              className={`mt-2 h-[2px] w-full ${
                active ? "bg-violet-glow" : "bg-transparent"
              }`}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
