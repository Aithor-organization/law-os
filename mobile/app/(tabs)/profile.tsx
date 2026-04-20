import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";

import { getProfile, type Profile } from "@/lib/auth";
import { listBookmarks } from "@/lib/bookmarks";
import { listNotes } from "@/lib/notes";

const QUICK_LINKS: { label: string; href: string }[] = [
  { label: "프로필 편집", href: "/profile/edit" },
  { label: "내 법령", href: "/profile/laws" },
  { label: "학습 통계", href: "/profile/stats" },
  { label: "알림 설정", href: "/profile/notifications" },
  { label: "법적 정보", href: "/profile/legal" },
  { label: "로그아웃", href: "/modals/logout" },
];

function firstLetter(source: string | null | undefined): string {
  const trimmed = (source ?? "").trim();
  if (!trimmed) return "?";
  // Handle emoji / multi-codepoint characters by taking the first Unicode
  // scalar value via Array.from rather than [0].
  return Array.from(trimmed)[0] ?? "?";
}

function userTypeLabel(type: Profile["user_type"]): string {
  switch (type) {
    case "law_school":
      return "로스쿨";
    case "bar_exam":
      return "변호사시험 준비";
    case "undergrad":
      return "법학과";
    case "other":
      return "기타";
    default:
      return "학습자";
  }
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    bookmarks: 0,
    notes: 0,
    starred: 0,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [profileRes, bookmarksRes, notesRes, starredRes] = await Promise.all([
      getProfile(),
      listBookmarks(),
      listNotes({ limit: 1 }),
      listNotes({ starred: true, limit: 1 }),
    ]);

    if (profileRes.error) {
      setError(profileRes.error.message);
    } else {
      setProfile(profileRes.data);
    }

    // Fetch real counts via HEAD-style queries — for MVP we use full fetch with
    // limit: 1 plus separate count queries could be added once row volume grows.
    setStats({
      bookmarks: bookmarksRes.data.length,
      notes: notesRes.data.length,
      starred: starredRes.data.length,
    });

    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const initial = firstLetter(profile?.name || profile?.email);
  const displayName = profile?.name?.trim() || "이름 미설정";
  const displayEmail = profile?.email ?? "";
  const tierLabel = `${userTypeLabel(profile?.user_type ?? null)}${
    profile?.school_year ? ` · ${profile.school_year}학년` : ""
  }`;

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <ScrollView className="flex-1">
        <View className="flex-row items-center justify-between px-6 py-4">
          <Text className="font-kr text-2xl font-bold text-fg">프로필</Text>
          <Pressable
            onPress={() => router.push("/profile/settings" as any)}
            accessibilityRole="link"
            accessibilityLabel="설정"
          >
            <Text className="font-mono text-xs uppercase text-dim">// settings</Text>
          </Pressable>
        </View>

        {loading ? (
          <View className="mx-6 flex-row items-center gap-3 rounded border border-white/10 bg-surface p-4">
            <ActivityIndicator size="small" color="#A855F7" />
            <Text className="font-kr text-sm text-dim">프로필을 불러오는 중...</Text>
          </View>
        ) : (
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
                  {initial}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="font-kr text-xl font-bold text-fg">{displayName}</Text>
                <Text className="font-mono text-xs text-cyan" numberOfLines={1}>
                  {displayEmail}
                </Text>
                <View className="mt-2 self-start rounded border border-cyan/40 bg-cyan/10 px-2 py-1">
                  <Text className="font-mono text-[10px] uppercase text-cyan">
                    FREE · {tierLabel}
                  </Text>
                </View>
              </View>
            </View>
            {error && (
              <Text className="mt-3 font-mono text-[10px] text-danger">// {error}</Text>
            )}
          </View>
        )}

        <View className="mx-6 mt-4 flex-row flex-wrap gap-3">
          <View className="w-[48%] rounded border border-white/10 bg-surface p-4">
            <Text className="font-mono text-2xl text-cyan">{stats.bookmarks}</Text>
            <Text className="mt-1 font-mono text-[10px] uppercase text-dim">
              // 북마크
            </Text>
          </View>
          <View className="w-[48%] rounded border border-white/10 bg-surface p-4">
            <Text className="font-mono text-2xl text-cyan">{stats.notes}</Text>
            <Text className="mt-1 font-mono text-[10px] uppercase text-dim">
              // 저장한 노트
            </Text>
          </View>
          <View className="w-[48%] rounded border border-white/10 bg-surface p-4">
            <Text className="font-mono text-2xl text-violet-glow">{stats.starred}</Text>
            <Text className="mt-1 font-mono text-[10px] uppercase text-dim">
              // 즐겨찾기
            </Text>
          </View>
          <View className="w-[48%] rounded border border-white/10 bg-surface p-4">
            <Text className="font-mono text-2xl text-violet-glow">🎁</Text>
            <Text className="mt-1 font-mono text-[10px] uppercase text-dim">
              // 무료 체험 중
            </Text>
          </View>
        </View>

        <View className="mt-6 px-6 pb-8">
          <Text className="font-mono text-[10px] uppercase tracking-wider text-cyan">
            // menu
          </Text>
          <View className="mt-3 overflow-hidden rounded border border-white/10 bg-surface">
            {QUICK_LINKS.map((link, i) => (
              <Pressable
                key={link.href}
                onPress={() => router.push(link.href as any)}
                accessibilityRole="link"
                accessibilityLabel={link.label}
                className={`flex-row items-center justify-between p-4 ${
                  i > 0 ? "border-t border-white/5" : ""
                }`}
              >
                <Text className="font-kr text-base text-fg">{link.label}</Text>
                <Text className="font-mono text-xs text-dim">→</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
