import { PlaceholderScreen } from "@/components/ui/PlaceholderScreen";

export default function BlockedModal() {
  return (
    <PlaceholderScreen
      tag="// personal advice blocked"
      stitchId="c3f65b5f39024964853ec27181e38139"
      title="⚠️ 개인 사건 조언은 제공할 수 없습니다"
      subtitle="LAW.OS는 법학 학습 도구입니다"
      description="Stitch: c3f65b5f... · 변호사법 대응. 대한변협 전화번호 안내"
      links={[
        { label: "일반 질문으로 수정", href: "/(tabs)", variant: "primary" },
        { label: "법적 고지 다시 읽기", href: "/profile/legal/disclaimer" },
      ]}
    />
  );
}
