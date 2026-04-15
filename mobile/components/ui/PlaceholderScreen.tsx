import { ScrollView, Text, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

interface NavLink {
  label: string;
  href: string;
  variant?: "primary" | "ghost";
}

interface PlaceholderScreenProps {
  title: string;
  subtitle?: string;
  tag?: string;
  stitchId?: string;
  description?: string;
  links?: NavLink[];
  showBack?: boolean;
}

/**
 * 데모 네비게이션용 플레이스홀더.
 * 각 화면의 실제 UI는 이후 Stitch 시안 기준으로 하나씩 교체됩니다.
 */
export function PlaceholderScreen({
  title,
  subtitle,
  tag,
  stitchId,
  description,
  links = [],
  showBack = true,
}: PlaceholderScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 pt-4">
          {showBack && router.canGoBack() ? (
            <Pressable onPress={() => router.back()}>
              <Text className="font-mono text-xs uppercase text-dim">
                ← back
              </Text>
            </Pressable>
          ) : (
            <View />
          )}
          {tag ? (
            <Text className="font-mono text-[10px] uppercase tracking-wider text-violet-glow">
              {tag}
            </Text>
          ) : null}
        </View>

        {/* Body */}
        <View className="flex-1 px-6 pt-16">
          <Text className="font-mono text-[10px] uppercase tracking-wider text-dim">
            // {stitchId ?? "placeholder"}
          </Text>
          <Text className="mt-4 font-kr text-4xl font-bold leading-tight tracking-tightest text-fg">
            {title}
          </Text>
          {subtitle ? (
            <Text className="mt-3 font-kr text-lg text-dim">{subtitle}</Text>
          ) : null}
          {description ? (
            <View className="mt-6 rounded border border-white/10 bg-surface p-4">
              <Text className="font-kr text-sm text-dim">{description}</Text>
            </View>
          ) : null}
        </View>

        {/* Nav links */}
        {links.length > 0 ? (
          <View className="gap-3 px-6 py-8">
            <Text className="font-mono text-[10px] uppercase tracking-wider text-dim">
              // navigate
            </Text>
            {links.map((link) => (
              <Pressable
                key={link.href}
                onPress={() => router.push(link.href as any)}
                className={`h-12 flex-row items-center justify-between rounded px-4 ${
                  link.variant === "primary"
                    ? "bg-violet"
                    : "border border-white/10 bg-surface"
                }`}
              >
                <Text
                  className={`font-kr text-sm ${
                    link.variant === "primary" ? "text-white" : "text-fg"
                  }`}
                >
                  {link.label}
                </Text>
                <Text
                  className={`font-mono text-xs ${
                    link.variant === "primary" ? "text-white/70" : "text-dim"
                  }`}
                >
                  →
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
