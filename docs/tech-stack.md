# LAW.OS — Tech Stack Decision

> **Version**: 1.0
> **Status**: Locked for MVP (변경 시 ADR 작성 필수)
> **Last Updated**: 2026-04-15

---

## 확정 기술 스택

### 모바일 앱
| 레이어 | 기술 | 버전 | 선택 이유 |
|--------|------|------|----------|
| Framework | **Expo (Managed)** | SDK 52 | OTA 업데이트, iOS/Android 동시 개발, EAS Build/Submit 자동화 |
| Language | **TypeScript** | 5.5+ | 타입 안전성, 백엔드와 타입 공유 (monorepo) |
| Routing | **expo-router** | 4.x | 파일 기반 라우팅, typed routes |
| Styling | **NativeWind** | 4.x | Tailwind → RN, 디자인 토큰 공유 |
| State | **Zustand** + **TanStack Query** | 5.x / 5.x | 로컬 상태 / 서버 상태 분리, 간결함 |
| Auth | **expo-auth-session** + **expo-apple-authentication** | latest | OAuth + Apple Sign In (iOS 필수) |
| Storage | **expo-secure-store** + **MMKV** | latest | JWT: secure / 캐시: MMKV (100배 빠름) |
| IAP | **RevenueCat** (react-native-purchases) | 8.x | iOS/Android 통합, 구독 복원, 가족 공유 |
| Analytics | **PostHog** | 3.x | 오픈소스 텔레메트리, 셀프 호스팅 가능 |

### 백엔드
| 레이어 | 기술 | 버전 | 선택 이유 |
|--------|------|------|----------|
| Runtime | **Node.js** | 22 LTS | TS 공유, LLM SDK 생태계 |
| Framework | **Hono** | 4.x | Fastify보다 가볍고 Edge 호환, Node/Bun 모두 지원 |
| ORM | **Drizzle** | latest | Prisma보다 가볍고 SQL에 가까움, 타입 추론 |
| DB | **Supabase Postgres** | 15 | Auth + RLS + Realtime 통합, pgvector 확장 |
| Vector DB | **pgvector** (Supabase 내장) | 0.7+ | Pinecone 불필요, 단일 DB로 단순화 (초기) |
| Cache | **Upstash Redis** | Serverless | 세션, rate limit, LLM 응답 캐시 |
| Queue | **Upstash QStash** | Serverless | 비동기 작업 (법령 동기화, 임베딩 생성) |
| Storage | **Supabase Storage** | S3 호환 | 판례 PDF, 사용자 업로드 |

### AI / LLM
| 용도 | 기술 | 비용 전략 |
|------|------|-----------|
| 일반 채팅 | **Claude Sonnet 4.5** (Anthropic API) | 한국어 품질, 긴 컨텍스트 |
| Deep Debate — Plaintiff/Defendant | **Claude Sonnet 4.5** | 비용 절감 |
| Deep Debate — Judge/Narrator | **Claude Opus 4.6** | 판단/요약 품질 필요 |
| Embeddings | **OpenAI text-embedding-3-large** (3072 dim) | 한국어 품질 우수, 저비용 |
| Reranker | **Cohere Rerank-3.5** | 검색 정확도 향상 |
| Orchestration | **LangGraph** (TypeScript) | Deep Debate 상태머신 |

### 인프라 / 배포
| 레이어 | 기술 | 선택 이유 |
|--------|------|----------|
| 백엔드 호스팅 | **Cloudflare Workers** | Edge, Hono와 완벽 호환, 저비용 |
| DB 호스팅 | **Supabase Cloud** (Seoul region) | 한국 레이턴시, 관리형 |
| 모바일 CI/CD | **EAS Build + EAS Submit** | Expo 표준 |
| 랜딩 페이지 | **Vercel** | 기존 배포 |
| 모니터링 | **Sentry** | 크래시 + 성능 |
| 법령 데이터 | **국가법령정보센터 OpenAPI** | 무료, 공식 |

### 개발 도구
| 용도 | 기술 |
|------|------|
| Monorepo | **pnpm workspaces** + **Turborepo** |
| Lint/Format | **Biome** (ESLint+Prettier 대체, 10배 빠름) |
| Test (Unit) | **Vitest** |
| Test (E2E Mobile) | **Maestro** |
| Test (API) | **Hono Testing Helpers** |
| API Doc | **Hono OpenAPI** → Scalar UI |
| Git Hooks | **lefthook** |

---

## 디렉터리 구조 (Monorepo)

```
law-os/
├── apps/
│   ├── mobile/          # Expo 앱
│   ├── api/             # Hono 백엔드 (Cloudflare Workers)
│   └── landing-page/    # Next.js (기존)
├── packages/
│   ├── shared-types/    # User, Message, Citation 등 공유 타입
│   ├── api-client/      # 모바일↔백엔드 타입 안전 클라이언트 (Hono RPC)
│   ├── prompts/         # LLM 시스템 프롬프트 템플릿
│   └── legal-data/      # 법령 수집 스크립트
├── docs/                # PRD, feature-spec, 이 문서
└── tools/               # 개발 스크립트
```

---

## 거절된 대안 (Rejected Alternatives)

| 후보 | 거절 이유 |
|------|----------|
| React Native CLI | Expo OTA 업데이트 + EAS 자동화 이점이 큼 |
| Flutter | TS 생태계 공유, Claude Code 친화도 우선 |
| FastAPI (Python) | TS 단일 언어 선호, LLM SDK는 TS도 충분 |
| Prisma | 번들 크기, Edge 호환성 이슈 |
| Pinecone | MVP 규모에서 pgvector로 충분, 단일 DB로 단순화 |
| Firebase | 벤더 락인, Supabase로 통일 |
| Redux Toolkit | Zustand가 더 간결, 보일러플레이트 적음 |

---

## 환경 변수 (핵심 목록)

```bash
# 모바일 (apps/mobile/.env)
EXPO_PUBLIC_API_URL=
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_POSTHOG_KEY=
EXPO_PUBLIC_REVENUECAT_APPLE_KEY=
EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY=

# 백엔드 (apps/api/.dev.vars)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
COHERE_API_KEY=
UPSTASH_REDIS_URL=
UPSTASH_REDIS_TOKEN=
SENTRY_DSN=
LAW_API_KEY=                    # 국가법령정보센터
REVENUECAT_WEBHOOK_SECRET=
```

모든 시크릿은 **1Password Vault** → **EAS Secrets** / **Cloudflare Secrets** 로 주입.

---

## 의존성 변경 시 ADR 작성

새로운 라이브러리 추가 또는 위 표의 기술 교체 시 `docs/adr/NNN-title.md` 작성 필수.
형식: Context / Decision / Consequences.
