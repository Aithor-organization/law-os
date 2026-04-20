import { ScrollView, Text, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

type Section = { title: string; items: { label: string; href: string }[] };

const SECTIONS: Section[] = [
  {
    title: "Auth & Onboarding",
    items: [
      { label: "Login", href: "/(auth)/login" },
      { label: "Sign Up", href: "/(auth)/signup" },
      { label: "Forgot Password", href: "/(auth)/forgot-password" },
      { label: "Legal Disclaimer Consent (3/3)", href: "/(auth)/consent-disclaimer" },
    ],
  },
  {
    title: "Tabs (Core)",
    items: [
      { label: "Chat List (대화)", href: "/(tabs)" },
      { label: "Search (검색)", href: "/(tabs)/search" },
      { label: "Library (서재)", href: "/(tabs)/library" },
      { label: "Profile (프로필)", href: "/(tabs)/profile" },
    ],
  },
  {
    title: "Chat",
    items: [
      { label: "New Chat", href: "/chat/new" },
      { label: "Active Chat (demo)", href: "/chat/demo-1" },
    ],
  },
  {
    title: "Content Detail",
    items: [
      { label: "Statute Detail (민법 750)", href: "/statute/civil-750" },
      { label: "Case Detail (2018다12345)", href: "/case/2018da12345" },
      { label: "Note Detail", href: "/note/1" },
    ],
  },
  {
    title: "Profile",
    items: [
      { label: "Edit Profile", href: "/profile/edit" },
      { label: "Stats", href: "/profile/stats" },
      { label: "Notifications", href: "/profile/notifications" },
      { label: "Settings", href: "/profile/settings" },
      { label: "Legal Pages Viewer", href: "/profile/legal" },
    ],
  },
  {
    title: "Modals",
    items: [
      { label: "Citation Detail", href: "/modals/citation" },
      { label: "Save Note", href: "/modals/save-note" },
      { label: "Personal Advice Blocked ⚠️", href: "/modals/blocked" },
      { label: "Logout Confirm", href: "/modals/logout" },
    ],
  },
];

export default function ShowcaseScreen() {
  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <ScrollView className="flex-1">
        <View className="px-6 pt-6">
          <Text className="font-mono text-[10px] uppercase tracking-wider text-violet-glow">
            // dev showcase
          </Text>
          <Text className="mt-2 font-kr text-3xl font-bold text-fg">
            All Screens
          </Text>
          <Text className="mt-2 font-kr text-sm text-dim">
            구현된 모든 화면을 여기서 탐색할 수 있습니다. 각 화면은 Stitch
            시안을 기반으로 교체 예정입니다.
          </Text>
        </View>

        {SECTIONS.map((section) => (
          <View key={section.title} className="mt-8 px-6">
            <Text className="font-mono text-[10px] uppercase tracking-wider text-cyan">
              // {section.title}
            </Text>
            <View className="mt-3 overflow-hidden rounded border border-white/10 bg-surface">
              {section.items.map((item, i) => (
                <Pressable
                  key={item.href}
                  onPress={() => router.push(item.href as any)}
                  className={`flex-row items-center justify-between p-4 ${
                    i > 0 ? "border-t border-white/5" : ""
                  }`}
                >
                  <Text className="font-kr text-sm text-fg">{item.label}</Text>
                  <Text className="font-mono text-xs text-dim">→</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        <View className="px-6 py-8">
          <Text className="text-center font-mono text-[10px] text-dim">
            // build dc6ed17 · LAW.OS v0.1.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
