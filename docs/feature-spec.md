# LAW.OS — Feature Specification (기능명세서)

> **Version**: 1.0 (Draft)
> **Companion to**: [PRD](./prd.md)
> **Last Updated**: 2026-04-15

---

## 🎨 디자인 참조 필수 (READ FIRST)

> **각 기능을 구현하기 전에 반드시 해당 화면의 Stitch 디자인 시안을 확인하세요.**
> 이 명세서는 동작 규칙(behavior)만 정의합니다. 레이아웃·간격·색상·인터랙션은 시안을 따릅니다.

| 프로젝트 | Stitch ID | 관련 기능 |
|---------|-----------|----------|
| 모바일 앱 + 관리자 | `7657386961511176864` | F-01 ~ F-10 모든 기능 화면 |
| 랜딩 페이지 | `5047194537981448179` | 마케팅 (이 문서 범위 외) |

**기능별 매핑** (시안 확인 우선순위):
- **F-01 AI 채팅** → "Active Chat" 화면 (`active-chat-stitch.png` 참조)
- **F-02 조문 검색** → "Statute Search" / "Statute Detail"
- **F-03 판례 검색** → "Case Search" / "Case Detail"
- **F-04 자동 서재** → "Library" / "Library Folder"
- **F-05 회원가입/로그인** → "Onboarding" / "Sign In"
- **F-06 결제** → "Paywall" / "Subscription Settings"
- **F-10 Deep Debate** → "Mode Toggle Chat" (작성 예정)

**조회 방법**:
```bash
mcp__stitch__list_screens project_id=7657386961511176864
mcp__stitch__get_screen project_id=7657386961511176864 screen_id=<id>
```

