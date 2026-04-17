import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";

import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";

type CitationDetail =
  | {
      kind: "statute";
      id: string;
      label: string;
      subtitle: string | null;
      body: string;
    }
  | {
      kind: "case";
      id: string;
      label: string;
      subtitle: string | null;
      body: string;
    };

// Modal route: /modals/citation?sourceType=statute|case&sourceId=...&snippet=...&score=...
// Opened from chat citation cards. Shows snippet + full text + jump-to-detail.
export default function CitationModal() {
  const params = useLocalSearchParams<{
    sourceType?: string;
    sourceId?: string;
    snippet?: string;
    score?: string;
    label?: string;
    subtitle?: string;
  }>();

  const sourceType = params.sourceType === "case" ? "case" : "statute";
  const sourceId = (Array.isArray(params.sourceId) ? params.sourceId[0] : params.sourceId) ?? "";
  const snippet = Array.isArray(params.snippet) ? params.snippet[0] : params.snippet;
  const scoreRaw = Array.isArray(params.score) ? params.score[0] : params.score;
  const providedLabel = Array.isArray(params.label) ? params.label[0] : params.label;
  const providedSubtitle = Array.isArray(params.subtitle) ? params.subtitle[0] : params.subtitle;

  const [detail, setDetail] = useState<CitationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const parsedScore = scoreRaw ? Number(scoreRaw) : null;
  const scorePct =
    parsedScore !== null && !Number.isNaN(parsedScore) ? (parsedScore * 100).toFixed(1) : null;

  useEffect(() => {
    if (!sourceId) {
      setLoading(false);
      setError("invalid_source");
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);

      if (sourceType === "statute") {
        const { data, error: queryError } = await supabase
          .from("statutes")
          .select("id, code_kr, article_no, title, body")
          .eq("id", sourceId)
          .maybeSingle();

        if (cancelled) return;
        if (queryError || !data) {
          setError(queryError?.message ?? "statute_not_found");
          setLoading(false);
          return;
        }

        const row = data as {
          id: string;
          code_kr: string;
          article_no: string;
          title: string | null;
          body: string;
        };
        setDetail({
          kind: "statute",
          id: row.id,
          label: providedLabel ?? `${row.code_kr} ${row.article_no}`,
          subtitle: providedSubtitle ?? row.title,
          body: row.body,
        });
        setLoading(false);
        return;
      }

      const { data, error: queryError } = await supabase
        .from("cases")
        .select("id, case_no, court, decided_at, summary, judgment_points")
        .eq("id", sourceId)
        .maybeSingle();

      if (cancelled) return;
      if (queryError || !data) {
        setError(queryError?.message ?? "case_not_found");
        setLoading(false);
        return;
      }

      const row = data as {
        id: string;
        case_no: string;
        court: string;
        decided_at: string;
        summary: string | null;
        judgment_points: string | null;
      };
      setDetail({
        kind: "case",
        id: row.id,
        label: providedLabel ?? row.case_no,
        subtitle: providedSubtitle ?? `${row.court} · ${row.decided_at}`,
        body: row.summary ?? row.judgment_points ?? "요약이 아직 없습니다.",
      });
      setLoading(false);
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [sourceId, sourceType, providedLabel, providedSubtitle]);

  const openFullDetail = () => {
    if (!detail) return;
    if (detail.kind === "statute") {
      router.replace(`/statute/${detail.id}` as any);
    } else {
      router.replace(`/case/${detail.id}` as any);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <View className="flex-row items-center justify-between px-6 pt-4">
        <Text className="font-mono text-[10px] uppercase text-violet-glow">
          // citation · {sourceType}
          {scorePct ? ` · match ${scorePct}%` : ""}
        </Text>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="닫기"
        >
          <Text className="font-mono text-[10px] uppercase text-dim">close ×</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {loading ? (
          <View className="items-center px-6 pt-16">
            <ActivityIndicator size="small" color="#A855F7" />
            <Text className="mt-4 font-kr text-sm text-dim">불러오는 중...</Text>
          </View>
        ) : error || !detail ? (
          <View className="mx-6 mt-8 rounded border border-danger/40 bg-danger/10 p-4">
            <Text className="font-mono text-[10px] text-danger">// {error ?? "not_found"}</Text>
            {snippet && (
              <Text className="mt-3 font-kr text-sm text-dim">
                {snippet}
              </Text>
            )}
          </View>
        ) : (
          <>
            <View className="mt-8 px-6">
              <Text className="font-kr text-2xl font-bold tracking-tightest text-fg">
                {detail.label}
              </Text>
              {detail.subtitle ? (
                <Text className="mt-1 font-kr text-base text-dim">{detail.subtitle}</Text>
              ) : null}
            </View>

            {snippet ? (
              <View className="mx-6 mt-8 rounded-[6px] border border-violet/30 bg-surface-high p-5">
                <Text className="font-mono text-[10px] uppercase tracking-wider text-violet-glow">
                  // 인용된 부분
                </Text>
                <Text className="mt-3 font-kr text-base leading-7 text-fg">{snippet}</Text>
              </View>
            ) : null}

            <View className="mx-6 mt-6 rounded-[6px] border border-white/10 bg-surface p-5">
              <Text className="font-mono text-[10px] uppercase tracking-wider text-dim">
                // {detail.kind === "statute" ? "조문 전문" : "판례 요지"}
              </Text>
              <Text className="mt-3 font-kr text-sm leading-6 text-fg">{detail.body}</Text>
            </View>
          </>
        )}

        <View className="mt-8 gap-3 px-6">
          <Button variant="primary" onPress={openFullDetail} disabled={!detail}>
            {detail?.kind === "case" ? "판례 상세로 이동" : "조문 전체 보기"}
          </Button>
          <Button variant="ghost" onPress={() => router.back()}>
            닫기
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
