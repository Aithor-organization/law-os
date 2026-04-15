# LAW.OS — State Flows

> **Version**: 1.0
> **Scope**: 결제, 오프라인, 에러, 인증, 무료 한도 상태머신

---

## 1. 인증 / 세션 상태

```
┌──────────┐   signup/login    ┌──────────────┐
│ Anonymous├──────────────────▶│ Authenticated│
└──────────┘                   └──────┬───────┘
     ▲                                │
     │ logout/delete                  │ token expired
     │                                ▼
     │                         ┌──────────────┐
     │                         │ Refreshing   │
     │                         └──────┬───────┘
     │                                │
     │              refresh ok  ┌─────┴─────┐  refresh fail
     │              ◀───────────┤           ├────────────────┐
     │                          └───────────┘                │
     └────────────────────────────────────────────────────────┘
                       (force logout, clear tokens)
```

### 규칙
- **Access token 만료 전 60초**부터 silent refresh 시도
- Refresh token 실패 → 모든 로컬 상태 purge → Anonymous
- 2개 이상의 refresh 동시 발생 시 → mutex로 단일 요청 보장
- Network offline 시 refresh 보류 → 온라인 복귀 시 재시도

---

## 2. 결제 / 구독 상태

```
┌──────┐  purchase   ┌────────┐  expire   ┌─────────┐
│ Free ├────────────▶│ Active ├──────────▶│ Grace   │
└──┬───┘             └───┬────┘           │ (3 days)│
   │                     │                └────┬────┘
   │                     │ cancel              │ recovered
   │                     ▼                     │
   │              ┌──────────┐                  │
   │              │ Canceled │◀─────────────────┘
   │              └─────┬────┘
   │                    │ expired (period end)
   │                    ▼
   │              ┌──────────┐
   └─────────────▶│ Expired  │
                  └──────────┘
```

### 핵심 규칙
- **Grace period (3일)**: 결제 실패 시 즉시 권한 박탈 X → 재시도 기회 제공
- **Canceled**: 기간 만료까지 Pro 기능 유지
- **Student verified**: 1년 유효, 만료 시 일반 Free로 강등
- **RevenueCat webhook**이 상태 전환의 Source of Truth
- 로컬 상태는 항상 서버에서 refetch 후 신뢰

### 결제 실패 플로우
```
Purchase attempt
  ↓
  ├─ Success → webhook → DB update → client refetch /me
  ├─ User cancel → 아무 변화 없음
  ├─ Payment declined → 안내 모달 + "결제 수단 변경" CTA
  ├─ Network error → 3회 재시도 → 실패 시 지원 문의
  └─ Already subscribed → restore 자동 트리거
```

---

## 3. 무료 한도 (Quota) 상태

```
질문 시도
  ↓
GET /me → quota 확인
  ↓
  ├─ used < limit → 정상 진행
  ├─ used == limit - 1 → 경고 배너 표시 ("마지막 질문")
  └─ used >= limit → 업그레이드 모달 + 차단
```

### 카운트 증가 시점
- **서버 측**에서 카운트 증가 (클라이언트 조작 방지)
- 응답 **첫 토큰** 받은 시점에 증가 (timeout 시 복구 가능)
- 스트림 중 에러 발생 → quota rollback

### 리셋
- **매일 00:00 KST** (유저 timezone 기준)
- Redis TTL로 관리
- 리셋 시 클라이언트 알림 없음 (다음 호출 시 자연 반영)

---

## 4. 채팅 메시지 라이프사이클

```
draft (입력 중)
  ↓ send
pending (클라이언트 큐)
  ↓ POST /chat/.../messages
streaming (SSE 수신 중)
  ├─ event: token → UI 업데이트
  ├─ event: citation → 출처 마킹
  ├─ event: error → retrying/failed
  └─ event: done → completed
```

### 상태별 UI
| State | UI |
|-------|-----|
| `draft` | 입력창 활성 |
| `pending` | 전송 버튼 스피너 |
| `streaming` | 메시지 말풍선 + 커서 깜빡임 |
| `completed` | 피드백 버튼(👍👎) 노출 |
| `failed` | 재시도 버튼 + 에러 이유 |
| `retrying` | 자동 재시도 표시 (max 2회) |

