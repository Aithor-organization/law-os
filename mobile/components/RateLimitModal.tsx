import { Modal, Pressable, Text, View } from "react-native";
import { router } from "expo-router";

import { Button } from "./ui/Button";

interface Props {
  visible: boolean;
  used: number;
  limit: number;
  bonus: number;
  onClose: () => void;
}

// 5회 소진 시 표시. 광고 보너스는 추후 활성화 (현재는 BYOK 또는 내일 대기).
export function RateLimitModal({
  visible,
  used,
  limit,
  bonus,
  onClose,
}: Props) {
  const goByok = () => {
    onClose();
    router.push("/profile/api-keys" as any);
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
