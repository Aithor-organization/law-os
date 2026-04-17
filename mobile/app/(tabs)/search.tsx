import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import {
  listRecentSearches,
  listTrendingSearches,
  searchLawContent,
  type SearchCode,
  type SearchItem,
} from "@/lib/search";

const CATEGORIES: Array<{ code: SearchCode; name: string; count: string; icon: string }> = [
  { code: "civil", name: "민법", count: "1,118조", icon: "⚖️" },
  { code: "criminal", name: "형법", count: "372조", icon: "🔨" },
  { code: "constitutional", name: "헌법", count: "130조", icon: "📜" },
  { code: "commercial", name: "상법", count: "935조", icon: "💼" },
];

type SearchTab = "statute" | "case" | "all";

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

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
        <View className="px-6 pt-4">
          <Text className="font-kr text-3xl font-bold text-fg">검색</Text>
          <Text className="mt-2 font-kr text-sm text-dim">
            조문·판례 검색과 기본 하이브리드 결과를 연결했습니다.
          </Text>
        </View>

        <View className="mt-6 px-6">
          <View className="rounded border border-white/10 bg-surface px-4 py-3">
            <TextInput
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={() => void runSearch()}
              returnKeyType="search"
              placeholder="조문·판례·키워드..."
              placeholderTextColor="#71717A"
              className="font-kr text-base text-fg"
              style={{ outlineStyle: "none" } as any}
            />
          </View>
          <View className="mt-3 flex-row items-center gap-3">
            <Pressable
              onPress={() => void runSearch()}
              className="rounded bg-violet px-4 py-2"
            >
              <Text className="font-mono text-[10px] uppercase text-white">search</Text>
            </Pressable>
            {selectedCode && tab === "statute" && (
              <Pressable
                onPress={() => {
                  setSelectedCode(null);
                  void runSearch(query, null, "statute");
                }}
                className="rounded border border-violet/30 bg-violet/10 px-3 py-2"
              >
                <Text className="font-mono text-[10px] uppercase text-violet-glow">
                  filter · {selectedCode}
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        <View className="mt-4 flex-row gap-4 px-6">
          {[
            { key: "statute", label: "조문" },
            { key: "case", label: "판례" },
            { key: "all", label: "전체" },
          ].map((item) => (
            <Pressable
              key={item.key}
              onPress={() => {
                const nextTab = item.key as SearchTab;
                setTab(nextTab);
                if (nextTab !== "statute") {
                  setSelectedCode(null);
                }
                if (query.trim()) {
                  void runSearch(query, nextTab === "statute" ? selectedCode : null, nextTab);
                } else {
                  setError(null);
                  setResults([]);
                  setResultTotal(null);
                }
              }}
            >
              <Text
                className={`font-mono text-xs uppercase ${
                  tab === item.key ? "text-violet-glow" : "text-dim"
                }`}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
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
              <View className="flex-row items-center gap-3 rounded border border-white/10 bg-surface p-4">
                <ActivityIndicator size="small" color="#A855F7" />
                <Text className="font-kr text-sm text-fg">검색 중...</Text>
              </View>
            ) : results.length > 0 ? (
              results.map((item) => (
                <Pressable
                  key={`${item.type}-${item.id}`}
                  onPress={() => openResult(item)}
                  className="rounded border border-white/10 bg-surface p-4"
                >
                  <View className="flex-row items-start justify-between gap-3">
                    <View className="flex-1">
                      <Text className="font-mono text-[10px] uppercase text-violet-glow">
                        {item.type === "statute"
                          ? `${item.codeKr ?? "조문"} · ${item.articleNo ?? "-"}`
                          : `${COURT_LABEL[item.court ?? ""] ?? item.court ?? "판례"} · ${item.caseNo ?? item.id}`}
                      </Text>
                      <Text className="mt-2 font-kr text-base font-semibold text-fg">
                        {item.title}
                      </Text>
                      <Text className="mt-2 font-kr text-sm leading-6 text-dim">
                        {item.textPreview}
                      </Text>
                      <View className="mt-3 flex-row items-center gap-3">
                        <Text className="font-mono text-[10px] text-cyan">
                          // score {item.score.toFixed(3)}
                        </Text>
                        {item.type === "case" && item.decidedAt && (
                          <Text className="font-mono text-[10px] text-dim">
                            {CATEGORY_LABEL[item.category ?? ""] ?? item.category} · {item.decidedAt}
                          </Text>
                        )}
                      </View>
                    </View>
                    <Text className="font-mono text-xs text-dim">→</Text>
                  </View>
                </Pressable>
              ))
            ) : query.trim().length > 0 ? (
              <View className="rounded border border-white/10 bg-surface p-4">
                <Text className="font-kr text-sm text-dim">
                  검색 결과가 없습니다. 다른 키워드나 조문/사건번호를 입력해보세요.
                </Text>
              </View>
            ) : (
              <View className="rounded border border-white/10 bg-surface p-4">
                <Text className="font-kr text-sm text-dim">
                  조문명, 키워드, 또는 “민법 750조”, “2019다236385”처럼 입력하면 결과가 나타납니다.
                </Text>
              </View>
            )}
          </View>
          {resultTotal !== null && results.length > 0 && (
            <Text className="mt-3 font-mono text-[10px] text-dim">
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
                  className="rounded border border-white/10 bg-surface-high px-3 py-2"
                >
                  <Text className="font-kr text-xs text-fg">{item}</Text>
                </Pressable>
              ))
            ) : (
              <Text className="font-kr text-sm text-dim">아직 최근 검색 기록이 없습니다.</Text>
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
                  className="flex-row items-center gap-4"
                >
                  <Text className="font-mono text-sm text-cyan">
                    {String(item.rank).padStart(2, "0")}
                  </Text>
                  <Text className="font-kr text-sm text-fg">{item.query}</Text>
                </Pressable>
              ))
            ) : (
              <Text className="font-kr text-sm text-dim">인기 검색어 집계가 아직 없습니다.</Text>
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
                  className={`w-[48%] rounded border p-4 ${
                    selected
                      ? "border-violet/40 bg-violet/10"
                      : "border-white/10 bg-surface"
                  }`}
                >
                  <Text className="text-2xl">{item.icon}</Text>
                  <Text className="mt-2 font-kr text-base font-semibold text-fg">
                    {item.name}
                  </Text>
                  <Text className="font-mono text-[10px] text-dim">// {item.count}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
