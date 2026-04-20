import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";

import {
  listMySubscriptions,
  unsubscribeLaw,
  type MySubscription,
} from "@/lib/laws";

export default function MyLawsScreen() {
  const [items, setItems] = useState<MySubscription[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listMySubscriptions();
      setItems(data);
    } catch (e: any) {
      Alert.alert("불러오기 실패", e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const handleRemove = (item: MySubscription) => {
    Alert.alert(
      "법령 제거",
      `${item.law_catalog.korean_name}을(를) 제거할까요? 관련 질문의 RAG 인용에서 제외됩니다.`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "제거",
          style: "destructive",
          onPress: async () => {
            try {
              await unsubscribeLaw(item.code);
              await load();
            } catch (e: any) {
              Alert.alert("제거 실패", e.message ?? String(e));
            }
          },
        },
      ],
    );
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
        <Text className="font-kr text-base font-semibold text-fg">내 법령</Text>
        <Pressable
          onPress={() => router.push("/laws/browse" as any)}
          accessibilityRole="button"
          accessibilityLabel="법령 추가"
          className="h-10 items-center justify-center px-3"
        >
          <Text className="font-mono text-xs text-violet-glow">+ 추가</Text>
        </Pressable>
      </View>

      {loading ? (
        <View className="items-center py-16">
          <ActivityIndicator size="small" color="#A855F7" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.code}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View className="items-center py-12">
              <Text className="font-kr text-sm text-dim">구독한 법령이 없습니다.</Text>
            </View>
          }
          renderItem={({ item }) => {
            // law_catalog.is_default 정보가 join에 없어서 서버에서 직접 안 받는다.
            // MVP: 모든 항목에 제거 버튼 표시. 백엔드가 기본 법령도 제거 허용함
            // (기본 법령은 재구독 가능).
            const loaded = item.law_catalog?.loaded ?? true;
            return (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  marginBottom: 8,
                  backgroundColor: "#1a1a1a",
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text className="font-kr text-base text-fg">
                    {item.law_catalog?.korean_name ?? item.code}
                  </Text>
                  <Text className="mt-1 font-mono text-[10px] text-dim">
                    {item.law_catalog?.category ?? "—"}
                    {" · "}
                    {loaded
                      ? `${item.law_catalog?.article_count ?? 0}개 조문`
                      : "로드 중..."}
                  </Text>
                </View>
                <Pressable
                  onPress={() => handleRemove(item)}
                  accessibilityRole="button"
                  accessibilityLabel="제거"
                  style={{ paddingHorizontal: 10, paddingVertical: 6 }}
                >
                  <Text className="font-mono text-xs text-danger">제거</Text>
                </Pressable>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
