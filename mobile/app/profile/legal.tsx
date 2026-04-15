import { PlaceholderScreen } from "@/components/ui/PlaceholderScreen";

export default function LegalScreen() {
  return (
    <PlaceholderScreen
      tag="// legal"
      stitchId="022f4f3db60e44d1a8b2035c166b0784"
      title="법적 정보"
      subtitle="이용약관 · 개인정보 · 법적 고지"
      description="3개 문서를 탭으로 전환. Stitch: 022f4f3d..."
      links={[
        { label: "이용약관", href: "/profile/legal/tos" },
        { label: "개인정보 처리방침", href: "/profile/legal/privacy" },
        { label: "법적 고지 (변호사법)", href: "/profile/legal/disclaimer" },
        { label: "오픈소스 라이선스", href: "/profile/licenses" },
      ]}
    />
  );
}
