import { PlaceholderScreen } from "@/components/ui/PlaceholderScreen";

export default function NewChatScreen() {
  return (
    <PlaceholderScreen
      tag="// new chat"
      title="New Chat"
      subtitle="새 대화를 시작하세요"
      description="빈 상태에서 첫 질문을 입력하는 화면. 제안된 질문 칩, 모드 토글(일반/Deep Debate)이 표시됩니다."
      links={[
        { label: "일반 모드 시작", href: "/chat/new-conv", variant: "primary" },
        { label: "Deep Debate 시작", href: "/chat/debate-demo" },
      ]}
    />
  );
}
