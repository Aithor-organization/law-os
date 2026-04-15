import { useState } from "react";
import { ScrollView, Text, View, Pressable, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";

/**
 * 🎨 Stitch Reference: projects/7657386961511176864/screens/252821e0257346ba9b713d333b3054df
 * Active Chat (Obsidian Terminal)
 *
 * Demo: 모든 버튼/출처/피드백이 네비게이션으로 연결되어 있습니다. 로직 미연결.
 */

type Msg =
  | { role: "user"; content: string; time: string }
  | {
      role: "assistant";
      content: string;
      citations: { label: string; type: "statute" | "case"; id: string }[];
      time: string;
    };

const MESSAGES: Msg[] = [
  {
    role: "user",
    content: "민법 750조의 불법행위 성립요건이 뭐야?",
    time: "오후 3:42",
  },
  {
    role: "assistant",
    content:
      "민법 제750조에 따른 불법행위가 성립하려면 다음 4가지 요건이 충족되어야 합니다.\n\n1. 고의 또는 과실 — 가해자의 주관적 요건\n2. 위법성 — 법질서 전체에 비추어 허용되지 않는 행위\n3. 책임능력 — 자기 행위의 결과를 변식할 수 있는 능력\n4. 손해의 발생과 인과관계 — 실제 손해와 가해행위 간 상당인과관계\n\n대법원은 과실의 판단 기준으로 [판례 1] '통상의 주의의무'를 제시하고 있으며, 최근 [판례 2]에서는 직업별 전문가의 높은 주의의무를 강조했습니다.",
    citations: [
      { label: "조문 1", type: "statute", id: "civil-750" },
      { label: "판례 1", type: "case", id: "2018da12345" },
      { label: "판례 2", type: "case", id: "2019da201528" },
    ],
    time: "오후 3:42",
  },
];

export default function ActiveChatScreen() {
  const { id } = useLocalSearchParams();
  const [mode, setMode] = useState<"normal" | "debate">("normal");
  const [input, setInput] = useState("");

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      {/* ═══ HEADER ═══ */}
      <View className="flex-row items-center justify-between border-b border-white/5 px-4 py-3">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center"
        >
          <Text className="font-mono text-xs text-dim">← back</Text>
        </Pressable>
        <View className="flex-1 items-center">
          <Text className="font-kr text-sm font-semibold text-fg" numberOfLines={1}>
            민법 750조 불법행위
          </Text>
          <Text className="font-mono text-[10px] text-cyan">
            // conv · {id}
          </Text>
        </View>
        <Pressable
          onPress={() => router.push("/modals/save-note" as any)}
          className="h-10 w-10 items-center justify-center"
        >
          <Text className="font-mono text-xs text-dim">⋯</Text>
        </Pressable>
      </View>

      {/* Mode toggle */}
      <View className="flex-row items-center justify-center gap-3 border-b border-white/5 px-6 py-2">
        <Pressable onPress={() => setMode("normal")}>
          <Text
            className={`font-mono text-[10px] uppercase tracking-wider ${
              mode === "normal" ? "text-violet-glow" : "text-dim"
            }`}
          >
            // normal
          </Text>
        </Pressable>
        <Text className="text-dim">·</Text>
        <Pressable onPress={() => setMode("debate")}>
          <Text
            className={`font-mono text-[10px] uppercase tracking-wider ${
              mode === "debate" ? "text-violet-glow" : "text-dim"
            }`}
          >
            ⚖️ deep debate
          </Text>
        </Pressable>
      </View>

      {/* ═══ MESSAGES ═══ */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingVertical: 16, paddingHorizontal: 16 }}
      >
        {MESSAGES.map((msg, i) => (
          <View key={i} className="mb-6">
            {msg.role === "user" ? (
              <View className="items-end">
                <View className="max-w-[80%] rounded bg-surface-high px-4 py-3">
                  <Text className="font-kr text-sm text-fg">{msg.content}</Text>
                </View>
                <Text className="mt-1 font-mono text-[10px] text-dim">
                  {msg.time}
                </Text>
              </View>
            ) : (
              <View>
                {/* Assistant header */}
                <View className="mb-2 flex-row items-center gap-2">
                  <View className="h-6 w-6 items-center justify-center rounded-full bg-violet/20">
                    <Text className="font-mono text-[10px] text-violet-glow">
                      AI
                    </Text>
                  </View>
                  <Text className="font-mono text-[10px] uppercase text-dim">
                    law.os · claude sonnet 4.5
                  </Text>
                </View>

                {/* Body with violet accent bar */}
                <View className="flex-row">
                  <View className="mr-3 w-0.5 rounded-full bg-violet" />
                  <View className="flex-1 rounded bg-surface p-4">
                    <Text className="font-kr text-sm leading-6 text-fg">
                      {msg.content}
                    </Text>

                    {/* Citations */}
                    <View className="mt-4 gap-2 border-t border-white/5 pt-3">
                      <Text className="font-mono text-[10px] uppercase tracking-wider text-cyan">
                        // 출처 ({msg.citations.length})
                      </Text>
                      {msg.citations.map((c) => (
                        <Pressable
                          key={c.label}
                          onPress={() =>
                            router.push(
                              c.type === "statute"
                                ? (`/statute/${c.id}` as any)
                                : (`/case/${c.id}` as any),
                            )
                          }
                          className="flex-row items-center gap-2 rounded border border-white/10 bg-surface-low px-3 py-2"
                        >
                          <Text className="font-mono text-[10px] text-violet-glow">
                            [{c.label}]
                          </Text>
                          <Text className="flex-1 font-kr text-xs text-fg">
                            {c.type === "statute"
                              ? "민법 제750조 (불법행위의 내용)"
                              : c.id.startsWith("2018")
                                ? "대법원 2018다12345"
                                : "대법원 2019다201528"}
                          </Text>
                          <Text className="font-mono text-[10px] text-dim">→</Text>
                        </Pressable>
                      ))}
                    </View>

                    {/* Feedback */}
                    <View className="mt-3 flex-row items-center justify-between">
                      <View className="flex-row gap-2">
                        <Pressable
                          onPress={() => router.push("/modals/save-note" as any)}
                          className="rounded border border-white/10 px-3 py-1"
                        >
                          <Text className="font-mono text-[10px] text-fg">
                            👍 helpful
                          </Text>
                        </Pressable>
                        <Pressable className="rounded border border-white/10 px-3 py-1">
                          <Text className="font-mono text-[10px] text-fg">
                            👎 issue
                          </Text>
                        </Pressable>
                      </View>
                      <Text className="font-mono text-[10px] text-dim">
                        {msg.time}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </View>
        ))}

        {/* Disclaimer footer */}
        <View className="mt-2 items-center">
          <Text className="font-mono text-[10px] text-dim">
            // 학습 참고용 · 실제 분쟁은 변호사 상담 필요
          </Text>
        </View>
      </ScrollView>

      {/* ═══ INPUT BAR ═══ */}
      <View className="border-t border-white/5 bg-surface-low px-4 py-3">
        <View className="flex-row items-end gap-2">
          <View className="flex-1 rounded border border-white/10 bg-surface">
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="질문을 입력하세요..."
              placeholderTextColor="#71717A"
              multiline
              className="min-h-[44px] max-h-[120px] px-3 py-3 font-kr text-sm text-fg"
              style={{ outlineStyle: "none" } as any}
            />
          </View>
          <Pressable
            onPress={() => {
              /* demo */
              setInput("");
            }}
            className="h-11 w-11 items-center justify-center rounded bg-violet"
            style={{
              shadowColor: "#A855F7",
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.4,
              shadowRadius: 12,
            }}
          >
            <Text className="font-mono text-sm text-white">↑</Text>
          </Pressable>
        </View>
        <View className="mt-2 flex-row items-center justify-between">
          <Text className="font-mono text-[10px] text-dim">
            // free · 9/10 today
          </Text>
          <Pressable onPress={() => router.push("/modals/paywall" as any)}>
            <Text className="font-mono text-[10px] text-violet-glow">
              upgrade →
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
