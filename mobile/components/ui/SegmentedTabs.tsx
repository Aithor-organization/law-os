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
// search-target tabs, etc.).
//
// Invariants:
// - Row total height is fixed to h-11 (44pt) — iOS minimum tap target.
// - Each tab label is single-line (numberOfLines=1) with ellipsis on
//   overflow. Labels should fit within the container; if tabs risk
//   overflow on narrow screens, callers should shorten labels.
// - Active indicator: violet-glow text + 2px bottom underline.
export function SegmentedTabs<T extends string>({
  tabs,
  value,
  onChange,
}: SegmentedTabsProps<T>) {
  return (
    <View className="h-11 flex-row border-b border-white/5 px-6">
      {tabs.map((tab) => {
        const active = tab.key === value;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            className="flex-1 items-center justify-center"
            hitSlop={8}
          >
            <Text
              className={`font-mono text-xs uppercase tracking-wider ${
                active ? "text-violet-glow" : "text-dim"
              }`}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
            <View
              className={`absolute bottom-0 h-[2px] w-full ${
                active ? "bg-violet-glow" : "bg-transparent"
              }`}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
