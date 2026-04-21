import { Text, View } from "react-native";
import { Icon, ICON_COLOR } from "./Icon";

type SourceKind = "statute" | "case";

interface SourceBadgeProps {
  kind: SourceKind;
  label: string;
  meta?: string;
}

// Perplexity-style source attribution pill.
// Used inside search result cards (and optionally chat citations) to make
// the legal origin of a piece of content visible at a glance. The icon
// signals "statute" (law book) or "case" (hammer/gavel) so readers
// can scan without reading text.
//
// Invariants:
// - Single line (label + meta both truncate with ellipsis, label is flex-1)
// - Fixed height h-6 (24pt) so cards stacking multiple badges stay even
// - Icon color is always violet-glow (primary accent) to signal "trusted
//   origin"; text follows token — dim for meta, fg for label
export function SourceBadge({ kind, label, meta }: SourceBadgeProps) {
  const iconName = kind === "statute" ? "statute-civil" : "statute-criminal";
  return (
    <View className="h-6 flex-row items-center gap-1.5 self-start rounded border border-violet/30 bg-violet/10 px-2">
      <Icon name={iconName} size={12} color={ICON_COLOR.violetGlow} />
      <Text
        className="font-mono text-[10px] uppercase tracking-wider text-violet-glow"
        numberOfLines={1}
      >
        {label}
      </Text>
      {meta ? (
        <>
          <Text className="font-mono text-[10px] text-dim">·</Text>
          <Text
            className="font-mono text-[10px] text-dim"
            numberOfLines={1}
          >
            {meta}
          </Text>
        </>
      ) : null}
    </View>
  );
}
