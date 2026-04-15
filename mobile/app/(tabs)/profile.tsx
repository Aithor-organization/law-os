import { ScrollView, Text, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

const QUICK_LINKS: { label: string; href: string; sub?: string }[] = [
  { label: "프로필 편집", href: "/profile/edit" },
  { label: "구독 관리", href: "/profile/subscription", sub: "Pro Monthly" },
  { label: "학습 통계", href: "/profile/stats" },
  { label: "알림 설정", href: "/profile/notifications" },
  { label: "데이터 내보내기", href: "/modals/export" },
  { label: "법적 정보", href: "/profile/legal" },
  { label: "로그아웃", href: "/modals/logout" },
];

export default function ProfileScreen() {
  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4">
          <Text className="font-kr text-2xl font-bold text-fg">프로필</Text>
          <Pressable onPress={() => router.push("/profile/settings" as any)}>
            <Text className="font-mono text-xs uppercase text-dim">
              // settings
            </Text>
          </Pressable>
        </View>

        {/* Profile card */}
        <View className="mx-6 rounded border border-white/10 bg-surface p-5">
          <View className="flex-row items-center gap-4">
            <View
              className="h-20 w-20 items-center justify-center rounded-full bg-violet/20"
              style={{
                shadowColor: "#A855F7",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.4,
                shadowRadius: 16,
              }}
            >
              <Text className="font-kr text-3xl font-bold text-violet-glow">
                박
              </Text>
            </View>
            <View className="flex-1">
              <Text className="font-kr text-xl font-bold text-fg">박준호</Text>
              <Text className="font-mono text-xs text-cyan">
                junho@lawschool.ac.kr
              </Text>
              <View className="mt-2 self-start rounded border border-violet bg-violet/10 px-2 py-1">
                <Text className="font-mono text-[10px] uppercase text-violet-glow">
                  PRO · 로스쿨 1학년
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stats grid */}
        <View className="mx-6 mt-4 flex-row flex-wrap gap-3">
          {[
            ["847", "이번달 질문"],
            ["142", "저장한 노트"],
            ["98.4%", "출처 정확도"],
            ["47", "연속 학습일"],
          ].map(([n, label]) => (
            <View
              key={label}
              className="w-[48%] rounded border border-white/10 bg-surface p-4"
            >
              <Text className="font-mono text-2xl text-cyan">{n}</Text>
              <Text className="mt-1 font-mono text-[10px] uppercase text-dim">
                // {label}
              </Text>
            </View>
          ))}
        </View>

        {/* Quick links */}
        <View className="mt-6 px-6 pb-8">
          <Text className="font-mono text-[10px] uppercase tracking-wider text-cyan">
            // menu
          </Text>
          <View className="mt-3 overflow-hidden rounded border border-white/10 bg-surface">
            {QUICK_LINKS.map((link, i) => (
              <Pressable
                key={link.href}
                onPress={() => router.push(link.href as any)}
                className={`flex-row items-center justify-between p-4 ${
                  i > 0 ? "border-t border-white/5" : ""
                }`}
              >
                <Text className="font-kr text-base text-fg">{link.label}</Text>
                <View className="flex-row items-center gap-2">
                  {link.sub ? (
                    <Text className="font-mono text-[10px] text-cyan">
                      {link.sub}
                    </Text>
                  ) : null}
                  <Text className="font-mono text-xs text-dim">→</Text>
                </View>
              </Pressable>
            ))}
          </View>

          <Pressable
            onPress={() => router.push("/showcase" as any)}
            className="mt-6"
          >
            <Text className="text-center font-mono text-[10px] text-cyan underline">
              // dev: all screens showcase
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
