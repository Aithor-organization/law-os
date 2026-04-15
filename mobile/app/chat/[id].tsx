import { PlaceholderScreen } from "@/components/ui/PlaceholderScreen";
import { useLocalSearchParams } from "expo-router";

export default function ActiveChatScreen() {
  const { id } = useLocalSearchParams();
  return (
    <PlaceholderScreen
      tag="// active chat"
      stitchId={`conversation · ${id}`}
      title="Active Chat"
      subtitle="AI 법률 튜터와의 대화"
      description="SSE 스트리밍 응답, 출처 카드, 피드백 버튼이 여기에 표시됩니다. Stitch: 252821e0 (Obsidian Terminal) 참조."
      links={[
        { label: "📎 출처 모달 보기", href: "/modals/citation" },
        { label: "💾 서재에 저장", href: "/modals/save-note" },
        { label: "⚠️ 개인 조언 차단 모달", href: "/modals/blocked" },
        { label: "⚖️ Deep Debate 시작", href: "/chat/debate-demo" },
      ]}
    />
  );
}
