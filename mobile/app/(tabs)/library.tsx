import { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";

import { listBookmarks, type Bookmark } from "@/lib/bookmarks";
import { supabase } from "@/lib/supabase";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { EmptyState, SkeletonCard } from "@/components/ui/FeedbackState";
import { Card, PressableCard } from "@/components/ui/Card";

type BookmarkItem = {
  id: string;
  sourceType: "statute" | "case";
  sourceId: string;
  label: string;
  subtitle: string | null;
  createdAt: string;
};

const SUBJECT_LABEL: Record<string, string> = {
  civil: "민법",
  criminal: "형법",
  constitutional: "헌법",
  commercial: "상법",
};

const SUBJECT_COLOR: Record<string, string> = {
  civil: "#A855F7",
  criminal: "#06B6D4",
  constitutional: "#FBBF24",
  commercial: "#10B981",
  admin: "#EC4899",
  tax: "#F59E0B",
};

export default function LibraryScreen() {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [counts, setCounts] = useState<{ statute: number; case: number }>({
    statute: 0,
    case: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: raw, error: bookmarkError } = await listBookmarks();
    if (bookmarkError) {
      setError(bookmarkError.message);
      setLoading(false);
      return;
    }

    // Resolve statute/case metadata in parallel.
    const statuteIds = raw
      .filter((b) => b.source_type === "statute")
      .map((b) => b.source_id);
    const caseIds = raw
      .filter((b) => b.source_type === "case")
      .map((b) => b.source_id);

    const [statuteRes, caseRes] = await Promise.all([
      statuteIds.length > 0
        ? supabase
            .from("statutes")
            .select("id, code, code_kr, article_no, title")
            .in("id", statuteIds)
        : Promise.resolve({ data: [] as any[] }),
      caseIds.length > 0
        ? supabase
            .from("cases")
            .select("id, case_no, court, decided_at, category")
            .in("id", caseIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const statuteMap = new Map<string, { label: string; subtitle: string | null }>();
    for (const row of (statuteRes.data ?? []) as Array<{
      id: string;
      code_kr: string;
      article_no: string;
      title: string | null;
    }>) {
      statuteMap.set(row.id, {
        label: `${row.code_kr} ${row.article_no}`,
        subtitle: row.title,
      });
    }

    const caseMap = new Map<string, { label: string; subtitle: string | null }>();
    for (const row of (caseRes.data ?? []) as Array<{
      id: string;
      case_no: string;
      court: string;
      decided_at: string;
    }>) {
      caseMap.set(row.id, {
        label: row.case_no,
        subtitle: `${row.court} · ${row.decided_at}`,
      });
    }

    const items: BookmarkItem[] = (raw as Bookmark[]).map((b) => {
      const meta =
        b.source_type === "statute"
          ? statuteMap.get(b.source_id)
          : caseMap.get(b.source_id);
      return {
        id: b.id,
        sourceType: b.source_type,
        sourceId: b.source_id,
        label: meta?.label ?? b.source_id,
        subtitle: meta?.subtitle ?? null,
        createdAt: b.created_at,
      };
    });

    setBookmarks(items);
    setCounts({
      statute: statuteIds.length,
      case: caseIds.length,
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

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <ScreenHeader
        title="서재"
        subtitle="저장한 조문·판례를 한눈에"
      />

      <ScrollView className="flex-1">
        <View className="mx-6 mt-4">
          <Card>
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text
                  className="font-mono text-2xl text-cyan"
                  numberOfLines={1}
                >
                  {counts.statute + counts.case}
                </Text>
                <Text
                  className="font-mono text-[10px] uppercase text-dim"
                  numberOfLines={1}
                >
                  // total
                </Text>
              </View>
              <View className="flex-1">
                <Text
                  className="font-mono text-2xl text-cyan"
                  numberOfLines={1}
                >
                  {counts.statute}
                </Text>
                <Text
                  className="font-mono text-[10px] uppercase text-dim"
                  numberOfLines={1}
                >
                  // 조문
                </Text>
              </View>
              <View className="flex-1">
                <Text
                  className="font-mono text-2xl text-violet-glow"
                  numberOfLines={1}
                >
                  {counts.case}
                </Text>
                <Text
                  className="font-mono text-[10px] uppercase text-dim"
                  numberOfLines={1}
                >
                  // 판례
                </Text>
              </View>
            </View>
          </Card>
        </View>

        {error && (
          <View className="mx-6 mt-4 rounded border border-danger/40 bg-danger/10 p-3">
            <Text className="font-mono text-[10px] text-danger">// {error}</Text>
          </View>
        )}

        <View className="mt-6 px-6 pb-8">
          <Text className="font-mono text-[10px] uppercase tracking-wider text-cyan">
            // 북마크
          </Text>
          <View className="mt-3 gap-3">
            {loading ? (
              <View className="gap-3">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </View>
            ) : bookmarks.length > 0 ? (
              bookmarks.map((item) => {
                const color = SUBJECT_COLOR[item.sourceId.split("-")[0]] ?? "#A855F7";
                return (
                  <PressableCard
                    key={item.id}
                    onPress={() =>
                      router.push(
                        item.sourceType === "statute"
                          ? (`/statute/${item.sourceId}` as any)
                          : (`/case/${item.sourceId}` as any),
                      )
                    }
                  >
                    <View className="flex-row items-center gap-2">
                      <View
                        className="h-1 w-4 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <Text
                        className="font-mono text-[10px] uppercase text-violet-glow"
                        numberOfLines={1}
                      >
                        {item.sourceType === "statute" ? "조문" : "판례"}
                      </Text>
                    </View>
                    <Text
                      className="mt-2 font-kr text-base font-semibold text-fg"
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                    {item.subtitle && (
                      <Text
                        className="mt-1 font-kr text-xs text-dim"
                        numberOfLines={1}
                      >
                        {item.subtitle}
                      </Text>
                    )}
                  </PressableCard>
                );
              })
            ) : (
              <EmptyState
                title="저장한 항목이 없습니다"
                hint="조문·판례 상세 화면에서 ⭐ 버튼을 눌러 저장하세요"
              />
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
