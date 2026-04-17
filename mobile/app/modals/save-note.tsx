import { useState } from "react";
import { ScrollView, Text, View, Pressable, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Button } from "@/components/ui/Button";

type Subject = "civil" | "criminal" | "constitutional" | "commercial" | "other";

const SUBJECTS: { key: Subject; label: string }[] = [
  { key: "civil", label: "민법" },
  { key: "criminal", label: "형법" },
  { key: "constitutional", label: "헌법" },
  { key: "commercial", label: "상법" },
  { key: "other", label: "기타" },
];

export default function SaveNoteModal() {
  const [subject, setSubject] = useState<Subject>("civil");
  const [topic, setTopic] = useState("");
  const [starred, setStarred] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <View className="flex-row items-center justify-between px-6 pt-4">
        <Text className="font-mono text-[10px] uppercase text-violet-glow">
          // save to library
        </Text>
        <Pressable onPress={() => router.back()}>
          <Text className="font-mono text-[10px] uppercase text-dim">close ×</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="mt-8 px-6">
          <Text className="font-kr text-3xl font-bold tracking-tightest text-fg">
            서재에 저장
          </Text>
          <Text className="mt-2 font-kr text-sm text-dim">
            과목별로 분류해 저장하면 시험 직전 복습이 쉬워집니다.
          </Text>
        </View>

        <View className="mx-6 mt-6 rounded-[6px] border border-white/10 bg-surface-high p-4">
          <Text className="font-mono text-[10px] uppercase text-dim">// preview</Text>
          <Text className="mt-2 font-kr text-xs leading-5 text-dim">
            Q. 불법행위의 성립 요건을 알려주세요
          </Text>
          <Text className="mt-2 font-kr text-xs leading-5 text-fg">
            A. 민법 제750조에 따라 ① 고의·과실 ② 위법성 ③ 손해 발생 ④ 인과관계...
          </Text>
        </View>

        <View className="mt-8 px-6">
          <Text className="font-mono text-[10px] uppercase tracking-wider text-dim">
            // 과목
          </Text>
          <View className="mt-3 flex-row flex-wrap gap-2">
            {SUBJECTS.map((s) => {
              const active = subject === s.key;
              return (
                <Pressable
                  key={s.key}
                  onPress={() => setSubject(s.key)}
                  className={`rounded-[6px] border px-4 py-2 ${
                    active ? "border-violet bg-violet/20" : "border-white/10 bg-surface"
                  }`}
                >
                  <Text
                    className={`font-kr text-sm ${active ? "text-violet-glow" : "text-dim"}`}
                  >
                    {s.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="mt-6 px-6">
          <Text className="font-mono text-[10px] uppercase tracking-wider text-dim">
            // 주제 (선택)
          </Text>
          <View className="mt-3 rounded-[6px] border border-white/10 bg-surface-high px-4 py-3">
            <TextInput
              value={topic}
              onChangeText={setTopic}
              placeholder="예: 불법행위 · 채권총론"
              placeholderTextColor="#52525B"
              style={{ color: "#F4F4F5", fontSize: 14 }}
            />
          </View>
        </View>

        <Pressable
          onPress={() => setStarred((s) => !s)}
          className="mx-6 mt-6 flex-row items-center justify-between rounded-[6px] border border-white/10 bg-surface px-4 py-3"
        >
          <View>
            <Text className="font-kr text-sm text-fg">⭐ 즐겨찾기</Text>
            <Text className="mt-1 font-mono text-[10px] text-dim">
              // 서재 상단에 고정
            </Text>
          </View>
          <View
            className={`h-5 w-5 items-center justify-center rounded-[4px] ${
              starred ? "bg-violet" : "border border-white/20"
            }`}
          >
            {starred && <Text className="font-mono text-[10px] text-white">✓</Text>}
          </View>
        </Pressable>

        <View className="mt-10 gap-3 px-6">
          <Button variant="primary" onPress={() => router.back()}>
            저장
          </Button>
          <Button variant="ghost" onPress={() => router.back()}>
            취소
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
