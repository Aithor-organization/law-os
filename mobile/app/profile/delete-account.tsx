import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import { deleteAccount } from "@/lib/auth";

/**
 * Account deletion flow — PIPA §21 compliance.
 *
 * Requires the user to type a confirmation phrase before the destructive
 * action fires, following iOS/Android destructive action best practices
 * and reducing accidental deletion. The RPC (`delete_my_account`) performs
 * a transactional cascade across all user data plus the auth.users row.
 */

const CONFIRMATION_PHRASE = "삭제합니다";

export default function DeleteAccountScreen() {
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);

  const canSubmit = confirmation.trim() === CONFIRMATION_PHRASE && !busy;

  const handleDelete = async () => {
    if (!canSubmit) return;

    Alert.alert(
      "정말 계정을 삭제하시겠습니까?",
      "모든 대화, 노트, 북마크, 학습 기록이 영구 삭제되며 되돌릴 수 없습니다.",
      [
        { text: "취소", style: "cancel" },
        {
          text: "영구 삭제",
          style: "destructive",
          onPress: async () => {
            setBusy(true);
            const { error } = await deleteAccount();
            setBusy(false);
            if (error) {
              Alert.alert(
                "삭제 실패",
                `${error.message}\n\n잠시 후 다시 시도하거나 문의처로 연락주세요.`,
              );
              return;
            }
            // Session already cleared by deleteAccount. Route back to auth.
            router.replace("/(auth)/login" as any);
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <View className="flex-row items-center gap-4 px-6 pt-4">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text className="font-mono text-[10px] uppercase text-dim">← back</Text>
        </Pressable>
        <Text className="font-mono text-[10px] uppercase text-danger">
          // delete account
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="mt-8 px-6">
          <Text className="font-kr text-3xl font-bold leading-tight tracking-tightest text-fg">
            계정 삭제
          </Text>
          <Text className="mt-3 font-kr text-sm leading-6 text-dim">
            아래 작업은 되돌릴 수 없습니다. 신중히 확인해주세요.
          </Text>
        </View>

        <View className="mt-6 gap-3 px-6">
          <View className="rounded-[6px] border border-danger/30 bg-danger/5 p-5">
            <Text className="font-mono text-[10px] uppercase tracking-wider text-danger">
              // 영구 삭제되는 항목
            </Text>
            <View className="mt-3 gap-2">
              {[
                "모든 대화 내역 및 AI 답변",
                "저장한 노트 · 즐겨찾기",
                "조문 · 판례 북마크",
                "학습 스트릭 · 활동 통계",
                "알림 설정 · 구독한 법령 목록",
                "프로필 정보 · 계정 자체",
              ].map((item) => (
                <View key={item} className="flex-row items-center gap-2">
                  <Text className="font-mono text-xs text-danger">×</Text>
                  <Text className="flex-1 font-kr text-sm text-fg" numberOfLines={1}>
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View className="rounded-[6px] border border-white/10 bg-surface p-5">
            <Text className="font-mono text-[10px] uppercase tracking-wider text-cyan">
              // PIPA §21 compliance
            </Text>
            <Text className="mt-2 font-kr text-xs leading-5 text-dim">
              개인정보 보호법 제21조(개인정보의 파기)에 따라 삭제 요청 즉시
              모든 개인정보가 파기됩니다. 법령에 따라 보존이 필요한 항목이
              있는 경우 해당 기간 내 익명화하여 분리 보관됩니다.
            </Text>
          </View>

          <View className="mt-2">
            <Text className="mb-2 font-mono text-[10px] uppercase tracking-wider text-dim">
              // 확인 문구 입력
            </Text>
            <Text className="mb-3 font-kr text-sm text-fg">
              계속하려면 아래 칸에 <Text className="font-mono text-violet-glow">{CONFIRMATION_PHRASE}</Text>를
              정확히 입력해주세요.
            </Text>
            <View className="rounded border border-white/10 bg-surface">
              <TextInput
                value={confirmation}
                onChangeText={setConfirmation}
                placeholder={CONFIRMATION_PHRASE}
                placeholderTextColor="#71717A"
                editable={!busy}
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel="삭제 확인 문구"
                className="h-12 px-3 font-kr text-sm text-fg"
                style={{ outlineStyle: "none" } as any}
              />
            </View>
          </View>

          <Pressable
            onPress={handleDelete}
            disabled={!canSubmit}
            accessibilityRole="button"
            accessibilityLabel="계정 영구 삭제"
            accessibilityState={{ disabled: !canSubmit }}
            className={`mt-4 h-12 items-center justify-center rounded border ${
              canSubmit
                ? "border-danger bg-danger/10"
                : "border-white/10 bg-surface-high"
            }`}
          >
            <Text
              className={`font-mono text-xs uppercase tracking-wider ${
                canSubmit ? "text-danger" : "text-dim"
              }`}
            >
              {busy ? "삭제 중..." : "계정 영구 삭제"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            disabled={busy}
            className="mt-2 items-center py-3"
          >
            <Text className="font-mono text-xs text-dim">취소하고 돌아가기</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
