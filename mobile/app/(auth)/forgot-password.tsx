import { PlaceholderScreen } from "@/components/ui/PlaceholderScreen";

export default function ForgotPasswordScreen() {
  return (
    <PlaceholderScreen
      tag="// forgot password"
      stitchId="c0779576f7564504b49cd9de57d98655"
      title="비밀번호 찾기"
      subtitle="가입하신 이메일로 재설정 링크를 보내드립니다"
      description="이메일 입력 → 재설정 링크 발송. Stitch: c0779576..."
      links={[{ label: "재설정 링크 보내기", href: "/(auth)/login", variant: "primary" }]}
    />
  );
}
