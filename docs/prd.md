# LAW.OS — Product Requirements Document (PRD)

> **Version**: 1.0 (Draft)
> **Last Updated**: 2026-04-15
> **Owner**: LAW.OS inc.
> **Status**: Pre-development

---

## 🎨 디자인 참조 필수 (READ FIRST)

> **이 문서를 읽는 모든 개발자/디자이너/기획자는 작업 시작 전에 반드시 Stitch 디자인 시안을 확인해야 합니다.**
> 텍스트 스펙만으로는 UX 의도와 시각적 톤을 파악할 수 없습니다.

| 프로젝트 | Stitch ID | 화면 수 | 용도 |
|---------|-----------|:------:|------|
| 모바일 앱 + 관리자 | `7657386961511176864` | 18 | 앱 전체 IA, 모달, 설정, 어드민 |
| 랜딩 페이지 (desktop/mobile/tablet/OG) | `5047194537981448179` | 4 | 마케팅 사이트 |

**참조 방법**:
```bash
# Stitch MCP로 스크린 목록 조회
mcp__stitch__list_screens project_id=7657386961511176864

# 특정 스크린 상세 확인
mcp__stitch__get_screen project_id=7657386961511176864 screen_id=<id>
```

또는 `landing-page/public/screens/active-chat-stitch.png` 등 다운로드된 시안을 참조하세요.

**디자인 시스템**: Dark Academia Pro / Sovereign Terminal — `landing-page/tailwind.config.ts`의 토큰을 단일 진실 공급원(SSOT)으로 사용합니다.

---

## 1. Executive Summary

**LAW.OS**는 법학도(로스쿨생 · 변시 수험생 · 법학과 학부생)를 위한 **모바일 AI 법률 학습 튜터**다. 통학길·카페·도서관 등 어디서나 민법/형법/헌법 전체 조문과 2,341개 판례를 대화형으로 탐색하고, 출처가 검증된 답변을 즉시 받을 수 있다.

**One-liner**: *"법률 공부, 주머니 속에서."*

---

## 2. Vision & Goals

### 2.1 Product Vision
> 법학도가 종이책·PDF·구글링을 오가며 낭비하던 **하루 평균 47분**을, 대화 한 번으로 단축한다.

### 2.2 Business Goals (Year 1)

| 지표 | 목표 |
|------|------|
| MAU | 5,000명 |
| 유료 전환율 | 8% |
| MRR | ₩12,000,000 |
| Citation Accuracy | ≥ 98% |
| 평균 세션 시간 | ≥ 7분 |

### 2.3 Non-Goals
- ❌ 변호사 대상 실무 도구 (별도 제품)
- ❌ 법률 상담 서비스 (규제 리스크)
- ❌ 자동 서면 작성기 (Year 2 이후)

---

## 3. Target Users

### Persona 1 — 로스쿨 1년차 "준호" (24세)
- **상황**: 민법 총칙 통째로 외워야 하는데 판례 검색이 너무 느림
- **Pain**: 책·노트·랩탑 사이를 오가며 흐름이 끊김
- **Goal**: 통학버스 30분 동안 어제 강의 복습
- **Quote**: *"교수가 던진 판례 번호 하나로 5분 동안 구글링하던 시간이 아까웠다"*

### Persona 2 — 변시 D-180 "지영" (27세)
- **상황**: 객관식 5,000문제 중 약점 영역 반복 학습 필요
- **Pain**: 오답 정리 노트가 흩어져 있음
- **Goal**: 약점 조문/판례를 자동으로 큐레이션 받기
- **Quote**: *"내 약점만 모아주는 AI가 있으면 좋겠다"*

### Persona 3 — 법학과 학부 4학년 "서연" (22세)
- **상황**: 졸업 논문 작성 + 변시 준비 병행
- **Pain**: 판례 인용 형식 일일이 확인
- **Goal**: 인용 가능한 출처를 한 번에 받기
- **Quote**: *"각주 다는 시간이 논문 쓰는 시간보다 길다"*

---

## 4. Problem Statement

