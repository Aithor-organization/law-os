import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import {
  listRecentSearches,
  listTrendingSearches,
  searchLawContent,
  type SearchCode,
  type SearchItem,
} from "@/lib/search";
import { Input } from "@/components/ui/Input";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SegmentedTabs } from "@/components/ui/SegmentedTabs";
import { EmptyState, SkeletonCard } from "@/components/ui/FeedbackState";
import { Card, PressableCard } from "@/components/ui/Card";
import { Icon, ICON_COLOR } from "@/components/ui/Icon";
import { SourceBadge } from "@/components/ui/SourceBadge";

type CategoryIcon =
  | "statute-civil"
  | "statute-criminal"
  | "statute-constitutional"
  | "statute-commercial";

const CATEGORIES: Array<{ code: SearchCode; name: string; count: string; iconName: CategoryIcon }> = [
  { code: "civil", name: "민법", count: "1,118조", iconName: "statute-civil" },
  { code: "criminal", name: "형법", count: "372조", iconName: "statute-criminal" },
  { code: "constitutional", name: "헌법", count: "130조", iconName: "statute-constitutional" },
  { code: "commercial", name: "상법", count: "935조", iconName: "statute-commercial" },
];

type SearchTab = "statute" | "case" | "all";

const SEARCH_TABS: readonly { key: SearchTab; label: string }[] = [
  { key: "statute", label: "조문" },
  { key: "case", label: "판례" },
  { key: "all", label: "전체" },
];

const COURT_LABEL: Record<string, string> = {
  supreme: "대법원",
  constitutional: "헌법재판소",
  high: "고등법원",
  district: "지방법원",
};

const CATEGORY_LABEL: Record<string, string> = {
  civil: "민사",
  criminal: "형사",
  constitutional: "헌법",
  admin: "행정",
  tax: "조세",
};

