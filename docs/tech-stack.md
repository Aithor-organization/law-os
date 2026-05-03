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
| Runtime | **Python** | 3.11+ | AI/LLM 연동과 로컬 디버깅 단순화 |
| Framework | **FastAPI** | 0.115+ | 비동기 API, SSE 스트리밍, 명확한 백엔드 계층 |
| HTTP Client | **httpx** | 0.27+ | Gemini/Supabase 연동, async streaming |
| DB/Auth Access | **Supabase Cloud** | hosted | Auth + Postgres + Storage 관리형 유지 |
| DB | **Supabase Postgres** | 15 | Auth + RLS + Realtime 통합, pgvector 확장 |
| Vector DB | **pgvector** (Supabase 내장) | 0.7+ | Pinecone 불필요, 단일 DB 유지 |
| Storage | **Supabase Storage** | S3 호환 | 판례 PDF, 사용자 업로드 |

> 🔄 **아키텍처 결정 (2026-04-16 변경)**: Supabase Edge Functions 기반 로컬 디버깅/스트리밍 복잡도를 줄이기 위해, 백엔드 계층을 FastAPI로 분리하고 Supabase는 온라인 Auth/DB/Storage 인프라로 유지한다. 1차 마이그레이션 범위는 chat 경로이며, 나머지 서버 작업도 순차 이전한다.

### AI / LLM (Gemini 전용)
| 용도 | 기술 | 비용 전략 |
|------|------|-----------|
| 일반 채팅 | **Gemini 2.5 Flash** | 대부분의 질문 처리, 저비용·저지연 |
| 복잡 추론 / Deep Debate | **Gemini 2.5 Pro** | 긴 컨텍스트, 판례 분석, 토론 조정 |
| Embeddings | **gemini-embedding-001** (3072 dim, Matryoshka) | 스키마의 `vector(3072)` 호환, 한국어 지원 |
| Orchestration | (MVP: 순차 실행) | 복잡해지면 LangGraph 재도입 |

> 모델 ID는 `apps/api/.env.local`의 `GEMINI_MODEL_FLASH` / `GEMINI_MODEL_PRO` / `GEMINI_EMBEDDING_MODEL`로 오버라이드 가능. Google이 신규 모델을 출시하면 문자열만 교체.

### 인프라 / 배포
| 레이어 | 기술 | 선택 이유 |
|--------|------|----------|
| 백엔드 호스팅 | **Supabase Edge Functions** (Deno) | Supabase 통합, 별도 계정·별도 호스팅 불필요 |
| DB 호스팅 | **Supabase Cloud** (Seoul region) | 한국 레이턴시, 관리형 |
| 모바일 CI/CD | **EAS Build + EAS Submit** | Expo 표준 |
| 랜딩 페이지 | **Vercel** | 기존 배포 |
| 모니터링 | **Sentry** | 크래시 + 성능 |
| 법령 데이터 | **국가법령정보센터 OpenAPI** + **LAW.OS Law MCP** | 공식 원문 수집 + MCP 툴 조회 계층 |

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
├── mobile/              # Expo 앱 (현재 구조: law-os/mobile/)
├── apps/
│   ├── backend/         # FastAPI backend
│   │   └── app/
│   │       ├── auth.py  # Supabase JWT 검증
│   │       ├── gemini.py# Gemini streaming proxy
│   │       └── main.py  # /chat, /health
│   └── api/             # Legacy Supabase Edge Functions (migration target)
├── landing-page/        # Next.js
├── docs/                # PRD, feature-spec, 이 문서, supabase/*.sql
└── assets/              # 공유 에셋
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
# 모바일 (mobile/.env.local)
EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_POSTHOG_KEY=
EXPO_PUBLIC_REVENUECAT_APPLE_KEY=
EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY=

# 백엔드 (apps/backend/.env)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ANON_KEY=
GEMINI_API_KEY=
GEMINI_MODEL_FLASH=gemini-2.5-flash
GEMINI_MODEL_PRO=gemini-2.5-pro
GEMINI_EMBEDDING_MODEL=gemini-embedding-001
BACKEND_CORS_ORIGINS=http://localhost:8081,http://127.0.0.1:8081

# 출시 이후 추가 예정
SENTRY_DSN=
LAW_API_OC=                     # 국가법령정보센터 API 인증값
REVENUECAT_WEBHOOK_SECRET=
```

로컬: `.env.local` 또는 `.env` (gitignore). FastAPI는 `.env`, 모바일은 `.env.local` 사용.

---

## 의존성 변경 시 ADR 작성

새로운 라이브러리 추가 또는 위 표의 기술 교체 시 `docs/adr/NNN-title.md` 작성 필수.
형식: Context / Decision / Consequences.
