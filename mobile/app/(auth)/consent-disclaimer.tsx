import { PlaceholderScreen } from "@/components/ui/PlaceholderScreen";

export default function ConsentDisclaimerScreen() {
  return (
    <PlaceholderScreen
      tag="// step 3/3 · legal disclaimer"
      stitchId="904599456da14f249d1af5741174cfb5"
      title="⚠️ LAW.OS는 학습 도구입니다"
      subtitle="변호사법 대응 고지"
      description="법률 상담이 아닌 학습 도구라는 명시적 동의. Stitch: 904599456..."
      links={[
        { label: "LAW.OS 시작하기", href: "/(tabs)", variant: "primary" },
      ]}
    />
  );
}
