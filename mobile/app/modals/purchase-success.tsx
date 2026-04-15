import { PlaceholderScreen } from "@/components/ui/PlaceholderScreen";

export default function PurchaseSuccessModal() {
  return (
    <PlaceholderScreen
      tag="// purchase result · success"
      stitchId="242a12fe78ac405b95034ac8455bbc15"
      title="✓ 결제 완료"
      subtitle="Pro Monthly 구독이 활성화되었습니다"
      description="Stitch: 242a12fe... · 다음 결제일/플랜/영수증"
      links={[
        { label: "계속하기", href: "/(tabs)", variant: "primary" },
        { label: "영수증 보기", href: "/profile/receipts" },
      ]}
    />
  );
}