### 실패 처리
- **Network error**: 자동 재시도 (exponential backoff 1s → 3s)
- **LLM rate limit**: 5초 대기 후 재시도
- **LLM content filter**: 재시도 금지, 사용자에게 안내
- **Timeout (30s)**: 중단 후 부분 응답 유지 + "계속하기" 버튼

---

## 5. 오프라인 / 네트워크 상태

```
┌──────────┐  lost       ┌──────────┐
│ Online   ├────────────▶│ Offline  │
└────┬─────┘             └────┬─────┘
     │ ▲                      │
     │ │ restored              │
     │ └──────────────────────┘
     ▼
요청 시점 판단
  ├─ 캐시 가능 → 서비스 워커 응답
  ├─ 읽기 요청 → 로컬 DB fallback
  └─ 쓰기 요청 → 큐잉 (Zustand persist)
```

### 지원되는 오프라인 기능
- 즐겨찾기 조문 열람 (사전 다운로드)
- 과거 대화 읽기 (로컬 캐시)
- 서재 노트 읽기

### 차단되는 기능 (오프라인 시)
- 새 질문 전송
- 검색 (로컬 인덱스 없음)
- 결제
- 실시간 동기화

### 큐잉 전략
쓰기 작업(노트 수정, 피드백 등)은 Zustand persist에 저장 → 온라인 복귀 시 순차 재실행. 충돌 시 server wins.

---

## 6. 에러 처리 전체 매트릭스

| 에러 유형 | HTTP | 사용자 표시 | 재시도 | 로깅 |
|----------|------|------------|--------|------|
| Network offline | - | "인터넷 연결 필요" 배너 | auto on reconnect | local |
| 401 Unauthorized | 401 | silent → refresh → 재시도 | 자동 | Sentry |
| 403 Forbidden | 403 | "권한이 없습니다" | 금지 | Sentry |
| 404 Not Found | 404 | "찾을 수 없음" 빈 상태 | 금지 | info |
| 429 Quota | 429 | 업그레이드 모달 | 금지 | analytics |
| 429 Rate limit | 429 | "잠시 후 다시" (자동 재시도) | 5s 후 1회 | warn |
| 500 Internal | 500 | "문제가 발생했습니다" + 문의 버튼 | 3회 backoff | Sentry critical |
| 503 LLM down | 503 | "AI 서비스 점검 중" 배너 | 30s polling | Sentry |
| Timeout | - | "응답이 지연됩니다" | 1회 자동 | Sentry |

---

## 7. 앱 라이프사이클 이벤트

```
App launch
  ↓
Splash
  ↓
Read stored session
  ├─ Valid → Home
  ├─ Expired → Silent refresh → Home or Login
  └─ None → Onboarding (first-time) or Login
```

### Resume from background
- 5분+ 백그라운드 → `/me` refetch (세션 유효성 확인)
- Push notification tap → 딥링크로 해당 화면

---

## 8. 법적 동의 상태

### 필수 동의 3종
1. 서비스 이용약관 (ToS)
2. 개인정보 처리방침
3. **법률 상담이 아닌 학습 도구** 고지 (변호사법 대응)

### 플로우
```
Signup
  ↓
동의 화면 (3개 모두 체크박스 + 전문 링크)
  ↓
  ├─ 모두 체크 → POST /auth/signup (timestamps 전송)
  └─ 미체크 → 진행 불가
```

### 약관 업데이트 시
- 버전 번호 증가 (예: tos_v2)
- 로그인 시 최신 버전 동의 여부 확인
- 미동의면 강제 모달 → 동의 후 앱 진입 허용
- 거부 시 읽기 전용 모드 제공 (새 질문 불가)

---

## 9. Deep Debate 세션 상태

```
Init (narrator intro)
  ↓
Round 1: Plaintiff
  ↓
Round 1: Defendant
  ↓
Round 2: Plaintiff rebuttal
  ↓
Round 2: Defendant rebuttal
  ↓
Judge evaluation
  ↓
Narrator summary
  ↓
Done
```

### 중단 처리
- 사용자가 중간에 "중단" → 지금까지 생성된 내용 유지 + 요약 생성 스킵
- 네트워크 끊김 → 마지막 라운드까지 저장, 복귀 시 "계속" 옵션
- LLM 에러 → 현재 에이전트 재시도 1회 → 실패 시 세션 종료
