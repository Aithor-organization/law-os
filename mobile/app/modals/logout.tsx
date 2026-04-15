import { PlaceholderScreen } from "@/components/ui/PlaceholderScreen";

export default function LogoutModal() {
  return (
    <PlaceholderScreen
      tag="// logout confirm"
      stitchId="4fcf14fc1eba4c92b1e6d9a0f519d1cd"
      title="로그아웃 하시겠습니까?"
      subtitle="다시 로그인하려면 이메일과 비밀번호가 필요합니다"
      description="Stitch: 4fcf14fc..."
      links={[
        { label: "로그아웃", href: "/(auth)/login", variant: "primary" },
        { label: "취소", href: "/(tabs)/profile" },
      ]}
    />
  );
}
