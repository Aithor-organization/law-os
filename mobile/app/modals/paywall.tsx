import { PlaceholderScreen } from "@/components/ui/PlaceholderScreen";

export default function PaywallModal() {
  return (
    <PlaceholderScreen
      tag="// paywall modal"
      stitchId="d9bf6414f5334c4b98bef3561b8d2224"
      title="Pro로 업그레이드"
      subtitle="오늘의 질문 한도 10/10에 도달했습니다"
      description="Stitch: d9bf6414... · 월간/연간/학생 플랜 비교"
      links={[
        { label: "Pro 시작하기 (월 9,900원)", href: "/modals/purchase-success", variant: "primary" },
        { label: "결제 실패 시나리오", href: "/modals/purchase-fail" },
        { label: "구매 복원", href: "/profile/subscription" },
      ]}
    />
  );
}
