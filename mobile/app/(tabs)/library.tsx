import { ScrollView, Text, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

const FOLDERS = [
  { subject: "민법", count: 47, color: "#A855F7" },
  { subject: "형법", count: 23, color: "#06B6D4" },
  { subject: "헌법", count: 15, color: "#FBBF24" },
  { subject: "상법", count: 8, color: "#10B981" },
];

const NOTES = [
  {
    id: "1",
    question: "민법 750조에서 '고의 또는 과실'의 판단 기준은?",
    subject: "민법",
    topic: "불법행위",
    time: "2일 전",
  },
  {
    id: "2",
    question: "채권자대위권의 성립요건은 무엇인가요?",
    subject: "민법",
    topic: "채권",
    time: "5일 전",
  },
  {
    id: "3",
    question: "형법 250조 살인죄의 고의 개념",
    subject: "형법",
    topic: "생명",
    time: "1주 전",
  },
];

export default function LibraryScreen() {
  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4">
          <Text className="font-kr text-2xl font-bold text-fg">서재</Text>
          <Pressable onPress={() => router.push("/modals/export" as any)}>
            <Text className="font-mono text-xs uppercase text-cyan">
              // export
            </Text>
          </Pressable>
        </View>

        {/* Stats */}
        <View className="mx-6 flex-row items-center justify-between rounded border border-white/10 bg-surface p-4">
          <View>
            <Text className="font-mono text-2xl text-cyan">93</Text>
            <Text className="font-mono text-[10px] uppercase text-dim">
              // total notes
            </Text>
          </View>
          <View>
            <Text className="font-mono text-2xl text-cyan">47</Text>
            <Text className="font-mono text-[10px] uppercase text-dim">
              // streak days
            </Text>
          </View>
          <View>
            <Text className="font-mono text-2xl text-violet-glow">12</Text>
            <Text className="font-mono text-[10px] uppercase text-dim">
              // due review
            </Text>
          </View>
        </View>

        {/* Folders */}
        <View className="mt-6 px-6">
          <Text className="font-mono text-[10px] uppercase tracking-wider text-cyan">
            // 과목별
          </Text>
          <View className="mt-3 flex-row flex-wrap gap-3">
            {FOLDERS.map((f) => (
              <Pressable
                key={f.subject}
                onPress={() => router.push("/note/1" as any)}
                className="w-[48%] rounded border border-white/10 bg-surface p-4"
              >
                <View
                  className="h-1 w-8 rounded-full"
                  style={{ backgroundColor: f.color }}
                />
                <Text className="mt-3 font-kr text-lg font-semibold text-fg">
                  {f.subject}
                </Text>
                <Text className="font-mono text-[10px] text-dim">
                  // {f.count} notes
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Recent notes */}
        <View className="mt-6 px-6 pb-8">
          <Text className="font-mono text-[10px] uppercase tracking-wider text-cyan">
            // 최근 노트
          </Text>
          <View className="mt-3 gap-3">
            {NOTES.map((note) => (
              <Pressable
                key={note.id}
                onPress={() => router.push(`/note/${note.id}` as any)}
                className="rounded border border-white/10 bg-surface p-4"
              >
                <View className="flex-row items-center gap-2">
                  <Text className="font-mono text-[10px] uppercase text-violet-glow">
                    {note.subject} · {note.topic}
                  </Text>
                  <Text className="font-mono text-[10px] text-dim">
                    · {note.time}
                  </Text>
                </View>
                <Text
                  className="mt-2 font-kr text-sm text-fg"
                  numberOfLines={2}
                >
                  Q. {note.question}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
