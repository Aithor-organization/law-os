import { PlaceholderScreen } from "@/components/ui/PlaceholderScreen";

export default function PurchaseFailModal() {
  return (
    <PlaceholderScreen
      tag="// purchase result · fail"
      stitchId="242a12fe78ac405b95034ac8455bbc15"
      title="✗ 결제 실패"
      subtitle="결제 수단에 문제가 있습니다"
      description="card_declined · 카드사 승인 거절"
      links={[
        { label: "다시 시도", href: "/modals/paywall", variant: "primary" },
        { label: "다른 카드", href: "/profile/payment-methods" },
        { label: "고객 지원", href: "/profile/support" },
      ]}
    />
  );
}
