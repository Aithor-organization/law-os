import { PlaceholderScreen } from "@/components/ui/PlaceholderScreen";
import { useLocalSearchParams } from "expo-router";

export default function StatuteDetailScreen() {
  const { id } = useLocalSearchParams();
  return (
    <PlaceholderScreen
      tag="// statute detail"
      stitchId={`statutes/${id}`}
      title="민법 제750조"
      subtitle="불법행위의 내용"
      description="조문 본문, 관련 판례, 즐겨찾기, AI 질문 CTA가 표시됩니다. Stitch: bc5c1098ac194cc9a3dd95688c4bb06a"
      links={[
        { label: "🤖 이 조문에 대해 질문하기", href: "/chat/civil-750", variant: "primary" },
        { label: "📚 관련 판례 보기", href: "/case/2018da12345" },
        { label: "📎 출처 상세 모달", href: "/modals/citation" },
      ]}
    />
  );
}
