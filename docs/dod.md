# LAW.OS — Definition of Done (DoD)

> **Version**: 1.0
> **Scope**: 모든 feature/화면/API 작업은 이 체크리스트를 100% 통과해야 "완료"로 간주한다.

---

## 🎨 디자인 작업 완료 기준 (UI-Only PR)

> 참고: `docs/design-workflow.md` — 디자인은 반드시 로직과 분리된 PR로 머지.

### 필수 체크
- [ ] **Stitch 시안 ID** PR description에 명시
- [ ] 모든 색/간격/폰트는 `packages/ui/tokens.ts`에서 참조 (하드코딩 zero)
- [ ] **로딩/빈/에러 상태** 모두 구현 (mock 데이터로 시연 가능)
- [ ] Pixel parity 검증 스크립트 통과 (`pnpm check:stitch`)
- [ ] **Storybook 스토리** 작성 (모든 상태별)
- [ ] **사용자 컨펌** 획득 (PR 코멘트 또는 대화 기록에 "OK" 명시)
- [ ] 접근성 검증:
  - [ ] 최소 터치 타겟 44×44
  - [ ] 대비 4.5:1 (본문) / 3:1 (큰 텍스트)
  - [ ] VoiceOver/TalkBack 레이블
  - [ ] 키보드 네비게이션 (포커스 순서)
- [ ] 반응형: iPhone SE (작은) ~ iPad (큰) 모두 깨지지 않음
- [ ] Dark mode 기본 (LAW.OS는 다크만 지원)

### 금지 사항
- ❌ API 호출
- ❌ 상태 관리 (Zustand/TanStack Query)
- ❌ 비즈니스 로직
- ❌ 네비게이션 이벤트 핸들러 (mock만 허용)

---

## ⚙️ 기능 구현 완료 기준 (Logic PR)

> 디자인 PR이 머지된 **이후**에만 시작 가능.

### 필수 체크
- [ ] AC (Acceptance Criteria) 모두 충족 — feature-spec 원문 인용
- [ ] TypeScript 컴파일 무경고 (`tsc --noEmit` 통과)
- [ ] Biome lint 통과 (`pnpm lint`)
- [ ] 단위 테스트 작성 (Vitest, 핵심 로직 80%+ 커버리지)
- [ ] 통합 테스트 (API 엔드포인트 최소 1개 happy path + 1개 error)
- [ ] E2E 테스트 (Maestro 플로우, 주요 사용자 경로)
- [ ] 에러 핸들링 — `state-flows.md`의 에러 매트릭스와 일치
- [ ] 로딩 상태 — 모든 async 작업에 UI 피드백
- [ ] 분석 이벤트 — PostHog 추적 (이벤트 이름은 `analytics-events.md` 참조, 아직 미작성)
- [ ] 빌드 검증: `pnpm build` 성공 (mobile + api + landing-page 전체)

### 보안
- [ ] 유저 입력 **서버 측** 검증 (Zod schema)
- [ ] SQL 인젝션 방지 (Drizzle parameterized)
- [ ] XSS 방지 (React 기본 + SSE 이벤트 sanitize)
- [ ] 비밀값은 환경변수로만 (하드코딩 0)
- [ ] Rate limit 적용 (Upstash Redis)
- [ ] RLS 정책 활성화 (user-scoped 테이블)
- [ ] OWASP Top 10 자체 체크

### 성능
- [ ] API p95 latency < 400ms (검색), < 2s (TTFT 채팅)
- [ ] 모바일 번들 크기 증가 < 100KB
- [ ] FlashList 사용 (긴 리스트)
- [ ] 이미지는 `expo-image` + 캐싱

### 법적 (변호사법)
- [ ] `legal-ux.md` 차단 키워드 시스템 통과
- [ ] 면책 고지 배너 표시
- [ ] 개인 조언 요청 시 차단 응답

---

## 🧪 테스트 완료 기준

### 단위 테스트 (Vitest)
- [ ] 순수 함수 100%
- [ ] 비즈니스 로직 80%+
- [ ] React 훅 (핵심만)

### 통합 테스트 (Hono test client)
- [ ] 각 엔드포인트 happy path
- [ ] 주요 에러 (400, 401, 403, 429, 500)
- [ ] Auth 플로우 (signup → login → refresh → logout)
- [ ] Billing webhook 서명 검증

### E2E 테스트 (Maestro)
- [ ] 신규 가입 → 첫 질문 → 답변 받기
- [ ] 로그인 → 대화 이어가기 → 서재 저장
- [ ] 무료 한도 도달 → 업그레이드 → Pro 질문
- [ ] 오프라인 → 캐시된 조문 열람

### 시각 회귀 (선택)
- [ ] Playwright 스냅샷 (랜딩 페이지)
- [ ] Maestro 스크린샷 비교 (모바일 주요 화면)

---

## 📦 배포 완료 기준

### 백엔드 (Cloudflare Workers)
- [ ] Preview deploy (PR마다) → Smoke test 통과
- [ ] Sentry 연동 확인 (에러 리포팅)
- [ ] 환경변수 모두 설정 (staging + production)
- [ ] Rate limit 테스트
- [ ] DB 마이그레이션 실행 완료

### 모바일 (EAS)
- [ ] Internal distribution (EAS Build) 통과
- [ ] TestFlight / Play Console 내부 테스트 통과
- [ ] Sentry 크래시 리포팅 연동
- [ ] PostHog 이벤트 수신 확인
- [ ] 실기기 스모크 테스트 (iOS + Android)

### 랜딩 페이지 (Vercel)
- [ ] Preview URL 확인
- [ ] Lighthouse 90+ (performance, accessibility, SEO)
- [ ] OG 이미지 프리뷰 테스트
- [ ] Deploy Hook으로 prod 반영

---

## 📚 문서화 완료 기준

- [ ] 새 API는 OpenAPI 스펙에 반영 (`/v1/docs`)
- [ ] 새 컴포넌트는 Storybook 스토리
- [ ] Public 함수/훅은 JSDoc
- [ ] 중요한 결정은 `docs/adr/NNN-title.md`로 기록
- [ ] CHANGELOG.md 업데이트 (semver 기준)
- [ ] README.md 변경 반영 (해당 시)

---

## 🔴 자동 차단 기준 (CI 실패 = 머지 차단)

- TypeScript 컴파일 에러
- Biome lint 에러
- 테스트 실패
- 빌드 실패 (mobile OR api OR landing-page)
- Pixel parity 실패 (디자인 PR)
- OpenAPI diff 승인 안 됨 (breaking change)
- Drizzle 마이그레이션 dry-run 실패
- 보안 스캔 (Snyk, npm audit high+) 실패

---

## 🟡 수동 확인 기준 (리뷰어 체크)

- [ ] PR 제목/설명 명확
- [ ] Stitch ID 또는 feature-spec ID 레퍼런스
- [ ] 스크린샷/녹화 (UI 변경 시)
- [ ] Breaking change 여부 표기
- [ ] Rollout 계획 (feature flag, staged rollout)

---

## Definition of Ready (작업 시작 가능 조건)

작업을 **시작하기 전에** 충족되어야 하는 조건:

- [ ] feature-spec의 해당 기능이 확정됨
- [ ] 디자인 작업이면 → Stitch 시안 존재
- [ ] 의존하는 다른 기능이 머지됨 또는 mock 가능
- [ ] 데이터 모델이 `data-model.md`에 있음
- [ ] API 계약이 `api-spec.md`에 있음
- [ ] 테스트 전략 결정됨

**미충족 시 작업 시작 금지.** 먼저 문서 gap을 채운다.
