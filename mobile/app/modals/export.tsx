import { PlaceholderScreen } from "@/components/ui/PlaceholderScreen";

export default function ExportModal() {
  return (
    <PlaceholderScreen
      tag="// export"
      title="데이터 내보내기"
      subtitle="Anki · PDF · JSON"
      description="서재의 노트를 외부 도구로 내보냅니다."
      links={[
        { label: "Anki (.apkg)", href: "/(tabs)/library", variant: "primary" },
        { label: "PDF (워터마크 포함)", href: "/(tabs)/library" },
        { label: "JSON (raw)", href: "/(tabs)/library" },
      ]}
    />
  );
}
