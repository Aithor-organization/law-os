import { useEffect, useState } from "react";
import { ScrollView, Text, View, Pressable, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Button } from "@/components/ui/Button";
import { createConversation } from "@/lib/conversations";

const SUGGESTIONS = [
  { category: "민법", text: "제750조 불법행위 성립 요건을 알려주세요" },
  { category: "형법", text: "정당방위와 과잉방위의 구분 기준은?" },
  { category: "헌법", text: "기본권 제한의 4가지 요건을 설명해주세요" },
  { category: "상법", text: "주식회사 설립 절차를 단계별로 알려주세요" },
];

export default function NewChatScreen() {
  const { seed } = useLocalSearchParams<{ seed?: string }>();
  const [text, setText] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (typeof seed === "string" && seed.trim().length > 0) {
      setText(seed);
    }
  }, [seed]);

  const start = async (seedParam?: string) => {
    const seed = (seedParam ?? text).trim();
    if (!seed || creating) return;
    setCreating(true);
    const { data, error } = await createConversation({ title: seed });
    setCreating(false);
    if (error || !data) {
      Alert.alert("대화 생성 실패", error?.message ?? "unknown");
      return;
    }
    router.replace({
      pathname: "/chat/[id]",
      params: { id: data.id, seed },
    } as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <View className="flex-row items-center justify-between px-6 pt-4">
        <Pressable onPress={() => router.back()}>
          <Text className="font-mono text-[10px] uppercase text-dim">← cancel</Text>
        </Pressable>
        <Text className="font-mono text-[10px] uppercase text-violet-glow">
          // new chat
        </Text>
        <View className="w-12" />
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="mt-10 px-6">
          <Text className="font-kr text-3xl font-bold leading-tight tracking-tightest text-fg">
            무엇을 공부해볼까요?
          </Text>
          <Text className="mt-3 font-kr text-sm text-dim">
            조문 · 판례 · 학설을 출처와 함께 답변해드립니다.
          </Text>
        </View>

        <View className="mx-6 mt-8 rounded-[6px] border border-white/10 bg-surface-high p-4">
          <Text className="font-mono text-[10px] uppercase text-dim">// your question</Text>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="예: 민법 제750조 불법행위의 성립 요건"
            placeholderTextColor="#52525B"
            multiline
            style={{ minHeight: 96, color: "#F4F4F5", fontSize: 16, lineHeight: 24, marginTop: 8 }}
          />
        </View>

        <View className="mt-6 px-6">
          <Text className="font-mono text-[10px] uppercase tracking-wider text-dim">
            // 추천 질문
          </Text>
          <View className="mt-4 gap-3">
            {SUGGESTIONS.map((s, i) => (
              <Pressable
                key={i}
                onPress={() => start(s.text)}
                className="rounded-[6px] border border-white/10 bg-surface px-4 py-3"
              >
                <Text className="font-mono text-[10px] uppercase text-cyan">
                  // {s.category}
                </Text>
                <Text className="mt-2 font-kr text-sm text-fg">{s.text}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      <View className="border-t border-white/5 px-6 py-4">
        <Button
          variant="primary"
          onPress={() => start()}
          disabled={text.length === 0 || creating}
        >
          {creating ? "대화 생성 중..." : "질문 시작"}
        </Button>
        <Text className="mt-3 text-center font-mono text-[10px] text-dim">
          // 학습 목적 답변 · 법률 상담 아님
        </Text>
      </View>
    </SafeAreaView>
  );
}
