import { useState } from "react";
import { ScrollView, Text, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Button } from "@/components/ui/Button";

type Format = "anki" | "pdf" | "json";
type Subject = "all" | "civil" | "criminal" | "constitutional" | "commercial";

const FORMATS: { key: Format; label: string; desc: string; badge: string }[] = [
  { key: "anki", label: "Anki Deck", desc: "플래시카드 · 반복 학습", badge: ".apkg" },
  { key: "pdf", label: "PDF", desc: "인쇄용 · 출처 포함", badge: ".pdf" },
  { key: "json", label: "JSON", desc: "개발자용 · 백업", badge: ".json" },
];

const SUBJECTS: { key: Subject; label: string; count: number }[] = [
  { key: "all", label: "전체", count: 142 },
  { key: "civil", label: "민법", count: 67 },
  { key: "criminal", label: "형법", count: 41 },
  { key: "constitutional", label: "헌법", count: 22 },
  { key: "commercial", label: "상법", count: 12 },
];

export default function ExportModal() {
  const [format, setFormat] = useState<Format>("anki");
  const [subject, setSubject] = useState<Subject>("all");
  const selected = SUBJECTS.find((s) => s.key === subject)!;

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <View className="flex-row items-center justify-between px-6 pt-4">
        <Text className="font-mono text-[10px] uppercase text-violet-glow">
          // export notes
        </Text>
        <Pressable onPress={() => router.back()}>
          <Text className="font-mono text-[10px] uppercase text-dim">close ×</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="mt-8 px-6">
          <Text className="font-kr text-3xl font-bold tracking-tightest text-fg">
            서재 내보내기
          </Text>
          <Text className="mt-2 font-kr text-sm text-dim">
            시험 직전 복습용으로 활용하세요. 7일간 다운로드 가능합니다.
          </Text>
        </View>

        <View className="mt-8 px-6">
          <Text className="font-mono text-[10px] uppercase tracking-wider text-dim">
            // 1. 형식 선택
          </Text>
          <View className="mt-4 gap-3">
            {FORMATS.map((f) => {
              const active = format === f.key;
              return (
                <Pressable
                  key={f.key}
                  onPress={() => setFormat(f.key)}
                  className={`flex-row items-center justify-between rounded-[6px] border px-4 py-4 ${
                    active ? "border-violet bg-surface-high" : "border-white/10 bg-surface"
                  }`}
                >
                  <View className="flex-1">
                    <Text className="font-kr text-base font-semibold text-fg">{f.label}</Text>
                    <Text className="mt-1 font-kr text-xs text-dim">{f.desc}</Text>
                  </View>
                  <Text className="font-mono text-[10px] uppercase text-cyan">{f.badge}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="mt-8 px-6">
          <Text className="font-mono text-[10px] uppercase tracking-wider text-dim">
            // 2. 과목 선택
          </Text>
          <View className="mt-4 flex-row flex-wrap gap-2">
            {SUBJECTS.map((s) => {
              const active = subject === s.key;
              return (
                <Pressable
                  key={s.key}
                  onPress={() => setSubject(s.key)}
                  className={`rounded-[6px] border px-3 py-2 ${
                    active ? "border-violet bg-violet/20" : "border-white/10 bg-surface"
                  }`}
                >
                  <Text
                    className={`font-mono text-xs ${active ? "text-violet-glow" : "text-dim"}`}
                  >
                    {s.label} · {s.count}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="mx-6 mt-8 rounded-[6px] border border-white/10 bg-surface-high p-4">
          <Text className="font-mono text-[10px] uppercase text-dim">// summary</Text>
          <Text className="mt-2 font-kr text-sm text-fg">
            {selected.label} · {selected.count}개 노트 → {format.toUpperCase()}
          </Text>
        </View>

        <View className="mt-8 gap-3 px-6">
          <Button
            variant="primary"
            onPress={() =>
              router.replace({ pathname: "/modals/purchase-success" } as any)
            }
          >
            내보내기 ({selected.count}개)
          </Button>
          <Button variant="ghost" onPress={() => router.back()}>
            취소
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
