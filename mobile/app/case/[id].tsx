import { PlaceholderScreen } from "@/components/ui/PlaceholderScreen";
import { useLocalSearchParams } from "expo-router";

export default function CaseDetailScreen() {
  const { id } = useLocalSearchParams();
  return (
    <PlaceholderScreen
      tag="// case detail"
      stitchId={`cases/${id}`}
      title="대법원 2018다12345"
      subtitle="판례 상세"
      description="판시사항, 판결요지, 전문, 관련 조문 링크. Stitch: 48da99c5072648ce820955f35ccf31ee"
      links={[
        { label: "🤖 이 판례에 대해 질문하기", href: "/chat/case-chat", variant: "primary" },
        { label: "⚖️ 관련 조문 보기", href: "/statute/civil-750" },
      ]}
    />
  );
}
