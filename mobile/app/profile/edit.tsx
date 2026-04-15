import { PlaceholderScreen } from "@/components/ui/PlaceholderScreen";

export default function EditProfileScreen() {
  return (
    <PlaceholderScreen
      tag="// edit profile"
      stitchId="a7820c8ebc0e485b8b488685129e9703"
      title="프로필 편집"
      subtitle="이름, 학교, 학년, 학습 목표"
      description="Stitch: a7820c8e... · 이름/이메일(잠금)/학교/학년/목표 시험/학습 목표 필드"
      links={[
        { label: "저장", href: "/(tabs)/profile", variant: "primary" },
        { label: "비밀번호 변경", href: "/profile/change-password" },
        { label: "계정 삭제 (1단계)", href: "/profile/delete-1" },
      ]}
    />
  );
}
