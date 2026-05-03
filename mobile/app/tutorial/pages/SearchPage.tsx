import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import Animated, { FadeIn, FadeInUp, SlideInRight } from "react-native-reanimated";
import { Icon, ICON_COLOR } from "@/components/ui/Icon";

const QUERY = "민법 제1조";

// 페이지 1: 검색 → AI 답변 미니 시연
// 검색바에 글자가 한 자씩 타이핑되고, 완료 시 답변 카드가 슬라이드인.
export function SearchPage({ active }: { active: boolean }) {
  const [typed, setTyped] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    if (!active) {
      setTyped("");
      setShowAnswer(false);
      return;
    }
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setTyped(QUERY.slice(0, i));
      if (i >= QUERY.length) {
        clearInterval(interval);
        setTimeout(() => setShowAnswer(true), 400);
      }
    }, 90);
    return () => clearInterval(interval);
  }, [active]);

  return (
    <View className="flex-1 px-6 pt-12">
      <Animated.View entering={FadeInUp.duration(400)}>
        <Text className="font-mono text-[10px] uppercase tracking-wider text-cyan">
          // 01 · search
        </Text>
        <Text className="mt-2 font-kr text-3xl font-bold tracking-tightest text-fg">
          질문하면{"\n"}답이 옵니다
        </Text>
        <Text className="mt-3 font-kr text-base leading-6 text-dim">
          민법·형법·헌법 전체 조문과 판례에 대해 AI 튜터가 출처와 함께
          즉시 답변합니다.
        </Text>
      </Animated.View>

      {/* Mini search bar demo */}
      <View className="mt-12 rounded-[6px] border border-cyan/30 bg-surface-high px-4 py-3">
        <View className="flex-row items-center gap-2">
          <Icon name="search" size={18} color={ICON_COLOR.cyan} />
          <Text className="flex-1 font-kr text-base text-fg">
            {typed}
            <Text className="text-cyan">|</Text>
          </Text>
        </View>
      </View>

      {/* Mini answer card */}
      {showAnswer ? (
        <Animated.View
          entering={SlideInRight.duration(400)}
          className="mt-4 rounded-[6px] border border-violet/30 bg-violet/5 p-4"
        >
          <Text className="font-mono text-[10px] uppercase text-violet-glow">
            // ai answer
          </Text>
          <Text className="mt-2 font-kr text-sm leading-5 text-fg">
            민법 제1조는 법원의 적용순위를 규정합니다. 법률 → 관습법 →
            조리의 순서로 적용됩니다.
          </Text>
          <View className="mt-3 flex-row gap-1">
            <View className="rounded bg-cyan/20 px-2 py-0.5">
              <Text className="font-mono text-[10px] text-cyan">[1]</Text>
            </View>
            <View className="rounded bg-cyan/20 px-2 py-0.5">
              <Text className="font-mono text-[10px] text-cyan">[2]</Text>
            </View>
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}
