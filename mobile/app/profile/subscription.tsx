import { PlaceholderScreen } from "@/components/ui/PlaceholderScreen";

export default function SubscriptionScreen() {
  return (
    <PlaceholderScreen
      tag="// subscription"
      stitchId="ab817bd31d7446be943259cef6d872ef"
      title="구독 관리"
      subtitle="Pro Monthly · 다음 결제 2026-02-15"
      description="플랜 비교, 결제 수단, 학생 인증. Stitch: ab817bd3..."
      links={[
        { label: "플랜 업그레이드", href: "/modals/paywall", variant: "primary" },
        { label: "구매 복원", href: "/profile/restore" },
        { label: "결제 내역", href: "/profile/receipts" },
        { label: "학생 인증", href: "/profile/student-verify" },
        { label: "구독 해지", href: "/profile/cancel" },
      ]}
    />
  );
}
