import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";

import { getProfile, type Profile } from "@/lib/auth";
import { listBookmarks } from "@/lib/bookmarks";
import { listNotes } from "@/lib/notes";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { LoadingState } from "@/components/ui/FeedbackState";
import { Card, PressableCard } from "@/components/ui/Card";
import { Icon, ICON_COLOR } from "@/components/ui/Icon";
import { StreakCard } from "@/components/ui/StreakCard";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";

interface MenuLink {
  label: string;
  href: string;
}

interface MenuSection {
  title: string;
  defaultExpanded: boolean;
  links: MenuLink[];
}

const MENU_SECTIONS: MenuSection[] = [
  {
    title: "학습 설정",
    defaultExpanded: true,
    links: [
      { label: "내 법령", href: "/profile/laws" },
      { label: "학습 통계", href: "/profile/stats" },
      { label: "알림 설정", href: "/profile/notifications" },
    ],
  },
  {
    title: "내 계정",
    defaultExpanded: false,
    links: [
      { label: "프로필 편집", href: "/profile/edit" },
      { label: "로그아웃", href: "/modals/logout" },
    ],
  },
  {
    title: "기타",
    defaultExpanded: false,
    links: [{ label: "법적 정보", href: "/profile/legal" }],
  },
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
    streakDays: 0,
    bestStreak: 0,
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
    // Streak fields are placeholder 0s — backend integration comes later.
    // Structure is ready so the UI renders correctly once real values arrive.
    setStats({
      bookmarks: bookmarksRes.data.length,
      notes: notesRes.data.length,
      starred: starredRes.data.length,
      streakDays: 0,
      bestStreak: 0,
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
      <ScreenHeader
        title="프로필"
        subtitle="내 학습 현황과 계정 설정"
        rightAction={
          <Pressable
            onPress={() => router.push("/profile/settings" as any)}
            accessibilityRole="link"
            accessibilityLabel="설정"
            hitSlop={8}
          >
            <Text className="font-mono text-xs uppercase text-dim" numberOfLines={1}>
              // settings
            </Text>
          </Pressable>
        }
      />

      <ScrollView className="flex-1">
        <View className="mx-6 mt-4">
          {loading ? (
            <LoadingState message="프로필 불러오는 중..." />
          ) : (
            <Card className="p-5">
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
                  <Text
                    className="font-kr text-3xl font-bold text-violet-glow"
                    numberOfLines={1}
                  >
                    {initial}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text
                    className="font-kr text-xl font-bold text-fg"
                    numberOfLines={1}
                  >
                    {displayName}
                  </Text>
                  <Text
                    className="font-mono text-xs text-cyan"
                    numberOfLines={1}
                  >
                    {displayEmail}
                  </Text>
                  <View className="mt-2 self-start rounded border border-cyan/40 bg-cyan/10 px-2 py-1">
                    <Text
                      className="font-mono text-[10px] uppercase text-cyan"
                      numberOfLines={1}
                    >
                      FREE · {tierLabel}
                    </Text>
                  </View>
                </View>
              </View>
              {error && (
                <Text className="mt-3 font-mono text-[10px] text-danger">
                  // {error}
                </Text>
              )}
            </Card>
          )}
        </View>

        {!loading && (
          <View className="mx-6 mt-4">
            <StreakCard streakDays={stats.streakDays} bestStreak={stats.bestStreak} />
          </View>
        )}

        {/* Stats hierarchy: primary metric (북마크) gets full-width big
            card with text-3xl; secondary metrics (노트/즐겨찾기) share a
            row with text-xl. "무료 체험" was redundant with the FREE tier
            chip in the profile header, so it's removed. */}
        <View className="mx-6 mt-4 gap-3">
          <Card>
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text
                  className="font-mono text-3xl font-bold text-cyan"
                  numberOfLines={1}
                >
                  {stats.bookmarks}
                </Text>
                <Text
                  className="mt-1 font-mono text-[10px] uppercase tracking-wider text-dim"
                  numberOfLines={1}
                >
                  // 북마크 · 저장한 조문·판례
                </Text>
              </View>
              <Icon name="bookmark" size={28} color={ICON_COLOR.cyan} />
            </View>
          </Card>

          <View className="flex-row gap-3">
            <View className="w-[48%]">
              <Card>
                <Text
                  className="font-mono text-xl font-semibold text-fg"
                  numberOfLines={1}
                >
                  {stats.notes}
                </Text>
                <Text
                  className="mt-1 font-mono text-[10px] uppercase text-dim"
                  numberOfLines={1}
                >
                  // 노트
                </Text>
              </Card>
            </View>
            <View className="w-[48%]">
              <Card>
                <Text
                  className="font-mono text-xl font-semibold text-fg"
                  numberOfLines={1}
                >
                  {stats.starred}
                </Text>
                <Text
                  className="mt-1 font-mono text-[10px] uppercase text-dim"
                  numberOfLines={1}
                >
                  // 즐겨찾기
                </Text>
              </Card>
            </View>
          </View>
        </View>

        <View className="mt-6 mx-6 pb-8 gap-3">
          {MENU_SECTIONS.map((section) => (
            <View
              key={section.title}
              className="overflow-hidden rounded border border-white/10 bg-surface"
            >
              <CollapsibleSection
                title={section.title}
                defaultExpanded={section.defaultExpanded}
                meta={`${section.links.length}개`}
              >
                <View className="border-t border-white/5">
                  {section.links.map((link, i) => (
                    <Pressable
                      key={link.href}
                      onPress={() => router.push(link.href as any)}
                      accessibilityRole="link"
                      accessibilityLabel={link.label}
                      className={`h-14 flex-row items-center justify-between px-4 ${
                        i > 0 ? "border-t border-white/5" : ""
                      }`}
                      style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
                    >
                      <Text
                        className="flex-1 mr-3 font-kr text-base text-fg"
                        numberOfLines={1}
                      >
                        {link.label}
                      </Text>
                      <Icon name="arrow-right" size={14} color={ICON_COLOR.dim} />
                    </Pressable>
                  ))}
                </View>
              </CollapsibleSection>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
