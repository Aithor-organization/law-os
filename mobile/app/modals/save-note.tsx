import { useMemo, useState } from "react";
import { Alert, ScrollView, Text, View, Pressable, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Button } from "@/components/ui/Button";
import { createNote, type NoteSubject } from "@/lib/notes";

const SUBJECTS: { key: NoteSubject; label: string }[] = [
  { key: "civil", label: "민법" },
  { key: "criminal", label: "형법" },
  { key: "constitutional", label: "헌법" },
  { key: "commercial", label: "상법" },
  { key: "other", label: "기타" },
];

export default function SaveNoteModal() {
  const params = useLocalSearchParams<{
    question?: string;
    answer?: string;
    messageId?: string;
  }>();

  const initialQ = useMemo(() => (params.question ?? "").toString(), [params.question]);
  const initialA = useMemo(() => (params.answer ?? "").toString(), [params.answer]);
  const messageId = useMemo(
    () => (params.messageId ? params.messageId.toString() : null),
    [params.messageId],
  );

  const [question, setQuestion] = useState(initialQ);
  const [answer, setAnswer] = useState(initialA);
  const [subject, setSubject] = useState<NoteSubject>("civil");
  const [topic, setTopic] = useState("");
  const [starred, setStarred] = useState(false);
  const [saving, setSaving] = useState(false);

  const canSave = question.trim().length > 0 && answer.trim().length > 0 && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    const { error } = await createNote({
      question,
      answer,
      subject,
      topic: topic.trim() || null,
      starred,
      messageId,
    });
    setSaving(false);
    if (error) {
      Alert.alert("저장 실패", error.message);
      return;
    }
    router.back();
  };

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

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        <View className="mt-8 px-6">
          <Text className="font-kr text-3xl font-bold tracking-tightest text-fg">
            서재에 저장
          </Text>
          <Text className="mt-2 font-kr text-sm text-dim">
            과목별로 분류해 저장하면 시험 직전 복습이 쉬워집니다.
          </Text>
        </View>

        <View className="mx-6 mt-6">
          <Text className="font-mono text-[10px] uppercase tracking-wider text-dim">
            // 질문
          </Text>
          <View className="mt-2 rounded-[6px] border border-white/10 bg-surface-high px-4 py-3">
            <TextInput
              value={question}
              onChangeText={setQuestion}
              placeholder="예: 불법행위의 성립 요건은?"
              placeholderTextColor="#52525B"
              multiline
              style={{ color: "#F4F4F5", fontSize: 14, minHeight: 40 }}
            />
          </View>
        </View>

        <View className="mx-6 mt-4">
          <Text className="font-mono text-[10px] uppercase tracking-wider text-dim">
            // 답변
          </Text>
          <View className="mt-2 rounded-[6px] border border-white/10 bg-surface-high px-4 py-3">
            <TextInput
              value={answer}
              onChangeText={setAnswer}
              placeholder="핵심 내용을 요약하여 저장"
              placeholderTextColor="#52525B"
              multiline
              style={{ color: "#F4F4F5", fontSize: 14, minHeight: 80 }}
            />
          </View>
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
          <Button variant="primary" onPress={handleSave} disabled={!canSave}>
            {saving ? "저장 중..." : "저장"}
          </Button>
          <Button variant="ghost" onPress={() => router.back()}>
            취소
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
