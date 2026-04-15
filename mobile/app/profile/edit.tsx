import { useState } from "react";
import { ScrollView, Text, View, Pressable, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

/**
 * 🎨 Stitch Reference: projects/7657386961511176864/screens/a7820c8ebc0e485b8b488685129e9703
 * Edit Profile — 프로필 편집
 */

const SCHOOLS = [
  "서울대학교 로스쿨",
  "고려대학교 로스쿨",
  "연세대학교 로스쿨",
  "기타",
];

export default function EditProfileScreen() {
  const [name, setName] = useState("박준호");
  const [school, setSchool] = useState("서울대학교 로스쿨");
  const [year, setYear] = useState<1 | 2 | 3>(1);
  const [examDate, setExamDate] = useState("2027-01");
  const [goal, setGoal] = useState(
    "매일 3시간 민법 복습 · 주말 판례 정리 · 월 1회 모의고사",
  );

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      {/* ═══ HEADER ═══ */}
      <View className="flex-row items-center justify-between border-b border-white/5 px-4 py-3">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center"
        >
          <Text className="font-mono text-xs text-dim">✕</Text>
        </Pressable>
        <Text className="font-kr text-base font-semibold text-fg">
          프로필 편집
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="h-10 items-center justify-center px-3"
        >
          <Text className="font-mono text-xs text-violet-glow">저장</Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
        {/* ═══ AVATAR ═══ */}
        <View className="items-center pt-8">
          <View
            className="h-28 w-28 items-center justify-center rounded-full bg-violet/20"
            style={{
              shadowColor: "#A855F7",
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.5,
              shadowRadius: 24,
            }}
          >
            <Text className="font-kr text-5xl font-bold text-violet-glow">
              박
            </Text>
          </View>
          <Pressable className="mt-3 rounded border border-white/10 bg-surface px-4 py-2">
            <Text className="font-mono text-[10px] uppercase text-dim">
              📷 사진 변경
            </Text>
          </Pressable>
        </View>

        {/* ═══ FORM ═══ */}
        <View className="mt-8 gap-6 px-6">
          {/* 이름 */}
          <View>
            <Text className="font-mono text-[10px] uppercase tracking-wider text-dim">
              // 이름
            </Text>
            <View className="mt-2 border-b border-white/10">
              <TextInput
                value={name}
                onChangeText={setName}
                placeholderTextColor="#71717A"
                className="py-2 font-kr text-base text-fg"
                style={{ outlineStyle: "none" } as any}
              />
            </View>
          </View>

          {/* 이메일 (잠금) */}
          <View>
            <Text className="font-mono text-[10px] uppercase tracking-wider text-dim">
              // 이메일 (잠금)
            </Text>
            <View className="mt-2 flex-row items-center justify-between border-b border-white/5 py-2">
              <Text className="font-kr text-base text-dim">
                junho@lawschool.ac.kr
              </Text>
              <Text className="font-mono text-xs text-dim">🔒</Text>
            </View>
          </View>

          {/* 학교 */}
          <View>
            <Text className="font-mono text-[10px] uppercase tracking-wider text-dim">
              // 학교
            </Text>
            <View className="mt-2 border-b border-white/10">
              <Pressable className="flex-row items-center justify-between py-2">
                <Text className="font-kr text-base text-fg">{school}</Text>
                <Text className="font-mono text-xs text-dim">▾</Text>
              </Pressable>
            </View>
          </View>

          {/* 학년 */}
          <View>
            <Text className="font-mono text-[10px] uppercase tracking-wider text-dim">
              // 학년
            </Text>
            <View className="mt-2 flex-row gap-2">
              {[1, 2, 3].map((y) => (
                <Pressable
                  key={y}
                  onPress={() => setYear(y as 1 | 2 | 3)}
                  className={`flex-1 rounded border px-4 py-3 ${
                    year === y
                      ? "border-violet bg-violet/10"
                      : "border-white/10 bg-surface"
                  }`}
                >
                  <Text
                    className={`text-center font-kr text-sm font-semibold ${
                      year === y ? "text-violet-glow" : "text-fg"
                    }`}
                  >
                    {y}학년
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* 목표 시험 */}
          <View>
            <Text className="font-mono text-[10px] uppercase tracking-wider text-dim">
              // 목표 시험
            </Text>
            <View className="mt-2 border-b border-white/10">
              <View className="flex-row items-center justify-between py-2">
                <Text className="font-kr text-base text-fg">
                  변호사시험 · {examDate}
                </Text>
                <Text className="font-mono text-xs text-dim">📅</Text>
              </View>
            </View>
          </View>

          {/* 학습 목표 */}
          <View>
            <Text className="font-mono text-[10px] uppercase tracking-wider text-dim">
              // 학습 목표
            </Text>
            <View className="mt-2 rounded border border-white/10 bg-surface p-3">
              <TextInput
                value={goal}
                onChangeText={setGoal}
                placeholder="예: 매일 2시간 민법 복습..."
                placeholderTextColor="#71717A"
                multiline
                numberOfLines={3}
                className="min-h-[72px] font-kr text-sm leading-5 text-fg"
                style={{ outlineStyle: "none" } as any}
              />
            </View>
            <Text className="mt-1 font-mono text-[10px] text-dim">
              {goal.length} / 200
            </Text>
          </View>
        </View>

        {/* ═══ DIVIDER ═══ */}
        <View className="mx-6 mt-10 h-px bg-white/5" />

        {/* ═══ DANGER ZONE ═══ */}
        <View className="mt-6 px-6 pb-10">
          <Text className="font-mono text-[10px] uppercase tracking-wider text-dim">
            // 계정 · danger zone
          </Text>
          <View className="mt-3 overflow-hidden rounded border border-white/10 bg-surface">
            <Pressable className="flex-row items-center justify-between p-4">
              <Text className="font-kr text-sm text-fg">비밀번호 변경</Text>
              <Text className="font-mono text-xs text-dim">→</Text>
            </Pressable>
            <View className="h-px bg-white/5" />
            <Pressable className="flex-row items-center justify-between p-4">
              <Text className="font-kr text-sm text-danger">계정 삭제</Text>
              <Text className="font-mono text-xs text-danger">→</Text>
            </Pressable>
          </View>
          <Text className="mt-2 font-mono text-[10px] text-dim">
            // 삭제 시 30일 이내 복구 가능
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
