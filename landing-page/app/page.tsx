import { TerminalCard } from "@/components/ui/TerminalCard";

// Screenshots used in the in-app gallery section. Add/remove entries to
// rotate which screens appear on the marketing page. Files live in
// landing-page/public/screens/.
const APP_SCREENSHOTS: { src: string; alt: string; caption: string; tag: string }[] = [
  {
    src: "/screens/active-chat-stitch.png",
    alt: "LAW.OS — AI 채팅 화면",
    caption: "AI 채팅 · 출처 인용 필수",
    tag: "01 · CHAT",
  },
  {
    src: "/screens/02-search.png",
    alt: "LAW.OS — 조문/판례 검색",
    caption: "조문·판례 통합 검색",
    tag: "02 · SEARCH",
  },
  {
    src: "/screens/05-case-detail.png",
    alt: "LAW.OS — 판례 상세",
    caption: "판례 상세 · 관련 조문 자동 연결",
    tag: "03 · CASE",
  },
  {
    src: "/screens/03-library.png",
    alt: "LAW.OS — 자동 서재",
    caption: "자동으로 쌓이는 학습 노트",
    tag: "04 · LIBRARY",
  },
  {
    src: "/screens/04-profile.png",
    alt: "LAW.OS — 학습 통계",
    caption: "연속 학습 · 북마크 통계",
    tag: "05 · PROFILE",
  },
];

