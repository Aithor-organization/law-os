import { useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import { Button } from "@/components/ui/Button";
import { markTutorialCompleted } from "@/lib/auth";
import { SearchPage } from "./pages/SearchPage";
import { CitationPage } from "./pages/CitationPage";
import { BookmarkPage } from "./pages/BookmarkPage";
import { NotesPage } from "./pages/NotesPage";
import { ByokPage } from "./pages/ByokPage";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// 5-page horizontal pager. 사용자 결정대로 skip 버튼 없음.
// 각 page에 `active` prop을 넘겨서, 화면이 보일 때만 애니메이션이 트리거되게
// 한다 (off-screen에서 미리 돌아가면 첫 진입 시 시연이 사라져 있음).
export default function TutorialScreen() {
  const [page, setPage] = useState(0);
  const [saving, setSaving] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (next !== page) setPage(next);
  };

  const goNext = () => {
    if (page < 4) {
      const targetX = (page + 1) * SCREEN_WIDTH;
      scrollRef.current?.scrollTo({ x: targetX, animated: true });
      setPage(page + 1);
    }
  };

  const finish = async () => {
    setSaving(true);
    const { error } = await markTutorialCompleted();
    setSaving(false);
    if (error) {
      // tutorial_completed 저장 실패는 치명적이지 않음 (다음 진입 시 재시도
      // 가능). 사용자에게 알리되 진행은 허용.
      Alert.alert("저장 실패", `${error.message}\n메인으로 이동합니다.`);
    }
    router.replace("/(tabs)" as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      {/* Progress dots */}
      <View className="flex-row justify-center gap-2 px-6 pt-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <View
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === page ? "w-8 bg-violet" : "w-1.5 bg-white/20"
            }`}
          />
        ))}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        className="flex-1"
      >
        <View style={{ width: SCREEN_WIDTH }}>
          <SearchPage active={page === 0} />
        </View>
        <View style={{ width: SCREEN_WIDTH }}>
          <CitationPage active={page === 1} />
        </View>
        <View style={{ width: SCREEN_WIDTH }}>
          <BookmarkPage active={page === 2} />
        </View>
        <View style={{ width: SCREEN_WIDTH }}>
          <NotesPage active={page === 3} />
        </View>
        <View style={{ width: SCREEN_WIDTH }}>
          <ByokPage active={page === 4} />
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View className="border-t border-white/5 bg-bg px-6 py-4">
        {page < 4 ? (
          <View className="flex-row items-center justify-between">
            <Text className="font-mono text-[10px] uppercase text-dim">
              // {page + 1} / 5
            </Text>
            <Button variant="ghost" onPress={goNext}>
              다음 →
            </Button>
          </View>
        ) : (
          <Button variant="primary" onPress={finish} disabled={saving}>
            {saving ? "저장 중..." : "알겠습니다"}
          </Button>
        )}
      </View>
    </SafeAreaView>
  );
}
