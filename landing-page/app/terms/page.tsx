import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "서비스 이용약관 — LAW.OS",
  description: "LAW.OS 서비스 이용 약관 — 학습 도구의 면책, 사용자 책임, 환불, 분쟁 해결 등.",
};

// App Store / Google Play "EULA" 또는 "Terms of Service" 외부 URL 요건 충족용.
// 핵심: 법률 상담이 아닌 학습 도구임을 명시 (Apple Review Guideline 5.6 / 1.4.1).
// 마지막 업데이트: 2026-05-01

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-zinc-100">
      <h1 className="font-bold text-3xl tracking-tight">서비스 이용약관</h1>
      <p className="mt-2 text-sm text-zinc-400">시행일: 2026-05-01</p>

      <Section title="제1조 (목적)">
        <p>
          본 약관은 aithor(이하 "회사")가 제공하는 LAW.OS 모바일 앱
          (이하 "서비스")의 이용 조건과 절차를 규정합니다.
        </p>
      </Section>

      <Section title="제2조 (서비스의 성격 — 중요)">
        <p className="rounded border border-amber-500/40 bg-amber-500/10 p-4">
          <strong>LAW.OS는 법률 학습 도구입니다.</strong>
          <br />
          본 서비스가 제공하는 답변, 인용, 판례 정보는{" "}
          <strong>법률 상담을 대체하지 않으며</strong>, 변호사·법률사무소의
          전문 자문을 갈음하지 않습니다.
        </p>
        <ul className="mt-3 list-disc pl-6 space-y-1">
          <li>AI 답변은 학습 보조용입니다. 실제 법적 결정은 자격을 갖춘 전문가와 상담하세요.</li>
          <li>서비스는 변호사법 제109조의 "법률사무 취급" 행위를 하지 않습니다.</li>
          <li>회사는 서비스 답변에 기반한 사용자의 결정에 대한 책임을 지지 않습니다.</li>
        </ul>
      </Section>

      <Section title="제3조 (이용 자격)">
        <ul className="list-disc pl-6 space-y-1">
          <li>만 14세 이상인 자</li>
          <li>본 약관 및 개인정보처리방침에 동의한 자</li>
          <li>회원가입 시 본인의 정보를 정확히 제공할 것</li>
        </ul>
      </Section>

      <Section title="제4조 (서비스 제공 및 이용 제한)">
        <ul className="list-disc pl-6 space-y-1">
          <li>기본 사용량: 매일 5회 AI 채팅 (자정 KST 리셋)</li>
          <li>광고 시청 시 일일 추가 +2회 × 최대 5회 (총 +10회)</li>
          <li>본인의 LLM API 키 등록(BYOK) 시 횟수 제한 없음</li>
          <li>BYOK 사용 시 외부 provider(OpenAI, Anthropic 등)의 요금이 사용자에게 직접 청구됩니다</li>
          <li>회사는 시스템 점검, 정책 변경 등을 위해 서비스를 일시 중단할 수 있습니다</li>
        </ul>
      </Section>

      <Section title="제5조 (사용자의 의무)">
        <ul className="list-disc pl-6 space-y-1">
          <li>법령 및 본 약관 위반 행위 금지</li>
          <li>타인의 권리 침해, 명예훼손, 음란/폭력적 콘텐츠 입력 금지</li>
          <li>리버스 엔지니어링, 자동화 봇, 비정상 트래픽 발생 금지</li>
          <li>서비스를 법률 상담 대체용으로 사용 금지</li>
        </ul>
      </Section>

      <Section title="제6조 (지적재산권)">
        <ul className="list-disc pl-6 space-y-1">
          <li>서비스의 모든 콘텐츠(UI, 코드, 디자인)는 회사에 귀속됩니다</li>
          <li>법령·판례 원문은 공공저작물로 자유 이용 가능합니다 (출처: 국가법령정보센터)</li>
          <li>사용자가 입력한 내용은 사용자 본인에게 귀속되며, 회사는 서비스 운영 목적으로만 처리합니다</li>
        </ul>
      </Section>

      <Section title="제7조 (요금 및 환불)">
        <ul className="list-disc pl-6 space-y-1">
          <li>현재 LAW.OS는 무료 서비스입니다 (광고 + BYOK 모델)</li>
          <li>유료 구독 도입 시 본 조항이 별도 고지와 함께 개정됩니다</li>
          <li>BYOK 사용으로 발생하는 외부 provider 요금에 대해 회사는 환불 책임이 없습니다</li>
        </ul>
      </Section>

      <Section title="제8조 (책임 제한)">
        <ul className="list-disc pl-6 space-y-1">
          <li>천재지변, 회사 통제 외 사유로 발생한 서비스 중단에 대해 책임지지 않습니다</li>
          <li>사용자 귀책 사유(잘못된 정보 입력, 약관 위반 등)로 인한 손해는 사용자가 부담합니다</li>
          <li>AI 답변의 정확성은 보장되지 않으며, 사용자가 검증할 책임이 있습니다</li>
        </ul>
      </Section>

      <Section title="제9조 (계약 해지)">
        <ul className="list-disc pl-6 space-y-1">
          <li>사용자는 언제든지 앱 내 "계정 삭제"를 통해 해지할 수 있습니다</li>
          <li>해지 후 30일간 비활성화 → 영구 삭제 (PIPA §21)</li>
          <li>회사는 약관 위반 시 사전 통지 후 이용을 정지할 수 있습니다</li>
        </ul>
      </Section>

      <Section title="제10조 (분쟁 해결)">
        <ul className="list-disc pl-6 space-y-1">
          <li>본 약관은 대한민국 법령을 준거법으로 합니다</li>
          <li>서비스 이용으로 발생한 분쟁은 회사 본점 소재지 관할 법원을 합의 관할로 합니다</li>
        </ul>
      </Section>

      <Section title="제11조 (약관 변경)">
        <p>
          약관 변경 시 시행 7일 전 앱 내 공지로 안내합니다. 변경 후 계속
          서비스를 이용하면 변경에 동의한 것으로 간주합니다.
        </p>
      </Section>

      <Section title="문의">
        <p>
          이메일: <a href="mailto:contact@lawos.kr" className="underline">contact@lawos.kr</a>
        </p>
      </Section>

      <p className="mt-12 text-xs text-zinc-500">© 2026 aithor</p>
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
