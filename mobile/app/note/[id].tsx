import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";

import {
  deleteNote,
  getNote,
  markNoteReviewed,
  toggleNoteStar,
  type Note,
  type NoteSubject,
} from "@/lib/notes";

const SUBJECT_LABEL: Record<NoteSubject, string> = {
  civil: "민법",
  criminal: "형법",
  constitutional: "헌법",
  commercial: "상법",
  other: "기타",
};

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const { data, error } = await getNote(id);
    setLoading(false);
    if (error) {
      Alert.alert("불러오기 실패", error.message);
      return;
    }
    setNote(data);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleToggleStar = async () => {
    if (!note || busy) return;
    const next = !note.starred;
    setNote({ ...note, starred: next });
    setBusy(true);
    const { error } = await toggleNoteStar({ id: note.id, next });
    setBusy(false);
    if (error) {
      setNote({ ...note, starred: !next });
      Alert.alert("즐겨찾기 실패", error.message);
    }
  };

  const handleReview = async () => {
    if (!note || busy) return;
    setBusy(true);
    const { error } = await markNoteReviewed(note.id);
    setBusy(false);
    if (error) {
      Alert.alert("복습 기록 실패", error.message);
      return;
    }
    await load();
  };

  const handleDelete = () => {
    if (!note) return;
    Alert.alert("노트 삭제", "정말 삭제할까요? 되돌릴 수 없습니다.", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          setBusy(true);
          const { error } = await deleteNote(note.id);
          setBusy(false);
          if (error) {
            Alert.alert("삭제 실패", error.message);
            return;
          }
          router.back();
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <View className="flex-row items-center justify-between border-b border-white/5 px-4 py-3">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="뒤로가기"
          className="h-10 w-10 items-center justify-center"
        >
          <Text className="font-mono text-xs text-dim">← back</Text>
        </Pressable>
        <Text className="font-mono text-[10px] uppercase text-cyan">
          // note
        </Text>
        <View className="flex-row gap-2">
          <Pressable
            onPress={handleToggleStar}
            accessibilityRole="button"
            accessibilityLabel="즐겨찾기 토글"
            className="h-10 w-10 items-center justify-center"
          >
            <Text className={`font-mono text-sm ${note?.starred ? "text-violet-glow" : "text-dim"}`}>
              ⭐
            </Text>
          </Pressable>
          <Pressable
            onPress={handleDelete}
            accessibilityRole="button"
            accessibilityLabel="노트 삭제"
            className="h-10 w-10 items-center justify-center"
          >
            <Text className="font-mono text-sm text-danger">🗑</Text>
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="small" color="#A855F7" />
        </View>
      ) : !note ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="font-kr text-base text-dim">노트를 찾을 수 없습니다.</Text>
        </View>
      ) : (
        <ScrollView className="flex-1">
          <View className="px-6 pt-6">
            <View className="flex-row flex-wrap gap-1">
              <Text className="font-mono text-[10px] uppercase tracking-wider text-violet-glow">
                {SUBJECT_LABEL[note.subject]}
              </Text>
              {note.topic ? (
                <>
                  <Text className="font-mono text-[10px] text-dim">/</Text>
                  <Text className="font-mono text-[10px] uppercase tracking-wider text-violet-glow">
                    {note.topic}
                  </Text>
                </>
              ) : null}
            </View>

            {note.tags && note.tags.length > 0 ? (
              <View className="mt-3 flex-row flex-wrap gap-2">
                {note.tags.map((tag) => (
                  <View
                    key={tag}
                    className="rounded border border-white/10 bg-surface px-2 py-1"
                  >
                    <Text className="font-mono text-[10px] text-dim">#{tag}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>

          <View className="mt-8 px-6">
            <View className="flex-row items-center gap-2">
              <View className="h-6 w-6 items-center justify-center rounded-full bg-violet/20">
                <Text className="font-mono text-xs font-bold text-violet-glow">Q</Text>
              </View>
              <Text className="font-mono text-[10px] uppercase tracking-wider text-violet-glow">
                question
              </Text>
            </View>
            <View className="mt-3 rounded bg-surface p-4">
              <Text className="font-kr text-base leading-6 text-fg">{note.question}</Text>
            </View>
          </View>

          <View className="mt-6 px-6">
            <View className="flex-row items-center gap-2">
              <View className="h-6 w-6 items-center justify-center rounded-full bg-cyan/20">
                <Text className="font-mono text-xs font-bold text-cyan">A</Text>
              </View>
              <Text className="font-mono text-[10px] uppercase tracking-wider text-cyan">
                answer
              </Text>
            </View>
            <View className="mt-3 flex-row">
              <View className="mr-3 w-0.5 rounded-full bg-cyan" />
              <View className="flex-1 rounded bg-surface p-4">
                <Text className="font-kr text-sm leading-6 text-fg">{note.answer}</Text>
              </View>
            </View>
          </View>

          <View className="mt-8 px-6">
            <View className="rounded border border-white/5 bg-surface-low p-4">
              <Text className="font-mono text-[10px] uppercase tracking-wider text-dim">
                // review metadata
              </Text>
              <View className="mt-3 flex-row justify-between">
                <View>
                  <Text className="font-mono text-[10px] text-dim">saved</Text>
                  <Text className="font-mono text-xs text-cyan">
                    {formatDate(note.created_at)}
                  </Text>
                </View>
                <View>
                  <Text className="font-mono text-[10px] text-dim">reviewed</Text>
                  <Text className="font-mono text-xs text-cyan">
                    {note.review_count}x
                  </Text>
                </View>
                <View>
                  <Text className="font-mono text-[10px] text-dim">next</Text>
                  <Text className="font-mono text-xs text-violet-glow">
                    {formatDate(note.next_review_at)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View className="h-24" />
        </ScrollView>
      )}

      {note ? (
        <View className="absolute bottom-6 right-6">
          <Pressable
            onPress={handleReview}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel="복습 완료"
            className="h-14 flex-row items-center gap-2 rounded bg-violet px-6"
            style={{
              shadowColor: "#A855F7",
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.5,
              shadowRadius: 24,
              opacity: busy ? 0.6 : 1,
            }}
          >
            <Text className="font-mono text-sm text-white">🔁</Text>
            <Text className="font-kr text-sm font-semibold text-white">
              {busy ? "저장 중..." : "복습 완료"}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}
