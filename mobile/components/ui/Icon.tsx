import { Ionicons } from "@expo/vector-icons";
import { ComponentProps } from "react";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

// Centralized icon mapping for the app.
// Changing an icon here updates every usage — preferred over inline <Ionicons />
// so we can audit the full icon vocabulary in one place.
//
// Size defaults to 18 (matches mono text x-height at text-sm). Color defaults
// to "currentColor" equivalent via tailwind `text-*` class on the wrapping
// <Text> in most cases — but Ionicons needs a raw color string, so pass one
// from the tailwind theme explicitly. Keep a short list: #F4F4F5 (fg),
// #71717A (dim), #DDB7FF (violet-glow), #06B6D4 (cyan), #EF4444 (danger).

type IconKey =
  | "chat"
  | "search"
  | "library"
  | "profile"
  | "statute-civil"
  | "statute-criminal"
  | "statute-constitutional"
  | "statute-commercial"
  | "chat-mode-normal"
  | "chat-mode-debate"
  | "bookmark"
  | "note"
  | "star"
  | "gift"
  | "plus"
  | "arrow-right"
  | "settings";

const MAP: Record<IconKey, IoniconName> = {
  chat: "chatbubble-outline",
  search: "search-outline",
  library: "book-outline",
  profile: "person-outline",
  "statute-civil": "library-outline",
  "statute-criminal": "hammer-outline",
  "statute-constitutional": "document-text-outline",
  "statute-commercial": "briefcase-outline",
  "chat-mode-normal": "chatbubble-ellipses-outline",
  "chat-mode-debate": "git-branch-outline",
  bookmark: "bookmark-outline",
  note: "create-outline",
  star: "star-outline",
  gift: "gift-outline",
  plus: "add",
  "arrow-right": "chevron-forward",
  settings: "settings-outline",
};

interface IconProps {
  name: IconKey;
  size?: number;
  color?: string;
}

export function Icon({ name, size = 18, color = "#F4F4F5" }: IconProps) {
  return <Ionicons name={MAP[name]} size={size} color={color} />;
}

// Preset color constants matching tailwind.config.js tokens — re-exported so
// call sites can `<Icon name="chat" color={ICON_COLOR.dim} />` without
// duplicating hex strings across screens.
export const ICON_COLOR = {
  fg: "#F4F4F5",
  dim: "#71717A",
  violetGlow: "#DDB7FF",
  violet: "#A855F7",
  cyan: "#06B6D4",
  danger: "#EF4444",
} as const;
