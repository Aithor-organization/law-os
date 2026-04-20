import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import { loadSettings, saveSettings, type UserSettings } from "@/lib/settings";

const ITEMS: { key: keyof UserSettings; label: string; desc: string }[] = [
  {
    key: "push",
    label: "푸시 알림",
    desc: "중요한 업데이트와 학습 리마인더를 디바이스로 받습니다.",
  },
  {
    key: "email",
    label: "이메일 알림",
    desc: "서비스 공지와 월간 학습 리포트를 이메일로 받습니다.",
  },
  {
    key: "reminder",
    label: "복습 리마인더",
    desc: "저장한 노트의 다음 복습 예정일에 알림을 받습니다.",
  },
  {
    key: "offline",
    label: "오프라인 모드",
    desc: "최근 조회한 조문·판례를 로컬에 캐시하여 오프라인에서도 열람합니다.",
  },
];

export default function NotificationsScreen() {
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
    const next = { ...settings, [key]: value };
    setSettings(next);
    await saveSettings({ [key]: value });
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <View className="flex-row items-center justify-between border-b border-white/5 px-4 py-3">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="뒤로"
          className="h-10 w-10 items-center justify-center"
        >
          <Text className="font-mono text-xs text-dim">←</Text>
        </Pressable>
        <Text className="font-kr text-base font-semibold text-fg">알림 설정</Text>
        <View className="h-10 w-10" />
      </View>

      <ScrollView className="flex-1">
        {!settings ? (
          <View className="items-center py-16">
            <ActivityIndicator size="small" color="#A855F7" />
          </View>
        ) : (
          <View className="mx-6 mt-6 mb-10 overflow-hidden rounded border border-white/10 bg-surface">
            {ITEMS.map((item, i) => (
              <View
                key={item.key}
                className={`flex-row items-start justify-between gap-4 p-4 ${
                  i > 0 ? "border-t border-white/5" : ""
                }`}
              >
                <View className="flex-1">
                  <Text className="font-kr text-base text-fg">{item.label}</Text>
                  <Text className="mt-1 font-kr text-xs text-dim">{item.desc}</Text>
                </View>
                <Switch
                  value={settings[item.key]}
                  onValueChange={(v) => update(item.key, v)}
                  trackColor={{ false: "#27272A", true: "#A855F7" }}
                  thumbColor="#FAFAFA"
                />
              </View>
            ))}
          </View>
        )}

        <View className="mx-6 mb-10">
          <Text className="font-mono text-[10px] text-dim">
            // 설정은 이 기기에만 저장됩니다. 다른 기기에서 로그인해도 동기화되지 않습니다.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
