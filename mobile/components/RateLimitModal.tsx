import { useState } from "react";
import { Alert, Modal, Pressable, Text, View } from "react-native";
import { router } from "expo-router";

import { Button } from "./ui/Button";
import { watchRewardedAdAndGrantBonus } from "@/lib/rewardAd";

interface Props {
  visible: boolean;
  used: number;
  limit: number;
  bonus: number;
  onClose: () => void;
  onBonusGranted?: () => void;
}

// 5회(또는 5+bonus) 소진 시 표시. BYOK 등록 유도 + 광고 시청 (+2회) 옵션.
// 광고 시청은 일일 5회 상한 (백엔드 grant_ad_bonus RPC가 거절).
export function RateLimitModal({
  visible,
  used,
  limit,
  bonus,
  onClose,
  onBonusGranted,
}: Props) {
  const [watchingAd, setWatchingAd] = useState(false);

  const goByok = () => {
    onClose();
    router.push("/profile/api-keys" as any);
  };

  const watchAd = async () => {
    setWatchingAd(true);
    const r = await watchRewardedAdAndGrantBonus();
    setWatchingAd(false);

    if (r.granted) {
      Alert.alert(
        "✅ +2회 추가",
        `오늘 광고 ${r.adViews ?? "?"}회 시청 — 추가 ${r.bonus ?? 0}회 사용 가능`,
      );
      onBonusGranted?.();
      onClose();
      return;
    }
    if (r.reason === "daily_ad_limit") {
      Alert.alert("일일 광고 시청 한도", "오늘은 더 이상 광고로 추가할 수 없습니다 (하루 5회 광고 = 최대 +10회).");
    } else {
      Alert.alert("광고 시청 실패", "잠시 후 다시 시도해주세요.");
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 items-center justify-center bg-black/70 px-6">
        <View className="w-full rounded-[6px] border border-violet/40 bg-surface p-6">
          <Text className="font-mono text-[10px] uppercase tracking-wider text-violet-glow">
            // free quota exhausted
          </Text>
          <Text className="mt-2 font-kr text-2xl font-bold text-fg">
            오늘의 무료 사용량을{"\n"}모두 사용했습니다
          </Text>
          <Text className="mt-3 font-mono text-xs text-dim">
            // 사용: {used} / {limit}회 {bonus > 0 ? `(보너스 +${bonus})` : ""}
          </Text>

          <View className="mt-6 gap-3">
            <Button variant="primary" onPress={goByok}>
              본인 API 키 등록 → 무제한
            </Button>
            <Button variant="ghost" onPress={watchAd} disabled={watchingAd}>
              {watchingAd ? "광고 로드 중..." : "광고 시청하고 +2회"}
            </Button>
            <Pressable onPress={onClose} className="self-center py-2">
              <Text className="font-mono text-[10px] uppercase text-dim">
                // 내일 다시 사용
              </Text>
            </Pressable>
          </View>

          <Text className="mt-4 text-center font-mono text-[10px] text-dim">
            // 자정(KST)에 자동 리셋
          </Text>
        </View>
      </View>
    </Modal>
  );
}
