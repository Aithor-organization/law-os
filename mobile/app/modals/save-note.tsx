import { PlaceholderScreen } from "@/components/ui/PlaceholderScreen";

export default function SaveNoteModal() {
  return (
    <PlaceholderScreen
      tag="// save note modal"
      stitchId="a86d47bb29a7442c8d9d1c4a16fd0528"
      title="서재에 저장"
      subtitle="이 답변을 나만의 서재에 저장합니다"
      description="Stitch: a86d47bb... · 과목/주제/태그 선택"
      links={[
        { label: "저장", href: "/note/new", variant: "primary" },
        { label: "저장 안 함", href: "/(tabs)" },
      ]}
    />
  );
}