### Current State (As-Is)
1. 법학도는 **국가법령정보센터** 웹사이트와 종이책을 병행 사용
2. 판례 검색 시 **대법원 종합법률정보**에서 키워드 → 결과 → 클릭 → 읽기 (평균 4분/건)
3. ChatGPT는 **출처를 만들어내거나(hallucination) 한국 법령에 약함**
4. 모바일에서 법률 학습할 도구 부재

### Desired State (To-Be)
1. **단일 대화 인터페이스**로 조문·판례·해설 통합
2. **모든 답변에 출처 필수** (조문 번호 + 판례 사건번호)
3. **모바일 우선** — 통학길·자투리 시간 활용
4. **개인화 서재** 자동 구축

---

## 5. Core Features (Priority)

### P0 — MVP (Launch 필수)

| ID | 기능 | 설명 |
|----|------|------|
| F-01 | AI 법률 채팅 | 자연어 질문 → RAG 기반 답변 + 출처 |
| F-02 | 조문 검색 | 민법/형법/헌법 전체 조문 검색 + 즐겨찾기 |
| F-03 | 판례 검색 | 사건번호/키워드 검색 + 핵심 요지 |
| F-04 | 자동 서재 | 질문 자동 분류 → 과목별/주제별 정리 |
| F-05 | 회원가입/로그인 | 이메일 + 소셜 (Apple, Google, Kakao) |
| F-06 | 무료/Pro 플랜 | 무료: 일 10회, Pro: 무제한 (월 ₩9,900) |

### P1 — V1.1 (Launch + 30일)

| ID | 기능 | 설명 |
|----|------|------|
| F-07 | 오프라인 캐시 | 즐겨찾기 조문 오프라인 열람 |
| F-08 | Anki/PDF 내보내기 | 서재 콘텐츠 외부 도구 연동 |
| F-09 | 다크모드 | 시스템 설정 연동 |

### P2 — V1.2+ (Multi-Agent Debate)

| ID | 기능 | 설명 |
|----|------|------|
| F-10 | Deep Debate 모드 | 4개 AI 에이전트 토론 → 균형 잡힌 답변 |
| F-11 | 학습 통계 대시보드 | 약점 영역 시각화 |
| F-12 | 모의고사 모드 | 변시 객관식 자동 출제 |

---

## 6. Success Metrics

### North Star Metric
**Weekly Active Learners (WAL)** — 주 3회 이상 7분 이상 사용한 유저 수

### Supporting Metrics

| Category | Metric | Target |
|----------|--------|--------|
| Acquisition | App Store/Play 다운로드 | 10K (Year 1) |
| Activation | 가입 → 첫 질문 전환율 | 70% |
| Retention | D7 retention | 40% |
| Revenue | Free → Pro 전환율 | 8% |
| Quality | 답변 만족도 (👍 비율) | ≥ 85% |
| Quality | Citation accuracy (수동 감사) | ≥ 98% |

---

## 7. Constraints & Assumptions

### Constraints
- **예산**: ₩15,000,000 (개발) + ₩615/month (인프라)
- **기간**: 90일 MVP
- **팀**: 풀스택 1명 + 디자이너 0.5명 (외주)
- **법적**: 변호사법 제109조 — "법률 상담"이 아닌 "학습 도구"로 명확히 포지셔닝

### Assumptions
- 사용자는 iOS 15+ 또는 Android 9+ 기기 보유
- 한국어 LLM 응답 품질이 GPT-4 Turbo + Claude Opus 수준이면 충분
- 법령 데이터는 국가법령정보센터 OpenAPI로 무료 수집 가능
- Year 1까지는 API 기반 RAG로 충분, 파인튜닝은 Year 2+

---

## 8. Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| LLM hallucination → 잘못된 법률 정보 | 🔴 High | RAG + 출처 필수 + "학습 참고용" 면책 |
| 변호사법 위반 논란 | 🔴 High | 법률 자문 받고 ToS 명시 |
| 판례 데이터 저작권 | 🟡 Med | 공개 데이터만 사용, 요약은 자체 생성 |
| API 비용 폭증 | 🟡 Med | 캐싱 + 사용량 한도 + Pro 플랜 마진 확보 |

---

## 9. Out of Scope (V1)

- 웹 버전 (랜딩 페이지 외)
- 변호사용 실무 도구
- 법률 문서 자동 작성
- 영문 법률 (US/UK Law)
- 학원 강의 콘텐츠 통합
