import { Button } from "@/components/ui/Button";
import { TerminalCard } from "@/components/ui/TerminalCard";

// External links — replace with real URLs before launch
const APP_STORE = "https://apps.apple.com/app/id0000000000";
const GOOGLE_PLAY = "https://play.google.com/store/apps/details?id=kr.lawos";

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
            <a href="#pricing" className="hover:text-fg">Pricing</a>
            <a href="#download" className="hover:text-fg">Download</a>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost">Sign in</Button>
            <Button variant="primary">⬇ Download</Button>
          </div>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="relative flex min-h-screen items-center pt-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[60%_40%] lg:gap-0">
          <div>
            <div className="font-mono text-xs uppercase tracking-wider text-violet-glow">
              // NOW AVAILABLE · iOS & ANDROID
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
              통학길에서, 카페에서, 도서관에서. 민법·형법·헌법 전체와 2,341개 판례를
              언제 어디서나 물어보고 즉시 답을 받으세요.
            </p>

            {/* Metric chips */}
            <div className="mt-8 flex flex-wrap gap-3">
              {[
                ["2,341", "CASES"],
                ["12,847", "STATUTES"],
                ["98.4%", "ACCURACY"],
              ].map(([n, label]) => (
                <div key={label} className="rounded-sm bg-surface px-4 py-2 font-mono text-sm">
                  <span className="text-cyan">{n}</span>{" "}
                  <span className="text-[10px] uppercase text-dim">{label}</span>
                </div>
              ))}
            </div>

            {/* Download CTAs */}
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <a href={APP_STORE} target="_blank" rel="noopener">
                <Button variant="primary" className="h-14 w-full sm:w-auto">
                  ⬇ App Store
                </Button>
              </a>
              <a href={GOOGLE_PLAY} target="_blank" rel="noopener">
                <Button variant="primary" className="h-14 w-full sm:w-auto">
                  ⬇ Google Play
                </Button>
              </a>
            </div>
            <div className="mt-4 font-mono text-xs text-dim">
              // free · no credit card · 30-day pro trial
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

      {/* ═══ STATS STRIP ═══ */}
      <section className="border-t border-white/5 bg-surface-low py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 md:grid-cols-4">
          {[
            ["2,341", "ACTIVE USERS"],
            ["47.2M", "TOKENS PROCESSED"],
            ["12,847", "판례 INDEXED"],
            ["98.4%", "CITATION ACCURACY"],
          ].map(([n, label]) => (
            <div key={label}>
              <div className="font-mono text-5xl font-bold text-cyan">{n}</div>
              <div className="mt-2 font-mono text-xs uppercase text-dim">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ BIG DOWNLOAD CTA ═══ */}
      <section id="download" className="relative overflow-hidden border-t border-white/5 py-40">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: "radial-gradient(ellipse at center, #A855F7 0%, transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <div className="font-mono text-xs uppercase tracking-wider text-violet-glow">
            // READY?
          </div>
          <h2 className="mt-6 font-kr text-6xl font-bold leading-tight tracking-tightest text-fg md:text-7xl lg:text-[96px]">
            오늘부터
            <br />
            공부법이 달라집니다
          </h2>
          <p className="mt-6 font-kr text-xl text-dim">
            가장 똑똑한 법학 학습 파트너. 앱스토어에서 지금 만나보세요.
          </p>
          <div className="mt-12 flex flex-col justify-center gap-4 sm:flex-row">
            <a href={APP_STORE} target="_blank" rel="noopener">
              <Button variant="primary" className="h-16 w-full px-12 text-base sm:w-auto">
                ⬇ Download on the App Store
              </Button>
            </a>
            <a href={GOOGLE_PLAY} target="_blank" rel="noopener">
              <Button variant="primary" className="h-16 w-full px-12 text-base sm:w-auto">
                ⬇ Get it on Google Play
              </Button>
            </a>
          </div>
          <div className="mt-8 font-mono text-xs text-dim">
            // iOS 15+ · Android 9+ · 87MB · v1.0.0
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-white/5 bg-surface-low py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 md:grid-cols-5">
            <div className="md:col-span-2">
              <div className="font-mono text-lg font-bold text-violet-glow">LAW.OS</div>
              <p className="mt-2 font-kr text-xs text-dim">
                모바일 법률 학습 앱 · 법학도를 위한 AI 튜터
              </p>
            </div>
            {[
              { title: "PRODUCT", links: ["Features", "Pricing", "Download", "Changelog"] },
              { title: "RESOURCES", links: ["Docs", "Help", "Blog", "Contact"] },
              { title: "LEGAL", links: ["Terms", "Privacy", "Security", "GDPR"] },
            ].map((col) => (
              <div key={col.title}>
                <div className="font-mono text-xs uppercase tracking-wider text-violet-glow">
                  // {col.title}
                </div>
                <ul className="mt-4 space-y-2 font-mono text-xs text-dim">
                  {col.links.map((l) => (
                    <li key={l}>
                      <a href="#" className="hover:text-fg">
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 font-mono text-xs text-dim md:flex-row">
            <div>© 2026 LAW.OS inc. · 사업자등록번호 123-45-67890</div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-violet" />
              <span>ALL SYSTEMS OPERATIONAL · 99.98% uptime</span>
            </div>
            <div>v1.0.0 · build 8a7f3c2</div>
          </div>
        </div>
      </footer>
    </main>
  );
}