export default function SearchScreen() {
  const [tab, setTab] = useState<SearchTab>("statute");
  const [query, setQuery] = useState("");
  const [selectedCode, setSelectedCode] = useState<SearchCode | null>(null);
  const [loading, setLoading] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchItem[]>([]);
  const [resultTotal, setResultTotal] = useState<number | null>(null);
  const [recent, setRecent] = useState<string[]>([]);
  const [popular, setPopular] = useState<Array<{ rank: number; query: string }>>([]);

  const loadSearchMeta = useCallback(async () => {
    setBootstrapping(true);
    const [recentResponse, popularResponse] = await Promise.all([
      listRecentSearches(5),
      listTrendingSearches(5),
    ]);

    if (!recentResponse.error) {
      setRecent(recentResponse.data.map((item) => item.query));
    }

    if (!popularResponse.error) {
      setPopular(
        popularResponse.data.map((item, index) => ({
          rank: index + 1,
          query: item.query,
        })),
      );
    }

    setBootstrapping(false);
  }, []);

  useEffect(() => {
    loadSearchMeta();
  }, [loadSearchMeta]);

  const runSearch = useCallback(
    async (nextQuery?: string, nextCode: SearchCode | null = selectedCode, nextTab: SearchTab = tab) => {
      const normalized = (nextQuery ?? query).trim();
      setQuery(normalized);

      if (!normalized) {
        setResults([]);
        setResultTotal(null);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);
      const { data, error: searchError } = await searchLawContent({
        query: normalized,
        target: nextTab,
        code: nextTab === "statute" ? nextCode ?? undefined : undefined,
        limit: 10,
      });
      setLoading(false);

      if (searchError || !data) {
        setResults([]);
        setResultTotal(null);
        setError(searchError?.message ?? "검색 결과를 불러오지 못했습니다.");
        return;
      }

      setResults(data.items);
      setResultTotal(data.total);
    },
    [query, selectedCode, tab],
  );

  const selectCategory = useCallback(
    (code: SearchCode) => {
      const category = CATEGORIES.find((item) => item.code === code);
      setSelectedCode(code);
      setTab("statute");
      void runSearch(category?.name ?? query, code, "statute");
    },
    [query, runSearch],
  );

  const triggerPresetSearch = useCallback(
    (text: string) => {
      setSelectedCode(null);
      void runSearch(text, null, tab);
    },
    [runSearch, tab],
  );

  const openResult = (item: SearchItem) => {
    if (item.type === "statute") {
      router.push(`/statute/${item.id}` as any);
      return;
    }
    router.push(`/case/${item.id}` as any);
  };

  const onTabChange = (next: SearchTab) => {
    setTab(next);
    if (next !== "statute") {
      setSelectedCode(null);
    }
    if (query.trim()) {
      void runSearch(query, next === "statute" ? selectedCode : null, next);
    } else {
      setError(null);
      setResults([]);
      setResultTotal(null);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <ScreenHeader
        title="검색"
        subtitle="조문·판례를 하이브리드 검색합니다"
      />

      <SegmentedTabs tabs={SEARCH_TABS} value={tab} onChange={onTabChange} />

      <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
        <View className="px-6 pt-4">
          <Input
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => void runSearch()}
            returnKeyType="search"
            placeholder="조문·판례·키워드"
          />
          <View className="mt-3 flex-row items-center gap-3">
            <Pressable
              onPress={() => void runSearch()}
              className="h-9 items-center justify-center rounded bg-violet px-4"
              style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
              hitSlop={8}
              accessibilityLabel="검색 실행"
            >
              <Text className="font-mono text-[10px] uppercase text-white" numberOfLines={1}>
                search
              </Text>
            </Pressable>
            {selectedCode && tab === "statute" && (
              <Pressable
                onPress={() => {
                  setSelectedCode(null);
                  void runSearch(query, null, "statute");
                }}
                className="h-9 items-center justify-center rounded border border-violet/30 bg-violet/10 px-3"
                hitSlop={8}
              >
                <Text className="font-mono text-[10px] uppercase text-violet-glow" numberOfLines={1}>
                  filter · {selectedCode}
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        {!!error && (
          <View className="mt-4 px-6">
            <View className="rounded border border-danger/40 bg-danger/10 p-3">
              <Text className="font-mono text-[10px] text-danger">// {error}</Text>
            </View>
          </View>
        )}

        <View className="mt-8 px-6">
          <Text className="font-mono text-[10px] uppercase tracking-wider text-cyan">
            // 검색 결과
          </Text>
          <View className="mt-3 gap-3">
            {loading ? (
              <View className="gap-3">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </View>
            ) : results.length > 0 ? (
              results.map((item) => (
                <PressableCard
                  key={`${item.type}-${item.id}`}
                  onPress={() => openResult(item)}
                >
                  <View className="flex-row items-start">
                    <View className="flex-1 mr-3">
                      <SourceBadge
                        kind={item.type === "statute" ? "statute" : "case"}
                        label={
                          item.type === "statute"
                            ? item.codeKr ?? "조문"
                            : COURT_LABEL[item.court ?? ""] ?? item.court ?? "판례"
                        }
                        meta={
                          item.type === "statute"
                            ? item.articleNo ?? undefined
                            : item.caseNo ?? undefined
                        }
                      />
                      <Text
                        className="mt-2 font-kr text-base font-semibold text-fg"
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                      <Text
                        className="mt-2 font-kr text-sm leading-6 text-dim"
                        numberOfLines={2}
                      >
                        {item.textPreview}
                      </Text>
                      <View className="mt-3 flex-row items-center gap-3">
                        <Text className="font-mono text-[10px] text-cyan" numberOfLines={1}>
                          // score {item.score.toFixed(3)}
                        </Text>
                        {item.type === "case" && item.decidedAt && (
                          <Text className="font-mono text-[10px] text-dim" numberOfLines={1}>
                            {CATEGORY_LABEL[item.category ?? ""] ?? item.category} · {item.decidedAt}
                          </Text>
                        )}
                      </View>
                    </View>
                    <Text className="font-mono text-xs text-dim">→</Text>
                  </View>
                </PressableCard>
              ))
            ) : query.trim().length > 0 ? (
              <EmptyState
                title="검색 결과가 없습니다"
                hint="다른 키워드나 조문/사건번호로 다시 시도해보세요"
              />
            ) : (
              <EmptyState
                title="무엇을 찾으시나요?"
                hint='조문명, 키워드, 또는 "민법 750조", "2019다236385"처럼 입력하세요'
              />
            )}
          </View>
          {resultTotal !== null && results.length > 0 && (
            <Text className="mt-3 font-mono text-[10px] text-dim" numberOfLines={1}>
              // total {resultTotal}
            </Text>
          )}
        </View>

        <View className="mt-8 px-6">
          <Text className="font-mono text-[10px] uppercase tracking-wider text-cyan">
            // 최근 검색
          </Text>
          <View className="mt-3 flex-row flex-wrap gap-2">
            {bootstrapping ? (
              <Text className="font-mono text-[10px] text-dim">loading...</Text>
            ) : recent.length > 0 ? (
              recent.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => triggerPresetSearch(item)}
                  className="h-9 items-center justify-center rounded border border-white/10 bg-surface-high px-3"
                  hitSlop={8}
                >
                  <Text className="font-kr text-xs text-fg" numberOfLines={1}>
                    {item}
                  </Text>
                </Pressable>
              ))
            ) : (
              <Text className="font-kr text-sm text-dim" numberOfLines={1}>
                아직 최근 검색 기록이 없습니다
              </Text>
            )}
          </View>
        </View>

        <View className="mt-8 px-6">
          <Text className="font-mono text-[10px] uppercase tracking-wider text-cyan">
            // 인기 검색어
          </Text>
          <View className="mt-3 gap-2">
            {bootstrapping ? (
              <Text className="font-mono text-[10px] text-dim">loading...</Text>
            ) : popular.length > 0 ? (
              popular.map((item) => (
                <Pressable
                  key={`${item.rank}-${item.query}`}
                  onPress={() => triggerPresetSearch(item.query)}
                  className="h-9 flex-row items-center gap-4"
                  hitSlop={8}
                >
                  <Text className="font-mono text-sm text-cyan" numberOfLines={1}>
                    {String(item.rank).padStart(2, "0")}
                  </Text>
                  <Text className="flex-1 font-kr text-sm text-fg" numberOfLines={1}>
                    {item.query}
                  </Text>
                </Pressable>
              ))
            ) : (
              <Text className="font-kr text-sm text-dim" numberOfLines={1}>
                인기 검색어 집계가 아직 없습니다
              </Text>
            )}
          </View>
        </View>

        <View className="mt-8 px-6 pb-8">
          <Text className="font-mono text-[10px] uppercase tracking-wider text-cyan">
            // 카테고리
          </Text>
          <View className="mt-3 flex-row flex-wrap gap-3">
            {CATEGORIES.map((item) => {
              const selected = selectedCode === item.code;
              return (
                <Pressable
                  key={item.code}
                  onPress={() => selectCategory(item.code)}
                  className="w-[48%]"
                >
                  <Card selected={selected}>
                    <Icon
                      name={item.iconName}
                      size={22}
                      color={selected ? ICON_COLOR.violetGlow : ICON_COLOR.fg}
                    />
                    <Text
                      className="mt-2 font-kr text-base font-semibold text-fg"
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    <Text
                      className="font-mono text-[10px] text-dim"
                      numberOfLines={1}
                    >
                      // {item.count}
                    </Text>
                  </Card>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
