import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import {
  listCatalog,
  listMySubscriptions,
  subscribeLaw,
  type CatalogItem,
} from "@/lib/laws";

const CATEGORIES = [
  "전체",
  "부동산",
  "노동",
  "가족",
  "교통",
  "세금",
  "지재권",
  "정보통신",
  "환경",
  "의료",
  "특례",
  "교육",
  "경제",
  "금융",
  "도산",
  "행정",
  "기타",
];

export default function LawsBrowseScreen() {
  const [category, setCategory] = useState("전체");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [subscribedCodes, setSubscribedCodes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [installing, setInstalling] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [catalog, mySubs] = await Promise.all([
        listCatalog({
          category: category === "전체" ? undefined : category,
          search: search.trim() || undefined,
          limit: 300,
        }),
        listMySubscriptions(),
      ]);
      setItems(catalog);
      setSubscribedCodes(new Set(mySubs.map((s) => s.code)));
    } catch (e: any) {
      Alert.alert("불러오기 실패", e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }, [category, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleInstall = async (item: CatalogItem) => {
    if (installing.has(item.code)) return;
    setInstalling((prev) => new Set(prev).add(item.code));
    try {
      const result = await subscribeLaw(item.code);
      setSubscribedCodes((prev) => new Set(prev).add(item.code));
      if (result.ingesting) {
        Alert.alert(
          "설치 시작됨",
          `${item.korean_name}의 조문을 가져오는 중입니다. 잠시 후 사용할 수 있어요.`,
        );
      } else {
        Alert.alert("설치 완료", `${item.korean_name}이(가) 내 법령에 추가되었습니다.`);
      }
    } catch (e: any) {
      Alert.alert("설치 실패", e.message ?? String(e));
    } finally {
      setInstalling((prev) => {
        const next = new Set(prev);
        next.delete(item.code);
        return next;
      });
    }
  };

  const filtered = useMemo(() => items, [items]);

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
        <Text className="font-kr text-base font-semibold text-fg">법령 찾기</Text>
        <View className="h-10 w-10" />
      </View>

      <View className="px-4 pt-3">
        <View
          style={{
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.1)",
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}
        >
          <TextInput
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={load}
            placeholder="법령명 검색 (예: 저작권)"
            placeholderTextColor="#71717A"
            style={{
              color: "#F4F4F5",
              fontSize: 15,
              fontFamily: "Pretendard",
              minHeight: 28,
            }}
          />
        </View>
      </View>

      <View className="mt-3">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, gap: 6 }}
        >
          {CATEGORIES.map((c) => {
            const active = c === category;
            return (
              <Pressable
                key={c}
                onPress={() => setCategory(c)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 999,
                  backgroundColor: active ? "#A855F7" : "rgba(255,255,255,0.06)",
                }}
              >
                <Text
                  className="font-kr text-xs"
                  style={{ color: active ? "white" : "#A0A0A0" }}
                >
                  {c}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View className="items-center py-16">
          <ActivityIndicator size="small" color="#A855F7" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.code}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View className="items-center py-12">
              <Text className="font-kr text-sm text-dim">검색 결과가 없습니다.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isSubscribed = subscribedCodes.has(item.code);
            const isInstalling = installing.has(item.code);
            return (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.08)",
                  borderRadius: 8,
                  marginBottom: 8,
                  backgroundColor: "#1a1a1a",
                }}
              >
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text className="font-kr text-sm text-fg">{item.korean_name}</Text>
                  <Text className="mt-1 font-mono text-[10px] text-dim">
                    {item.category}
                    {item.loaded ? ` · ${item.article_count ?? 0}개 조문` : " · 미설치"}
                  </Text>
                </View>
                {isSubscribed ? (
                  <View
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 6,
                      backgroundColor: "rgba(34,197,94,0.15)",
                    }}
                  >
                    <Text className="font-mono text-[10px] text-success">설치됨</Text>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => handleInstall(item)}
                    disabled={isInstalling}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 6,
                      backgroundColor: isInstalling
                        ? "rgba(168,85,247,0.3)"
                        : "#A855F7",
                    }}
                  >
                    <Text className="font-mono text-[10px] text-white">
                      {isInstalling ? "설치 중..." : "설치"}
                    </Text>
                  </Pressable>
                )}
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
