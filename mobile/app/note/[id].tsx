import { PlaceholderScreen } from "@/components/ui/PlaceholderScreen";
import { useLocalSearchParams } from "expo-router";

export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams();
  return (
    <PlaceholderScreen
      tag="// note"
      stitchId={`note · ${id}`}
      title="Note Detail"
      subtitle="민법 · 채권 · 불법행위"
      description="저장된 Q&A, 출처 리스트, 태그, 복습 일정. Stitch: 7a071be618304efcbb9c127af58e8e44"
      links={[
        { label: "🔁 복습 시작", href: "/review/1", variant: "primary" },
        { label: "📎 출처 보기", href: "/modals/citation" },
      ]}
    />
  );
}
