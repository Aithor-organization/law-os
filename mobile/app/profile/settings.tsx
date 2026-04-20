import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, View, Pressable, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import { loadSettings, saveSettings, type UserSettings } from "@/lib/settings";
import { requestAccountDeletion, signOut } from "@/lib/auth";

type Item = {
  label: string;
  desc?: string;
  type: "toggle" | "link" | "action";
  href?: string;
  toggleKey?: keyof UserSettings;
  onAction?: () => void;
  danger?: boolean;
};

export default function SettingsScreen() {
  const [settings, setSettings] = useState<UserSettings | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = await loadSettings();
      if (!cancelled) setSettings(loaded);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const update = async (key: keyof UserSettings, value: boolean) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
    await saveSettings({ [key]: value });
  };

  const handleLogout = () => {
    Alert.alert("로그아웃", "로그아웃 하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "로그아웃",
        onPress: async () => {
          await signOut();
          router.replace("/(auth)/login" as any);
        },
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert(
      "계정 삭제",
      "계정이 30일간 비활성화되고 이후 영구 삭제됩니다. 계속할까요?",
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            const { error } = await requestAccountDeletion();
            if (error) {
              Alert.alert("삭제 실패", error.message);
              return;
            }
            router.replace("/(auth)/login" as any);
          },
        },
      ],
    );
  };

  const SECTIONS: { tag: string; items: Item[] }[] = [
    {
      tag: "// notifications",
      items: [
        { label: "푸시 알림", desc: "복습 알림 · 새 소식", type: "toggle", toggleKey: "push" },
        { label: "이메일 알림", desc: "월간 학습 리포트", type: "toggle", toggleKey: "email" },
        { label: "학습 리마인더", desc: "다음 복습 예정일 알림", type: "toggle", toggleKey: "reminder" },
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
        { label: "학습 통계", type: "link", href: "/profile/stats" },
        { label: "법적 고지", type: "link", href: "/profile/legal" },
      ],
    },
    {
      tag: "// danger zone",
      items: [
        { label: "로그아웃", type: "action", onAction: handleLogout },
        {
          label: "계정 삭제",
          desc: "30일 후 영구 삭제",
          type: "action",
          danger: true,
          onAction: handleDelete,
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

        {!settings ? (
          <View className="items-center py-16">
            <ActivityIndicator size="small" color="#A855F7" />
          </View>
        ) : (
          SECTIONS.map((section) => (
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
                          value={settings[item.toggleKey]}
                          onValueChange={(v) => update(item.toggleKey!, v)}
                          trackColor={{ false: "#27272A", true: "#A855F7" }}
                          thumbColor="#F4F4F5"
                        />
                      )}
                      {item.type !== "toggle" && (
                        <Text className="font-mono text-xs text-dim">→</Text>
                      )}
                    </View>
                  );

                  if (item.href) {
                    return (
                      <Pressable key={i} onPress={() => router.push(item.href as any)}>
                        {content}
                      </Pressable>
                    );
                  }
                  if (item.onAction) {
                    return (
                      <Pressable key={i} onPress={item.onAction}>
                        {content}
                      </Pressable>
                    );
                  }
                  return <View key={i}>{content}</View>;
                })}
              </View>
            </View>
          ))
        )}

        <Text className="mt-10 text-center font-mono text-[10px] text-dim">
          // LAW.OS v1.0.0 · build 2026.04.17
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
