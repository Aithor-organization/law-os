import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침 — LAW.OS",
  description:
    "LAW.OS가 수집·이용·보관하는 개인정보 항목, 처리 목적, 보유 기간, 제3자 제공 여부를 안내합니다.",
};

// Apple App Store / Google Play 외부 정책 URL 필수 요건 충족용 정적 페이지.
// 앱 내 mobile/app/profile/privacy.tsx와 내용 일치 유지 — 변경 시 양쪽 동기화.
// 마지막 업데이트: 2026-05-01

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-zinc-100">
      <h1 className="font-bold text-3xl tracking-tight">개인정보처리방침</h1>
      <p className="mt-2 text-sm text-zinc-400">시행일: 2026-05-01</p>

      <Section title="1. 처리하는 개인정보 항목">
        <ul className="list-disc pl-6 space-y-1">
          <li>회원가입: 이메일, 비밀번호(해시), 이름</li>
          <li>온보딩: 학년/구분, 학습 목표, 관심 과목 (선택)</li>
          <li>학습 기록: 채팅 메시지, 북마크, 노트, 학습 통계</li>
          <li>기기 정보: OS 버전, 앱 버전, 푸시 알림 토큰 (선택)</li>
          <li>오류 추적: Sentry — 익명화된 스택 트레이스, 디바이스 모델 (식별 정보 없음)</li>
          <li>BYOK 키 사용 시: 사용자가 입력한 외부 LLM API 키는{" "}
            <strong>디바이스 키체인에만 저장</strong>되며 LAW.OS 서버에 전송되지 않습니다.
            (단, /chat 호출 시에만 백엔드를 경유해 해당 provider로 전달)</li>
        </ul>
      </Section>

      <Section title="2. 처리 목적">
        <ul className="list-disc pl-6 space-y-1">
          <li>회원 인증 및 본인 확인</li>
          <li>맞춤형 학습 콘텐츠 제공 (사용자 학년/목표 기반)</li>
          <li>학습 진도 추적, 북마크/노트 동기화</li>
          <li>서비스 안정성 향상 (오류 추적, 사용 통계 — 익명화)</li>
          <li>법령에 따른 의무 이행 (분쟁 해결, 민원 처리)</li>
        </ul>
      </Section>

      <Section title="3. 보유 및 이용 기간">
        <ul className="list-disc pl-6 space-y-1">
          <li>회원 정보: 회원 탈퇴 시까지 (탈퇴 후 30일간 비활성화 → 영구 삭제)</li>
          <li>학습 기록: 회원 탈퇴 즉시 삭제 (백업본 60일 후 폐기)</li>
          <li>오류 로그: Sentry 보관 정책에 따라 90일</li>
          <li>법령에 따른 보관 의무: 「전자상거래법」 5년 (계약·청약철회 기록), 「국세기본법」 5년</li>
        </ul>
      </Section>

      <Section title="4. 제3자 제공 / 처리 위탁">
        <p className="mb-2">LAW.OS는 다음 외부 서비스에 데이터 처리를 위탁합니다:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Supabase Inc. (미국)</strong> — 데이터베이스 호스팅, 인증</li>
          <li><strong>Railway (미국)</strong> — 백엔드 API 호스팅</li>
          <li><strong>Google LLC (미국)</strong> — Gemini API (질의 콘텐츠), AdMob (선택적 보상형 광고)</li>
          <li><strong>Anthropic / OpenAI / OpenRouter</strong> — BYOK 사용 시에만, 사용자 본인의 키로 직접 호출</li>
          <li><strong>Sentry (미국)</strong> — 오류 추적 (개인 식별 정보 제외)</li>
          <li><strong>Apple / Google</strong> — 푸시 알림 전송 토큰 라우팅</li>
        </ul>
        <p className="mt-2 text-sm text-zinc-400">
          모든 위탁 업체와 표준 데이터 처리 계약(DPA) 또는 공급사 약관에 따라 처리됩니다.
        </p>
      </Section>

      <Section title="5. 사용자의 권리">
        <ul className="list-disc pl-6 space-y-1">
          <li>개인정보 조회/정정/삭제 요청 (앱 내 프로필 → 계정 설정 또는 이메일 문의)</li>
          <li>처리 정지 요청 (회원 탈퇴를 통해 행사 가능)</li>
          <li>데이터 이동권 (CSV 형식 학습 기록 내보내기 — 출시 후 제공 예정)</li>
        </ul>
      </Section>

      <Section title="6. 만 14세 미만 아동">
        <p>
          LAW.OS는 법학 전문 학습 도구로 <strong>만 14세 이상</strong>을 대상으로 합니다.
          만 14세 미만의 회원가입은 받지 않으며, 발견 시 즉시 계정을 삭제합니다.
        </p>
      </Section>

      <Section title="7. 광고 식별자">
        <p>
          AdMob 통합 시 iOS App Tracking Transparency(ATT) 권한을 요청합니다.
          사용자는 거부할 수 있으며, 거부해도 광고는 계속 표시됩니다 (개인화만 비활성화).
        </p>
      </Section>

      <Section title="8. 보안 조치">
        <ul className="list-disc pl-6 space-y-1">
          <li>전송 시: TLS 1.2+ 강제 (Railway/Supabase HTTPS)</li>
          <li>저장 시: 비밀번호 bcrypt 해시, BYOK 키는 OS 키체인 암호화</li>
          <li>접근 통제: Supabase Row Level Security (사용자 본인 데이터만 접근)</li>
        </ul>
      </Section>

      <Section title="9. 개인정보 보호 책임자 / 문의">
        <ul className="list-disc pl-6 space-y-1">
          <li>이름: aithor 운영자</li>
          <li>이메일: <a href="mailto:contact@lawos.kr" className="underline">contact@lawos.kr</a></li>
        </ul>
      </Section>

      <Section title="10. 정책 변경">
        <p>
          정책이 변경되는 경우, 시행 7일 전 앱 내 공지 및 본 페이지를 통해 안내합니다.
          중대한 변경 시 푸시 알림으로 별도 고지합니다.
        </p>
      </Section>

      <p className="mt-12 text-xs text-zinc-500">
        © 2026 aithor. 본 정책은 「개인정보 보호법」 및 PIPA에 근거합니다.
      </p>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="font-semibold text-xl tracking-tight">{title}</h2>
      <div className="mt-3 text-sm leading-7 text-zinc-300">{children}</div>
    </section>
  );
}
