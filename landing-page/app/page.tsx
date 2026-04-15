import { Button } from "@/components/ui/Button";
import { TerminalCard } from "@/components/ui/TerminalCard";

// External links — replace with real URLs before launch
const APP_STORE = "https://apps.apple.com/app/id0000000000";
const GOOGLE_PLAY = "https://play.google.com/store/apps/details?id=kr.lawos";

export default function HomePage() {
  return (
    <main className="relative z-10">
      {/* ═══ NAVIGATION (fixed, glassmorphic) ═══ */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-black/60 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <span className="font-mono text-lg font-bold text-violet-glow">
              LAW.OS
            </span>
            <span className="font-mono text-[10px] text-cyan">v1.0.0</span>
          </div>
          <div className="hidden gap-8 font-mono text-xs uppercase text-dim md:flex">
            <a href="#features" className="hover:text-fg">Features</a>
            <a href="#pricing" className="hover:text-fg">Pricing</a>
            <a href="#changelog" className="hover:text-fg">Changelog</a>
            <a href="#docs" className="hover:text-fg">Docs</a>
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
              법률 공부의
              <br />
              새로운 OS
            </h1>
            <p className="mt-6 text-2xl font-medium tracking-tight text-dim md:text-3xl">
              Terminal for Korean Law Students
            </p>
            <p className="mt-6 max-w-2xl font-kr text-base leading-relaxed text-dim">
              곽윤직도 몰랐던 학습법. ⌘K 하나로 2,341개 판례와 민법 전체를 탐색하는
              AI 법률 튜터.
            </p>

            {/* Metric chips */}
            <div className="mt-8 flex flex-wrap gap-3">
              {[
                ["2,341", "CASES"],
                ["12,847", "STATUTES"],
                ["98.4%", "ACCURACY"],
              ].map(([n, label]) => (
                <div
                  key={label}
                  className="rounded-sm bg-surface px-4 py-2 font-mono text-sm"
                >
                  <span className="text-cyan">{n}</span>{" "}
                  <span className="text-dim uppercase text-[10px]">{label}</span>
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

          {/* Right: iPhone mockup placeholder */}
          <div className="relative flex items-center justify-center">
            <div className="relative h-[600px] w-[300px] rounded-[40px] bg-surface shadow-glow-lg ring-1 ring-violet/30">
              <div className="absolute inset-0 flex items-center justify-center font-mono text-xs text-dim">
                {/* Replace with <img src="/hero-iphone.png" /> */}
                [ iPhone mockup · active chat UI ]
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FEATURES (3-col grid) ═══ */}
      <section id="features" className="border-t border-white/5 py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16">
            <div className="font-mono text-xs uppercase tracking-wider text-violet-glow">
              // FEATURES
            </div>
            <h2 className="mt-4 text-5xl font-bold tracking-tight text-fg">
              파워유저를 위한 법률 AI
            </h2>
            <p className="mt-4 text-lg text-dim">
              Not another chatbot. A full OS for legal research.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <TerminalCard
              tag="01 · KEYBOARD FIRST"
              title="마우스를 버리세요"
              footer="// used 847,392 times this month"
            >
              30+ 단축키로 마우스 없이 전체 앱을 제어. 판례 검색, 새 채팅, 내보내기까지
              0.5초.
            </TerminalCard>
            <TerminalCard
              tag="02 · INTELLIGENCE"
              title="당신보다 잘 아는 AI"
              footer="// 98.4% citation accuracy"
            >
              GPT-4 Turbo + Claude Opus 4.6에 민법/형법/헌법 전체 DB를 RAG로 연결.
              인용은 필수.
            </TerminalCard>
            <TerminalCard
              tag="03 · YOUR SECOND BRAIN"
              title="지식이 쌓입니다"
              footer="// avg 2,847 notes after 3 months"
            >
              모든 질문이 자동으로 분류·색인됩니다. Obsidian처럼 링크되고 Anki로
              내보내기.
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
              <div className="mt-2 font-mono text-xs uppercase text-dim">
                {label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ BIG DOWNLOAD CTA ═══ */}
      <section className="relative overflow-hidden border-t border-white/5 py-40">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(ellipse at center, #A855F7 0%, transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <div className="font-mono text-xs uppercase tracking-wider text-violet-glow">
            // READY?
          </div>
          <h2 className="mt-6 font-kr text-6xl font-bold leading-tight tracking-tightest text-fg md:text-7xl lg:text-[96px]">
            오늘 밤부터
            <br />
            파워유저
          </h2>
          <p className="mt-6 font-kr text-xl text-dim">
            곽윤직 한 권만큼의 무게. 손 안에서.
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
            // iOS 15+ · Android 9+ · 87MB · v1.0.0 · 2026-04-15
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-white/5 bg-surface-low py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 md:grid-cols-5">
            <div className="md:col-span-2">
              <div className="font-mono text-lg font-bold text-violet-glow">
                LAW.OS
              </div>
              <p className="mt-2 font-mono text-xs text-dim">
                legal ai for power users
              </p>
            </div>
            {[
              { title: "PRODUCT", links: ["Features", "Pricing", "Changelog", "Roadmap"] },
              { title: "RESOURCES", links: ["Docs", "API", "Blog", "Help"] },
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
