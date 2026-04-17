import { useState } from "react";
import { ScrollView, Text, View, Pressable, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

type Item = {
  label: string;
  desc?: string;
  type: "toggle" | "link" | "action";
  href?: string;
  toggleKey?: string;
  danger?: boolean;
};

export default function SettingsScreen() {
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    push: true,
    email: true,
    reminder: false,
    offline: true,
  });

  const set = (k: string) => (v: boolean) => setToggles((s) => ({ ...s, [k]: v }));

  const SECTIONS: { tag: string; items: Item[] }[] = [
    {
      tag: "// notifications",
      items: [
        { label: "푸시 알림", desc: "복습 알림 · 새 소식", type: "toggle", toggleKey: "push" },
        { label: "이메일 알림", desc: "월간 학습 리포트", type: "toggle", toggleKey: "email" },
        { label: "학습 리마인더", desc: "매일 19:00", type: "toggle", toggleKey: "reminder" },
      ],
    },
    {
      tag: "// app",
      items: [
        {
          label: "오프라인 캐시",
          desc: "지하철 · 도서관 대비",
          type: "toggle",
          toggleKey: "offline",
        },
        { label: "테마", desc: "Dark Academia Pro", type: "link" },
        { label: "언어", desc: "한국어", type: "link" },
      ],
    },
    {
      tag: "// account",
      items: [
        { label: "프로필 편집", type: "link", href: "/profile/edit" },
        { label: "구독 관리", type: "link", href: "/profile/subscription" },
        { label: "법적 고지", type: "link", href: "/profile/legal" },
      ],
    },
    {
      tag: "// danger zone",
      items: [
        { label: "로그아웃", type: "action", href: "/modals/logout" },
        {
          label: "계정 삭제",
          desc: "모든 데이터 영구 삭제",
          type: "action",
          danger: true,
        },
      ],
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <View className="flex-row items-center gap-4 px-6 pt-4">
        <Pressable onPress={() => router.back()}>
          <Text className="font-mono text-[10px] uppercase text-dim">← back</Text>
        </Pressable>
        <Text className="font-mono text-[10px] uppercase text-violet-glow">
          // settings
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="mt-8 px-6">
          <Text className="font-kr text-3xl font-bold tracking-tightest text-fg">
            설정
          </Text>
        </View>

        {SECTIONS.map((section) => (
          <View key={section.tag} className="mt-8 px-6">
            <Text className="font-mono text-[10px] uppercase tracking-wider text-dim">
              {section.tag}
            </Text>
            <View className="mt-3 overflow-hidden rounded-[6px] border border-white/10 bg-surface">
              {section.items.map((item, i) => {
                const isLast = i === section.items.length - 1;
                const content = (
                  <View
                    className={`flex-row items-center justify-between px-4 py-4 ${
                      !isLast ? "border-b border-white/5" : ""
                    }`}
                  >
                    <View className="flex-1 pr-3">
                      <Text
                        className={`font-kr text-sm ${
                          item.danger ? "text-danger" : "text-fg"
                        }`}
                      >
                        {item.label}
                      </Text>
                      {item.desc && (
                        <Text className="mt-0.5 font-mono text-[10px] text-dim">
                          {item.desc}
                        </Text>
                      )}
                    </View>
                    {item.type === "toggle" && item.toggleKey && (
                      <Switch
                        value={toggles[item.toggleKey]}
                        onValueChange={set(item.toggleKey)}
                        trackColor={{ false: "#27272A", true: "#A855F7" }}
                        thumbColor="#F4F4F5"
                      />
                    )}
                    {item.type !== "toggle" && (
                      <Text className="font-mono text-xs text-dim">→</Text>
                    )}
                  </View>
                );

                return item.href ? (
                  <Pressable key={i} onPress={() => router.push(item.href as any)}>
                    {content}
                  </Pressable>
                ) : (
                  <View key={i}>{content}</View>
                );
              })}
            </View>
          </View>
        ))}

        <Text className="mt-10 text-center font-mono text-[10px] text-dim">
          // LAW.OS v1.0.0 · build 2026.04.15
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
