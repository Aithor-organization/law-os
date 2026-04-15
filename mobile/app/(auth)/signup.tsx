import { PlaceholderScreen } from "@/components/ui/PlaceholderScreen";

export default function SignupScreen() {
  return (
    <PlaceholderScreen
      tag="// sign up"
      stitchId="31fb95800e9b401f9319963845a92a87"
      title="가입하기"
      subtitle="LAW.OS에 처음 오셨나요?"
      description="이메일/비밀번호 + 이름 입력 → 이메일 인증 → 약관 동의 3단계 → 온보딩. Stitch: 31fb958..."
      links={[
        { label: "이메일 인증으로", href: "/(auth)/email-verify", variant: "primary" },
        { label: "이용약관 동의 (1/3)", href: "/(auth)/consent-tos" },
        { label: "개인정보 동의 (2/3)", href: "/(auth)/consent-privacy" },
        { label: "법적 고지 동의 (3/3)", href: "/(auth)/consent-disclaimer" },
        { label: "온보딩 1 — 학년/목표", href: "/(auth)/onboarding-1" },
      ]}
    />
  );
}
