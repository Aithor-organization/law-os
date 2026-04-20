import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import {
  getProfile,
  requestAccountDeletion,
  sendPasswordReset,
  updateProfile,
  type Profile,
} from "@/lib/auth";

const SCHOOLS = [
  "서울대학교 로스쿨",
  "고려대학교 로스쿨",
  "연세대학교 로스쿨",
  "성균관대학교 로스쿨",
  "한양대학교 로스쿨",
  "이화여자대학교 로스쿨",
  "기타",
];

export default function EditProfileScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [school, setSchool] = useState<string>("");
  const [year, setYear] = useState<number | null>(null);
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSchools, setShowSchools] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await getProfile();
      if (cancelled) return;
      setLoading(false);
      if (error) {
        Alert.alert("불러오기 실패", error.message);
        return;
      }
      if (data) {
        setProfile(data);
        setName(data.name ?? "");
        setSchool(data.school ?? "");
        setYear(data.school_year);
        setGoal(data.study_goal ?? "");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    const { error } = await updateProfile({
      name: name.trim(),
      school: school || null,
      school_year: year,
      study_goal: goal.trim() || null,
    });
    setSaving(false);
    if (error) {
      Alert.alert("저장 실패", error.message);
      return;
    }
    router.back();
  }, [name, school, year, goal, saving]);

  const handleChangePassword = useCallback(async () => {
    if (!profile?.email) return;
    Alert.alert(
      "비밀번호 변경",
      `${profile.email}로 재설정 링크를 보냅니다. 계속할까요?`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "보내기",
          onPress: async () => {
            const { error } = await sendPasswordReset(profile.email);
            Alert.alert(
              error ? "전송 실패" : "이메일을 확인하세요",
              error?.message ?? "재설정 링크를 받은 이메일에서 확인하세요.",
            );
          },
        },
      ],
    );
  }, [profile?.email]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      "계정 삭제",
      "계정이 30일간 비활성화되고 이후 영구 삭제됩니다. 계속할까요?",
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            const { error } = await requestAccountDeletion();
            if (error) {
              Alert.alert("삭제 실패", error.message);
              return;
            }
            router.replace("/(auth)/login" as any);
          },
        },
      ],
    );
  }, []);

  const initial = (name || profile?.email || "?").trim().charAt(0);

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <View className="flex-row items-center justify-between border-b border-white/5 px-4 py-3">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="닫기"
          className="h-10 w-10 items-center justify-center"
        >
          <Text className="font-mono text-xs text-dim">✕</Text>
        </Pressable>
        <Text className="font-kr text-base font-semibold text-fg">프로필 편집</Text>
        <Pressable
          onPress={handleSave}
          disabled={saving || loading}
          accessibilityRole="button"
          accessibilityLabel="저장"
          className="h-10 items-center justify-center px-3"
        >
          <Text
            className={`font-mono text-xs ${
              saving || loading ? "text-dim" : "text-violet-glow"
            }`}
          >
            {saving ? "저장 중..." : "저장"}
          </Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
        {loading ? (
          <View className="items-center py-16">
            <ActivityIndicator size="small" color="#A855F7" />
          </View>
        ) : (
          <>
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
                  {initial}
                </Text>
              </View>
            </View>

            <View className="mt-8 gap-6 px-6">
              <View>
                <Text className="font-mono text-[10px] uppercase tracking-wider text-dim">
                  // 이름
                </Text>
                <View className="mt-2 border-b border-white/10">
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="홍길동"
                    placeholderTextColor="#71717A"
                    accessibilityLabel="이름"
                    className="py-2 font-kr text-base text-fg"
                    style={{ outlineStyle: "none" } as any}
                  />
                </View>
              </View>

              <View>
                <Text className="font-mono text-[10px] uppercase tracking-wider text-dim">
                  // 이메일 (잠금)
                </Text>
                <View className="mt-2 flex-row items-center justify-between border-b border-white/5 py-2">
                  <Text className="font-kr text-base text-dim">
                    {profile?.email ?? "-"}
                  </Text>
                  <Text className="font-mono text-xs text-dim">🔒</Text>
                </View>
              </View>

              <View>
                <Text className="font-mono text-[10px] uppercase tracking-wider text-dim">
                  // 학교
                </Text>
                <Pressable
                  onPress={() => setShowSchools((s) => !s)}
                  accessibilityRole="button"
                  accessibilityLabel="학교 선택"
                  className="mt-2 border-b border-white/10"
                >
                  <View className="flex-row items-center justify-between py-2">
                    <Text
                      className={`font-kr text-base ${
                        school ? "text-fg" : "text-dim"
                      }`}
                    >
                      {school || "학교를 선택하세요"}
                    </Text>
                    <Text className="font-mono text-xs text-dim">
                      {showSchools ? "▴" : "▾"}
                    </Text>
                  </View>
                </Pressable>
                {showSchools && (
                  <View className="mt-2 rounded border border-white/10 bg-surface">
                    {SCHOOLS.map((s) => (
                      <Pressable
                        key={s}
                        onPress={() => {
                          setSchool(s);
                          setShowSchools(false);
                        }}
                        className="border-b border-white/5 px-3 py-3"
                      >
                        <Text className="font-kr text-sm text-fg">{s}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>

              <View>
                <Text className="font-mono text-[10px] uppercase tracking-wider text-dim">
                  // 학년 (로스쿨)
                </Text>
                <View className="mt-2 flex-row gap-2">
                  {[1, 2, 3].map((y) => (
                    <Pressable
                      key={y}
                      onPress={() => setYear((curr) => (curr === y ? null : y))}
                      accessibilityRole="button"
                      accessibilityLabel={`${y}학년`}
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
                    maxLength={200}
                    accessibilityLabel="학습 목표"
                    className="min-h-[72px] font-kr text-sm leading-5 text-fg"
                    style={{ outlineStyle: "none" } as any}
                  />
                </View>
                <Text className="mt-1 font-mono text-[10px] text-dim">
                  {goal.length} / 200
                </Text>
              </View>
            </View>

            <View className="mx-6 mt-10 h-px bg-white/5" />

            <View className="mt-6 px-6 pb-10">
              <Text className="font-mono text-[10px] uppercase tracking-wider text-dim">
                // 계정 · danger zone
              </Text>
              <View className="mt-3 overflow-hidden rounded border border-white/10 bg-surface">
                <Pressable
                  onPress={handleChangePassword}
                  accessibilityRole="button"
                  accessibilityLabel="비밀번호 변경"
                  className="flex-row items-center justify-between p-4"
                >
                  <Text className="font-kr text-sm text-fg">비밀번호 변경</Text>
                  <Text className="font-mono text-xs text-dim">→</Text>
                </Pressable>
                <View className="h-px bg-white/5" />
                <Pressable
                  onPress={handleDeleteAccount}
                  accessibilityRole="button"
                  accessibilityLabel="계정 삭제"
                  className="flex-row items-center justify-between p-4"
                >
                  <Text className="font-kr text-sm text-danger">계정 삭제</Text>
                  <Text className="font-mono text-xs text-danger">→</Text>
                </Pressable>
              </View>
              <Text className="mt-2 font-mono text-[10px] text-dim">
                // 삭제 후 30일간 복구 가능
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
