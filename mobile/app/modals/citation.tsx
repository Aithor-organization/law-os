import { PlaceholderScreen } from "@/components/ui/PlaceholderScreen";

export default function CitationModal() {
  return (
    <PlaceholderScreen
      tag="// citation modal"
      stitchId="4c43ef26103f47ceb25d817eb5e3ecf3"
      title="민법 제750조"
      subtitle="불법행위의 내용 · relevance 0.92"
      description="Stitch: 4c43ef26... · 바텀 시트, 조문/판례 탭"
      links={[
        { label: "전체 보기", href: "/statute/civil-750", variant: "primary" },
        { label: "즐겨찾기", href: "/(tabs)/library" },
      ]}
    />
  );
}
