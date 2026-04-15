import { PlaceholderScreen } from "@/components/ui/PlaceholderScreen";

export default function NotFoundScreen() {
  return (
    <PlaceholderScreen
      tag="// 404"
      title="화면을 찾을 수 없습니다"
      subtitle="아직 만들어지지 않은 경로입니다"
      description="이 경로는 P1 또는 P2 우선순위로 나중에 구현될 예정입니다."
      links={[
        { label: "홈으로 돌아가기", href: "/(tabs)", variant: "primary" },
        { label: "Showcase 보기", href: "/showcase" },
      ]}
    />
  );
}
