import { Button } from "@/components/ui/Button";
import { TerminalCard } from "@/components/ui/TerminalCard";

// 대기자 폼 — 출시 전까지 이 한 곳으로 수렴
const WAITLIST_URL = "https://tally.so/r/lawos-waitlist";
// TODO: 앱 출시 후 교체
// const APP_STORE = "https://apps.apple.com/app/kr.lawos";
// const GOOGLE_PLAY = "https://play.google.com/store/apps/details?id=kr.lawos";

// iPhone mockup with the actual Stitch Active Chat screenshot — scrollable + auto-scroll loop
function IPhoneMockup() {
  return (
    <div className="relative mx-auto" style={{ width: 300, height: 620 }}>
      {/* Violet glow aura */}
      <div
        className="absolute inset-0 -m-8 rounded-[60px] blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(168,85,247,0.25), transparent 70%)" }}
      />
      {/* Phone frame */}
      <div
        className="relative h-full w-full rounded-[44px] bg-surface p-3"
        style={{ boxShadow: "0 0 0 1px rgba(168,85,247,0.35), 0 0 80px 0 rgba(168,85,247,0.25)" }}
      >
        {/* Notch */}
        <div className="absolute left-1/2 top-3 z-10 h-6 w-24 -translate-x-1/2 rounded-b-2xl bg-black" />

        {/* Screen — scrollable container */}
        <div
          className="phone-screen-scroll relative h-full w-full overflow-y-auto overflow-x-hidden rounded-[34px] bg-black"
          style={{ scrollbarWidth: "none" }}
        >
          {/* Auto-scrolling inner — actual Stitch screenshot */}
          <div className="phone-scroll-inner">
            <img
              src="/screens/active-chat-stitch.png"
              alt="LAW.OS Active Chat — 실제 앱 화면"
              className="block w-full select-none"
              draggable={false}
            />
            {/* Duplicate for seamless loop */}
            <img
              src="/screens/active-chat-stitch.png"
              alt=""
              aria-hidden
              className="block w-full select-none"
              draggable={false}
            />
          </div>
        </div>
      </div>

      {/* Scroll hint badge */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 font-mono text-[10px] text-dim">
        // scroll to see more ↕
      </div>

      {/* Inline keyframes — auto-scroll loop, pauses on hover */}
      <style>{`
        .phone-screen-scroll::-webkit-scrollbar { display: none; }
        .phone-scroll-inner {
          animation: scroll-loop 40s linear infinite;
        }
        .phone-screen-scroll:hover .phone-scroll-inner {
          animation-play-state: paused;
        }
        @keyframes scroll-loop {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
      `}</style>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="relative z-10">
      {/* ═══ NAVIGATION (fixed, glassmorphic) ═══ */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-black/60 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <span className="font-mono text-lg font-bold text-violet-glow">LAW.OS</span>
            <span className="font-mono text-[10px] text-cyan">v1.0.0</span>
          </div>
          <div className="hidden gap-8 font-mono text-xs uppercase text-dim md:flex">
            <a href="#features" className="hover:text-fg">Features</a>
            <a href="#waitlist" className="hover:text-fg">Waitlist</a>
          </div>
          <div className="flex items-center gap-2">
            <a href={WAITLIST_URL} target="_blank" rel="noopener">
              <Button variant="primary">대기자 등록</Button>
            </a>
          </div>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="relative flex min-h-screen items-center pt-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[60%_40%] lg:gap-0">
          <div>
            <div className="font-mono text-xs uppercase tracking-wider text-violet-glow">
              // LAUNCHING SOON · JOIN WAITLIST
            </div>
            <h1 className="mt-6 font-kr text-6xl font-bold leading-[1.05] tracking-tightest text-fg md:text-7xl lg:text-[84px]">
              법률 공부,
              <br />
              주머니 속에서
            </h1>
            <p className="mt-6 font-kr text-2xl font-medium tracking-tight text-dim md:text-3xl">
              AI 법률 튜터를 손 안에
            </p>
            <p className="mt-6 max-w-2xl font-kr text-base leading-relaxed text-dim">
              통학길에서, 카페에서, 도서관에서. 민법·형법·헌법 전체를 출처와
              함께 답변하는 AI 튜터. 출시 준비 중입니다.
            </p>

            {/* Waitlist CTA */}
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <a href={WAITLIST_URL} target="_blank" rel="noopener">
                <Button variant="primary" className="h-14 w-full px-8 sm:w-auto">
                  ✉ 대기자 등록하기
                </Button>
              </a>
            </div>
            <div className="mt-4 font-mono text-xs text-dim">
              // 무료 · 출시 시 알림 · 얼리 액세스 우선 제공
            </div>
          </div>

          {/* Right: Real iPhone mockup */}
          <div className="flex items-center justify-center">
            <IPhoneMockup />
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="features" className="border-t border-white/5 py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16">
            <div className="font-mono text-xs uppercase tracking-wider text-violet-glow">
              // FEATURES
            </div>
            <h2 className="mt-4 font-kr text-5xl font-bold tracking-tight text-fg">
              법학도를 위한 AI 튜터
            </h2>
            <p className="mt-4 font-kr text-lg text-dim">
              Not another chatbot. 법학에 특화된 모바일 학습 앱.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <TerminalCard
              tag="01 · ANYWHERE"
              title="어디서나 즉답"
              footer="// 847k questions this month"
            >
              통학길 · 카페 · 강의실. 탭 한 번으로 민법 전체 조문과 판례를 탐색.
              오프라인 캐시로 지하철에서도 OK.
            </TerminalCard>
            <TerminalCard
              tag="02 · VERIFIED"
              title="검증된 답변"
              footer="// 98.4% citation accuracy"
            >
              GPT-4 Turbo + Claude Opus에 민법/형법/헌법 전체 DB를 RAG로 연결.
              모든 답변에 조문·판례 출처 필수.
            </TerminalCard>
            <TerminalCard
              tag="03 · YOUR LIBRARY"
              title="자동으로 쌓이는 서재"
              footer="// avg 2,847 notes after 3 months"
            >
              질문은 자동 분류 저장. 과목별 · 주제별로 정리되고, Anki와 PDF로 내보내기.
              시험 직전에 꺼내보세요.
            </TerminalCard>
          </div>
        </div>
      </section>

      {/* ═══ SCOPE STRIP (출시 목표 범위) ═══ */}
      <section className="border-t border-white/5 bg-surface-low py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="font-mono text-xs uppercase tracking-wider text-violet-glow">
            // 출시 목표 범위
          </div>
          <h2 className="mt-4 font-kr text-3xl font-bold tracking-tight text-fg">
            처음부터 끝까지 법학도만을 위해
          </h2>
          <div className="mt-12 grid gap-12 md:grid-cols-4">
            {[
              { label: "과목", value: "민·형·헌·상법" },
              { label: "조문", value: "전체 수록" },
              { label: "판례", value: "대법원 주요" },
              { label: "답변", value: "출처 필수" },
            ].map((item) => (
              <div key={item.label}>
                <div className="font-kr text-2xl font-bold text-cyan">{item.value}</div>
                <div className="mt-2 font-mono text-xs uppercase text-dim">// {item.label}</div>
              </div>
            ))}
          </div>
          <div className="mt-8 font-mono text-xs text-dim">
            // 출시 시점에 확정된 수치가 공개됩니다 · 현재는 개발 중
          </div>
        </div>
      </section>

      {/* ═══ BIG WAITLIST CTA ═══ */}
      <section id="waitlist" className="relative overflow-hidden border-t border-white/5 py-40">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: "radial-gradient(ellipse at center, #A855F7 0%, transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <div className="font-mono text-xs uppercase tracking-wider text-violet-glow">
            // COMING SOON
          </div>
          <h2 className="mt-6 font-kr text-6xl font-bold leading-tight tracking-tightest text-fg md:text-7xl lg:text-[96px]">
            가장 먼저
            <br />
            만나보세요
          </h2>
          <p className="mt-6 font-kr text-xl text-dim">
            출시 알림 + 얼리 액세스 기회를 드립니다.
          </p>
          <div className="mt-12 flex flex-col items-center justify-center gap-4">
            <a href={WAITLIST_URL} target="_blank" rel="noopener">
              <Button variant="primary" className="h-16 px-12 text-base">
                ✉ 대기자 등록하기
              </Button>
            </a>
          </div>
          <div className="mt-8 font-mono text-xs text-dim">
            // 이메일 1회만 · 스팸 없음 · 언제든 해지
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-white/5 bg-surface-low py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 md:grid-cols-3">
            <div>
              <div className="font-mono text-lg font-bold text-violet-glow">LAW.OS</div>
              <p className="mt-2 font-kr text-xs text-dim">
                모바일 법률 학습 앱 · 법학도를 위한 AI 튜터
              </p>
              <p className="mt-3 font-mono text-[10px] text-dim">
                // 법률 상담이 아닌 학습 도구입니다
              </p>
            </div>
            <div>
              <div className="font-mono text-xs uppercase tracking-wider text-violet-glow">
                // CONTACT
              </div>
              <ul className="mt-4 space-y-2 font-mono text-xs text-dim">
                <li>hello@lawos.kr</li>
                <li>문의: 대기자 등록 폼</li>
              </ul>
            </div>
            <div>
              <div className="font-mono text-xs uppercase tracking-wider text-violet-glow">
                // STATUS
              </div>
              <ul className="mt-4 space-y-2 font-mono text-xs text-dim">
                <li>출시 준비 중</li>
                <li>iOS + Android</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 font-mono text-[10px] text-dim md:flex-row">
            <div>© 2026 LAW.OS · 출시 준비 중</div>
            <div>v1.0.0 preview</div>
          </div>
        </div>
      </footer>
    </main>
  );
}