// In-app screenshot gallery — horizontal-scrollable strip of phone mockups
// inspired by App Store screenshot rows. Each card has a violet glow,
// caption, and tag in the same Dark Academia palette as the rest of the page.
function ScreenshotGallery() {
  return (
    <div
      className="screenshot-strip flex gap-6 overflow-x-auto pb-6"
      style={{ scrollbarWidth: "none", scrollSnapType: "x mandatory" }}
    >
      {APP_SCREENSHOTS.map((s) => (
        <div
          key={s.src}
          className="shrink-0"
          style={{ scrollSnapAlign: "start" }}
        >
          <div className="relative" style={{ width: 260 }}>
            {/* glow */}
            <div
              className="absolute inset-0 -m-6 rounded-[44px] blur-3xl"
              style={{ background: "radial-gradient(circle, rgba(168,85,247,0.18), transparent 70%)" }}
            />
            {/* phone frame */}
            <div
              className="relative overflow-hidden rounded-[36px] bg-surface p-2"
              style={{ boxShadow: "0 0 0 1px rgba(168,85,247,0.3)" }}
            >
              <img
                src={s.src}
                alt={s.alt}
                className="block w-full select-none rounded-[28px]"
                draggable={false}
                loading="lazy"
              />
            </div>
          </div>
          <div className="mt-4 px-1">
            <div className="font-mono text-[10px] uppercase tracking-wider text-violet-glow">
              {`// ${s.tag}`}
            </div>
            <div className="mt-1 font-kr text-sm text-fg">{s.caption}</div>
          </div>
        </div>
      ))}
      <style>{`
        .screenshot-strip::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}

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
            <span className="hidden font-mono text-[10px] text-dim md:inline">
              · by aithor
            </span>
          </div>
          <div className="hidden gap-8 font-mono text-xs uppercase text-dim md:flex">
            <a href="#features" className="hover:text-fg">Features</a>
            <a href="#screens" className="hover:text-fg">Screens</a>
            <a href="#scope" className="hover:text-fg">Scope</a>
            <a href="#about" className="hover:text-fg">About</a>
          </div>
          <div className="font-mono text-[10px] uppercase text-dim">
            // 출시 준비 중
          </div>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="relative flex min-h-screen items-center pt-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[60%_40%] lg:gap-0">
          <div>
            <div className="font-mono text-xs uppercase tracking-wider text-violet-glow">
              // COMING SOON · 출시 준비 중
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

            <div className="mt-10 font-mono text-xs text-dim">
              // 법학도를 위한 학습 도구 · 법률 상담 아님
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
              footer="// mobile-first"
            >
              통학길 · 카페 · 강의실. 탭 한 번으로 민법 전체 조문과 판례를 탐색.
              오프라인 캐시로 지하철에서도 OK.
            </TerminalCard>
            <TerminalCard
              tag="02 · VERIFIED"
              title="검증된 답변"
              footer="// citations required"
            >
              GPT-4 Turbo + Claude Opus에 민법/형법/헌법 전체 DB를 RAG로 연결.
              모든 답변에 조문·판례 출처 필수.
            </TerminalCard>
            <TerminalCard
              tag="03 · YOUR LIBRARY"
              title="자동으로 쌓이는 서재"
              footer="// export to Anki / PDF"
            >
              질문은 자동 분류 저장. 과목별 · 주제별로 정리되고, Anki와 PDF로 내보내기.
              시험 직전에 꺼내보세요.
            </TerminalCard>
          </div>
        </div>
      </section>

      {/* ═══ APP SCREENSHOTS GALLERY ═══ */}
      <section id="screens" className="border-t border-white/5 py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12">
            <div className="font-mono text-xs uppercase tracking-wider text-violet-glow">
              // SCREENS
            </div>
            <h2 className="mt-4 font-kr text-5xl font-bold tracking-tight text-fg">
              실제 앱 화면
            </h2>
            <p className="mt-4 font-kr text-lg text-dim">
              Dark Academia Pro 톤. iOS · Android 동일 디자인.
            </p>
            <p className="mt-2 font-mono text-[10px] text-dim">
              // 좌우로 스크롤하여 더 많은 화면 보기 →
            </p>
          </div>
        </div>
        <div className="mx-auto max-w-[1400px] pl-6">
          <ScreenshotGallery />
        </div>
      </section>

      {/* ═══ SCOPE STRIP (출시 목표 범위) ═══ */}
      <section id="scope" className="border-t border-white/5 bg-surface-low py-24">
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

      {/* ═══ ABOUT — Made by aithor ═══ */}
      <section id="about" className="border-t border-white/5 bg-surface-low py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 md:grid-cols-[40%_60%] md:gap-16">
            <div>
              <div className="font-mono text-xs uppercase tracking-wider text-violet-glow">
                // BUILT BY
              </div>
              <h2 className="mt-4 font-kr text-5xl font-bold tracking-tight text-fg">
                aithor
              </h2>
              <p className="mt-4 font-mono text-xs text-dim">
                ai · author · architect
              </p>
            </div>
            <div className="space-y-4">
              <p className="font-kr text-lg leading-relaxed text-fg">
                LAW.OS는 <span className="font-bold text-violet-glow">aithor</span>에서
                기획·설계·개발한 모바일 법률 학습 앱입니다.
              </p>
              <p className="font-kr text-base leading-relaxed text-dim">
                AI 도메인 전문성을 바탕으로 법학도가 실제로 쓰는 학습 도구를
                만듭니다. 단순한 챗봇이 아닌, 법령·판례 데이터베이스와
                연결된 검증된 답변과 학습 흐름을 제공합니다.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded border border-white/10 bg-surface p-4">
                  <div className="font-mono text-[10px] uppercase text-violet-glow">
                    // STACK
                  </div>
                  <div className="mt-2 font-kr text-sm text-fg">
                    React Native · Supabase · Claude · Gemini
                  </div>
                </div>
                <div className="rounded border border-white/10 bg-surface p-4">
                  <div className="font-mono text-[10px] uppercase text-violet-glow">
                    // FOCUS
                  </div>
                  <div className="mt-2 font-kr text-sm text-fg">
                    법학도 · 변호사시험 준비생
                  </div>
                </div>
                <div className="rounded border border-white/10 bg-surface p-4">
                  <div className="font-mono text-[10px] uppercase text-violet-glow">
                    // CONTACT
                  </div>
                  <div className="mt-2 font-mono text-sm text-cyan">
                    hello@lawos.kr
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-white/5 bg-surface-low py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 md:grid-cols-4">
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
                // BUILT BY
              </div>
              <ul className="mt-4 space-y-2 font-mono text-xs text-dim">
                <li className="text-fg">aithor</li>
                <li>ai · author · architect</li>
              </ul>
            </div>
            <div>
              <div className="font-mono text-xs uppercase tracking-wider text-violet-glow">
                // CONTACT
              </div>
              <ul className="mt-4 space-y-2 font-mono text-xs text-dim">
                <li>hello@lawos.kr</li>
                <li>privacy@lawos.kr</li>
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
            <div>© 2026 aithor · LAW.OS는 aithor의 모바일 앱 제품입니다</div>
            <div>v1.0.0 preview</div>
          </div>
        </div>
      </footer>
    </main>
  );
}
