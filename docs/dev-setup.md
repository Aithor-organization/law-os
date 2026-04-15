# LAW.OS — Developer Setup

> **Version**: 1.0
> **Target**: 신규 개발자(또는 Claude Code)가 이 문서만 보고 로컬 환경을 구축할 수 있어야 함

---

## 필수 소프트웨어

| 도구 | 버전 | 설치 |
|------|------|------|
| Node.js | 22 LTS | `brew install node@22` or [nvm](https://github.com/nvm-sh/nvm) |
| pnpm | 9+ | `corepack enable && corepack prepare pnpm@latest --activate` |
| Git | 2.40+ | `brew install git` |
| Expo CLI | latest | `pnpm dlx expo` (글로벌 설치 불필요) |
| Wrangler (Cloudflare) | 3+ | `pnpm add -g wrangler` |
| Xcode | 15+ (iOS) | Mac App Store |
| Android Studio | Hedgehog+ (Android) | [developer.android.com](https://developer.android.com/studio) |
| Watchman | latest | `brew install watchman` |

### 선택 도구
- **Biome** VS Code extension
- **Drizzle Studio** (`pnpm db:studio`)
- **Supabase CLI** (로컬 DB 선택 시)
- **Maestro** (`curl -Ls "https://get.maestro.mobile.dev" | bash`)

---

## 1. 레포 클론 & 설치

```bash
git clone https://github.com/Aithor-organization/law-os.git
cd law-os
pnpm install
```

### 모노레포 구조
```
law-os/
├── apps/
│   ├── mobile/       # Expo app
│   ├── api/          # Hono backend
│   └── landing-page/ # Next.js (이미 존재)
├── packages/
│   ├── ui/           # 공유 컴포넌트 + 디자인 토큰
│   ├── shared-types/ # User, Message 등 타입
│   ├── api-client/   # Hono RPC 클라이언트
│   └── prompts/      # LLM 프롬프트 템플릿
├── docs/
└── tools/
```

### Turborepo 태스크
```bash
pnpm dev           # 모든 앱 동시 실행
pnpm build         # 모두 빌드
pnpm lint          # 모두 lint
pnpm test          # 모두 테스트
pnpm typecheck     # TypeScript 검증
```

---

## 2. 환경변수 설정

### 2.1 1Password Vault에서 비밀값 다운로드
```bash
# 필수: 1Password CLI 설치
brew install --cask 1password-cli
op signin

# 프로젝트 Vault 접근 요청 (#law-os-access Slack 채널)

# 시크릿 로컬 동기화
pnpm secrets:pull
```

### 2.2 수동 설정 (Vault 접근 없을 때)

**`apps/mobile/.env.local`**
```bash
EXPO_PUBLIC_API_URL=http://localhost:8787
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_POSTHOG_KEY=
EXPO_PUBLIC_REVENUECAT_APPLE_KEY=
EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY=
```

**`apps/api/.dev.vars`** (Wrangler 로컬 개발용)
```bash
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
COHERE_API_KEY=
UPSTASH_REDIS_URL=
UPSTASH_REDIS_TOKEN=
SENTRY_DSN=
LAW_API_KEY=
REVENUECAT_WEBHOOK_SECRET=
```

**`apps/landing-page/.env.local`** — 이미 존재

---

## 3. Supabase 프로젝트 연결

### 옵션 A: 로컬 Supabase (개발 권장)
```bash
pnpm supabase:start     # Docker로 로컬 실행
pnpm db:push            # 스키마 적용
pnpm db:seed            # 법령/판례 샘플 데이터
```

### 옵션 B: 개발 클라우드 프로젝트
Supabase 대시보드에서 새 프로젝트 (Seoul region) → URL + anon key + service role key를 환경변수에 설정.

```bash
pnpm db:migrate         # 마이그레이션 적용
pnpm db:seed            # seed 실행
```

---

## 4. 백엔드 실행

```bash
cd apps/api
pnpm dev                # wrangler dev → http://localhost:8787
```

### 동작 확인
```bash
curl http://localhost:8787/v1/health
# → { "status": "ok", "version": "..." }
```

### API 문서 (Scalar UI)
http://localhost:8787/v1/docs

---

## 5. 모바일 앱 실행

```bash
cd apps/mobile
pnpm dev                # Expo dev server
```

### iOS 시뮬레이터
```bash
pnpm ios                # 기본 시뮬레이터에서 실행
```

### Android 에뮬레이터
```bash
pnpm android
```

### 실기기 (Expo Go)
Expo Go 앱 설치 → QR 코드 스캔

### EAS Dev Client (네이티브 모듈 필요 시)
```bash
eas build --profile development --platform ios
# 빌드 완료 후 기기에 설치
```

---

## 6. 랜딩 페이지 실행 (기존)

```bash
cd apps/landing-page
pnpm dev                # → http://localhost:3000
```

---

## 7. 법령 데이터 초기 수집

프로덕션 DB에 법령/판례가 없을 경우:

```bash
cd packages/legal-data
pnpm sync:statutes      # 국가법령정보센터 API로 민법/형법/헌법/상법
pnpm sync:cases         # 대법원 주요 판례
pnpm embed:all          # 임베딩 생성 (OpenAI API 필요)
```

**비용 주의**: 전체 초기 임베딩 약 $5. 개발 중에는 Seed 샘플(200개)만 사용.

---

## 8. 테스트 실행

```bash
pnpm test               # 전체
pnpm test:unit          # 단위만
pnpm test:integration   # API 통합
pnpm test:e2e           # Maestro (에뮬레이터 필요)
```

### Maestro 플로우
```bash
cd apps/mobile
maestro test .maestro/flows/
```

---

## 9. Git 워크플로우

### 브랜치
- `master` — 프로덕션
- `develop` — 다음 릴리즈 통합
- `feat/*`, `fix/*`, `docs/*` — 작업 브랜치

### 커밋 컨벤션 (Conventional Commits)
```
feat(mobile): add chat input auto-grow
fix(api): handle RevenueCat webhook signature
docs: update rag-pipeline cost estimate
```

### PR 체크리스트
1. `pnpm lint && pnpm typecheck && pnpm test` 통과
2. `docs/dod.md` 체크리스트 준수
3. 디자인 PR은 Stitch ID 명시
4. 사용자 컨펌 기록 (디자인 작업 시)

### Git Hooks (lefthook)
- pre-commit: lint + format
- pre-push: typecheck + unit test
- commit-msg: conventional commits 검증

---

## 10. 문제 해결 (Troubleshooting)

### `pnpm install` 실패
```bash
rm -rf node_modules **/node_modules
pnpm store prune
pnpm install
```

### Expo dev server 포트 충돌
```bash
# 8081 포트 사용 중
lsof -ti:8081 | xargs kill -9
```

### Supabase 연결 실패
```bash
pnpm supabase:status
pnpm supabase:restart
```

### iOS 시뮬레이터 크래시
```bash
xcrun simctl erase all
```

### Metro cache 문제
```bash
pnpm dev --clear
```

### Wrangler 로그인
```bash
wrangler login
```

---

## 11. 생산성 팁

### 자주 쓰는 명령어 alias
```bash
# ~/.zshrc 또는 ~/.bashrc
alias lao="cd ~/code/law-os"
alias laod="cd ~/code/law-os && pnpm dev"
alias laot="cd ~/code/law-os && pnpm test"
alias laob="cd ~/code/law-os && pnpm build"
```

### VS Code 확장
- Biome
- Tailwind CSS IntelliSense
- Error Lens
- GitLens
- ESLint (Biome와 충돌하지 않도록 비활성화)

### VS Code Workspace Settings (`law-os.code-workspace`)
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "biomejs.biome",
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

---

## 12. 첫 PR 체크리스트

신규 개발자(또는 Claude Code)가 이 레포에 처음 커밋하기 전에:

- [ ] `pnpm install` 성공
- [ ] `pnpm typecheck` 통과
- [ ] `pnpm test` 통과 (전체)
- [ ] `apps/mobile` → iOS 시뮬레이터에서 앱 부팅
- [ ] `apps/api` → `/v1/health` 응답
- [ ] `apps/landing-page` → localhost:3000 접속
- [ ] `docs/design-workflow.md`, `docs/dod.md` 읽기
- [ ] 첫 작업은 TaskList로 분해 후 시작

---

## 지원 채널 (추후)

- GitHub Issues: https://github.com/Aithor-organization/law-os/issues
- Slack: `#law-os-dev` (미개설)
- 이메일: `dev@lawos.kr` (미개설)