**디자인 토큰 SSOT**: `landing-page/tailwind.config.ts` (true black + violet #A855F7 + cyan #06B6D4 + 6px radius + violet glow)

> ⚠️ **시안과 명세가 충돌하면**: 디자이너에게 컨펌받은 후 둘 중 하나를 업데이트하고 PR로 동기화합니다. 임의로 결정하지 마세요.

---

## 목차
1. [F-01: AI 법률 채팅](#f-01-ai-법률-채팅)
2. [F-02: 조문 검색](#f-02-조문-검색)
3. [F-03: 판례 검색](#f-03-판례-검색)
4. [F-04: 자동 서재](#f-04-자동-서재)
5. [F-05: 회원가입/로그인](#f-05-회원가입로그인)
6. [F-06: 무료/Pro 플랜](#f-06-무료pro-플랜)
7. [F-10: Deep Debate 모드](#f-10-deep-debate-모드)
8. [데이터 모델](#데이터-모델)
9. [API 엔드포인트](#api-엔드포인트)

---

## F-01: AI 법률 채팅

### 개요
사용자가 자연어로 법률 질문을 입력하면, RAG 기반으로 관련 조문/판례를 검색해 출처가 명시된 답변을 생성한다.

### User Flow
1. 홈 → "새 질문" 탭
2. 입력창에 질문 타이핑 (예: "민법 750조의 불법행위 성립요건이 뭐야?")
3. 전송 → 로딩 (스트리밍 토큰 표시)
4. 답변 표시: 본문 + 출처 카드 (조문/판례 하이라이트)
5. 출처 카드 탭 → 원문 전문 모달
6. 👍/👎 피드백 → 자동 서재에 저장 여부 선택

### Acceptance Criteria
- [ ] 질문 입력 후 첫 토큰까지 ≤ 2초 (TTFB)
- [ ] 모든 답변에 최소 1개 이상 출처 포함
- [ ] 출처 클릭 시 원문 전문 모달 표시
- [ ] 답변 길이 ≥ 200자 (간단 질문 제외)
- [ ] 오프라인 시 "인터넷 연결 필요" 안내
- [ ] 무료 플랜은 일 10회 제한 (11회째 → 업그레이드 모달)

### Edge Cases
- **법률과 무관한 질문**: "오늘 날씨는?" → "법률 학습 도구입니다" 안내
- **모호한 질문**: "민법" → 명확화 질문 reverse-prompt
- **부적절한 질문**: 불법 행위 조언 요청 → 거부 + 신고 유도

### 기술 스펙
- **LLM**: GPT-4 Turbo (1차) + Claude Opus (Deep Debate 시)
- **Retrieval**: Pinecone + OpenAI embedding-3-large + Cohere Rerank
- **Chunking**: 조문 단위 (1 article = 1 chunk)
- **Streaming**: Server-Sent Events (SSE)

---

## F-02: 조문 검색

### 개요
민법/형법/헌법 전체 조문을 키워드 또는 조 번호로 검색하고 즐겨찾기할 수 있다.

### User Flow
1. 하단 탭 → "조문"
2. 검색창에 키워드 또는 "민법 750" 입력
3. 결과 리스트 → 항목 탭 → 조문 상세
4. 우상단 ⭐ 탭 → 즐겨찾기 추가
5. 길게 누름 → AI에게 질문하기 / 공유 / 복사

### Acceptance Criteria
- [ ] 검색어 입력 후 ≤ 300ms 결과 표시
- [ ] 조 번호 검색 ("750") 시 정확 매칭 우선
- [ ] 즐겨찾기는 오프라인 캐시 (P1)
- [ ] 조문 상세에 관련 판례 5개 자동 노출

### 데이터
- 출처: 국가법령정보센터 OpenAPI
- 업데이트: 일 1회 cron sync
- 약 12,847개 조문

---

## F-03: 판례 검색

### 개요
사건번호 또는 키워드로 대법원 판례를 검색하고 핵심 요지를 확인한다.

### User Flow
1. 하단 탭 → "판례"
2. 검색창 또는 카테고리 (민사/형사/헌법) 선택
3. 결과 리스트 (사건번호 + 선고일 + 요지 1줄)
4. 항목 탭 → 판례 상세 (요지 → 판시사항 → 전문)
5. "이 판례에 대해 질문하기" 버튼 → AI 채팅으로 deep link

### Acceptance Criteria
- [ ] 사건번호 정확 검색 (예: "2018다12345")
- [ ] 키워드 검색은 의미 기반 (벡터 검색)
- [ ] 판례 상세에 관련 조문 자동 링크
- [ ] 약 2,341개 판례 인덱싱

---

## F-04: 자동 서재

### 개요
사용자의 질문/답변이 자동으로 과목·주제별 분류되어 개인 서재에 저장된다.

### User Flow
1. 채팅 답변 후 👍 → "서재에 저장" 선택
2. 자동 분류: 과목(민법/형법/...), 주제(채권/물권/...), 태그
3. 하단 탭 → "서재" → 폴더 트리
4. 폴더 탭 → 저장된 노트 리스트
5. 노트 탭 → 원본 질문/답변/출처 표시

### Acceptance Criteria
- [ ] 자동 분류 정확도 ≥ 85%
- [ ] 사용자 수동 재분류 가능
- [ ] Anki 형식 내보내기 (P1)
- [ ] PDF 내보내기 (P1)

### 데이터 모델 (간단)
```ts
Note {
  id: string
  user_id: string
  question: string
  answer: string
  citations: Citation[]
  subject: "민법" | "형법" | "헌법" | ...
  topic: string
  tags: string[]
  created_at: timestamp
}
```

---

## F-05: 회원가입/로그인

### Authentication Methods
- 이메일 + 비밀번호
- Apple Sign In (iOS 필수)
- Google Sign In
- Kakao Login (한국 시장)

### Acceptance Criteria
- [ ] OAuth 모두 1탭 로그인
- [ ] 이메일은 verify link 필수
- [ ] 비밀번호 8자+ / 특수문자 1+
- [ ] 첫 가입 시 온보딩 (학년/목표 입력) 후 무료 30일 Pro 트라이얼
- [ ] JWT + Refresh Token (Singleton 패턴)
- [ ] 탈퇴 시 데이터 즉시 삭제 (GDPR)

---

## F-06: 무료/Pro 플랜

### Pricing

| 플랜 | 가격 | 한도 |
|------|------|------|
| Free | ₩0 | 일 10회 질문, 서재 50개 노트 |
| Pro Monthly | ₩9,900/월 | 무제한 |
| Pro Annual | ₩79,000/년 (33% 할인) | 무제한 + Deep Debate |
| 학생 인증 | ₩4,900/월 | 무제한 (학생증 인증) |

### 결제
- iOS: StoreKit (Apple IAP 30%)
- Android: Play Billing
- RevenueCat으로 통합 관리

### Acceptance Criteria
- [ ] 11회째 질문 시 업그레이드 모달
- [ ] 결제 후 즉시 한도 해제
- [ ] 환불 정책: 7일 무조건 환불
- [ ] 학생 인증: 1년 유효, 학생증 사진 검수

---

## F-10: Deep Debate 모드

### 개요
4개 AI 에이전트(원고측·피고측·판사·해설자)가 토론하며 균형 잡힌 답변을 생성한다. 복잡한 사안에 적합.

### User Flow
1. 채팅 화면 좌상단 토글: "일반 / Deep Debate"
2. Deep Debate 선택 → 질문 입력
3. 4 에이전트 순차 응답 표시 (라운드 1~3)
4. 최종 합의/요약 표시
5. 비용: Pro 전용 (월 50회 한도)

### Architecture
- **Framework**: CrewAI 또는 LangGraph
- **Rounds**: 3 (조정 가능)
- **Cost**: 일반 채팅 대비 약 5-8배 토큰 사용

### 전문가 에이전트 프로필 (4 Agents)

#### 🟦 Agent 1 — 원고측 변호인 (Plaintiff Counsel)
- **역할**: 청구인/원고/피해자의 입장에서 가장 강한 논리를 구성
- **페르소나**: 적극적·공격적, "권리 침해" 프레이밍 우선
- **주 프롬프트 전략**: "이 사안에서 원고가 승소하기 위한 최선의 법적 논거는?"
- **인용 우선순위**: 권리 보호 판례, 헌법상 기본권, 손해배상 법리
- **컬러 코드**: `#3B82F6` (cyan blue)
- **아이콘**: ⚖️ (저울 좌측)

#### 🟥 Agent 2 — 피고측 변호인 (Defendant Counsel)
- **역할**: 피청구인/피고의 입장에서 방어 논리와 반박을 구성
- **페르소나**: 신중·분석적, "요건 미충족" 프레이밍 우선
- **주 프롬프트 전략**: "원고측 주장의 법적 약점과 반대 해석은?"
- **인용 우선순위**: 면책 사유, 항변권, 절차적 하자 판례
- **컬러 코드**: `#EF4444` (red)
- **아이콘**: 🛡️ (방패)

#### 🟨 Agent 3 — 재판관 (Judge / Adjudicator)
- **역할**: 양측 논리를 비교·평가하고 균형 잡힌 판단을 제시
- **페르소나**: 중립·권위, 판례 일관성과 법리 정확성 우선
- **주 프롬프트 전략**: "양측 논거를 검토했을 때, 대법원 판례 흐름상 어떤 결론이 합리적인가?"
- **인용 우선순위**: 대법원 전원합의체 판결, 헌법재판소 결정, 학설 통설
- **컬러 코드**: `#FBBF24` (amber)
- **아이콘**: 👨‍⚖️ (판사)

#### 🟪 Agent 4 — 해설자 (Narrator / Educator)
- **역할**: 토론 전체를 학습자가 이해할 수 있도록 요약·해설
- **페르소나**: 친절·교육적, 법학 입문자 눈높이
- **주 프롬프트 전략**: "위 토론의 핵심 쟁점과 학습 포인트를 정리하면?"
- **출력 형식**: 핵심 쟁점 3줄 → 양측 논거 비교표 → 결론 → 추가 학습 자료
- **컬러 코드**: `#A855F7` (violet — 브랜드 컬러)
- **아이콘**: 📚 (책)

### 토론 라운드 구조

| Round | 주체 | 행동 |
|-------|------|------|
| 0 | Narrator | 사안 정리 및 쟁점 제시 |
| 1 | Plaintiff → Defendant | 각자 1차 논거 제시 |
| 2 | Plaintiff → Defendant | 상대방 논거에 대한 반박 |
| 3 | Judge | 양측 논거 평가 + 잠정 결론 |
| Final | Narrator | 학습용 요약 + 출처 정리 |

### Inter-Agent Protocol
- **공유 컨텍스트**: 사안 텍스트, 검색된 조문/판례 (RAG 결과)
- **메시지 형식**: `{ agent_id, round, content, citations[] }`
- **비용 절감**: Plaintiff/Defendant는 Sonnet, Judge/Narrator는 Opus

### Acceptance Criteria
- [ ] 4 에이전트 응답이 시각적으로 구분 (색상/아이콘)
- [ ] 라운드별 토글 (접기/펼치기)
- [ ] 최종 답변에 출처 필수
- [ ] 응답 시간 ≤ 30초

---

## 데이터 모델

### Core Entities
```ts
User { id, email, name, plan, created_at, ... }
Conversation { id, user_id, title, mode: "normal" | "debate", created_at }
Message { id, conversation_id, role, content, citations, created_at }
Citation { type: "statute" | "case", source_id, snippet, url }
Statute { id, code, article_no, title, text, related_cases[] }
Case { id, case_no, court, decided_at, summary, full_text }
Note { id, user_id, message_id, subject, topic, tags[] }
Subscription { user_id, plan, started_at, expires_at, provider }
```

### Relations
- User 1—N Conversation 1—N Message
- Message N—N Citation (Statute or Case)
- Note N—1 User, Note 1—1 Message

---

## API 엔드포인트 (REST + SSE)

### Auth
```
POST /auth/signup
POST /auth/login
POST /auth/refresh
POST /auth/logout
DELETE /auth/account
```

### Chat
```
POST /chat/conversations              # 새 대화 시작
GET  /chat/conversations              # 대화 목록
GET  /chat/conversations/:id          # 대화 상세
POST /chat/conversations/:id/messages # 메시지 전송 (SSE 스트리밍)
DELETE /chat/conversations/:id
```

### Search
```
GET /search/statutes?q=&code=&article=
GET /search/cases?q=&case_no=
GET /statutes/:id
GET /cases/:id
```

### Library (Notes)
```
POST /notes                # 노트 저장
GET  /notes                # 폴더 트리
GET  /notes/:id
PATCH /notes/:id
DELETE /notes/:id
GET  /notes/export?format=anki|pdf
```

### Subscription
```
POST /billing/subscribe
GET  /billing/status
POST /billing/cancel
POST /billing/webhook    # RevenueCat
```

---

## 비기능 요구사항

| Category | 요구사항 |
|----------|----------|
| 성능 | 첫 토큰 ≤ 2초, 검색 ≤ 300ms |
| 가용성 | 99.5% (월 다운타임 ≤ 3.6h) |
| 보안 | OWASP Top 10 준수, JWT, HTTPS only |
| 개인정보 | GDPR + 한국 개인정보보호법 |
| 접근성 | iOS VoiceOver, Android TalkBack |
| 국제화 | 한국어 only (V1) |
| 디바이스 | iOS 15+, Android 9+ |
