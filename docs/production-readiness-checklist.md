# Law-OS Production Readiness Checklist

> **현재 위치**: MVP (internal beta) — UX/UI 일관성 78pt+
> **목표 위치**: Production GA (App Store / Play Store 공개 출시)
> **예상 소요**: 4-8주 (전담 인원 1-2명 가정, 변호사 검토 포함)
> **작성일**: 2026-04-20

## 우선순위 표기

- 🔴 **P0 (Blocker)**: 출시 전 반드시 완료. 누락 시 법적/보안적 위험 또는 핵심 기능 미작동.
- 🟡 **P1 (High)**: 출시 전 강력 권장. 누락 시 사용자 이탈 또는 운영 부담 급증.
- 🟢 **P2 (Medium)**: 출시 후 첫 30일 내 완료. 점진적 개선 가능.
- ⚪ **P3 (Nice-to-have)**: 1.x 마이너 릴리즈 단계.

노력 추정: **S** (1-3일), **M** (1주), **L** (2-4주), **XL** (1개월+)

---

## 1. 법률 도메인 컴플라이언스 (한국 법률 앱 특수)

| 항목 | 우선순위 | 노력 | 의존성 | 비고 |
|------|----------|------|--------|------|
| 변호사법 §109 검토 (비변호사 법률 자문 금지) | 🔴 P0 | M | 변호사 자문 | 가장 큰 법적 리스크. AI 응답이 "구체적 사건 자문"으로 해석될 여지 차단 |
| 모든 AI 응답 화면에 "법률 자문 아님" 디스클레이머 고정 노출 | 🔴 P0 | S | 위 검토 결과 | 채팅 화면 하단 sticky banner 또는 첫 응답 전 acknowledgment |
| 이용약관(terms) 변호사 검토 | 🔴 P0 | M | 외부 변호사 위촉 | "이 서비스는 학습 보조 도구이며 법률 자문이 아닙니다" 명시 |
| 개인정보처리방침 변호사 검토 (PIPA 준수) | 🔴 P0 | M | 외부 변호사 위촉 | Supabase 데이터 저장 위치, 제3자 제공, 보유기간 명시 |
| AI 응답 정확성 검증 프로세스 | 🔴 P0 | L | 법률 전문가 샘플링 | 100건 샘플 → 전문가 평가 → 정확도 metric (현재 미측정) |
| 법령 자동 업데이트 절차 (국가법령정보센터 동기화) | 🟡 P1 | L | 백엔드 cron | 법 개정 시 RAG 인덱스 재생성. 현재 수동 |
| 판례 출처 표기 의무 (저작권법 §28 인용) | 🟡 P1 | S | 데이터 모델 검토 | 응답에 사건번호/선고일/법원 명시 |
| 미성년자 차단 또는 보호자 동의 흐름 | 🟢 P2 | M | 정책 결정 | 14세 미만 회원가입 차단 (PIPA §22의2) |

---

## 2. 보안 (Security)

| 항목 | 우선순위 | 노력 | 의존성 | 비고 |
|------|----------|------|--------|------|
| Supabase RLS (Row Level Security) 정책 전수 감사 | 🔴 P0 | M | - | conversations / messages / bookmarks / notes / study_activities 모든 테이블 |
| 인증 토큰 저장소 보안 (SecureStore 사용 확인) | 🔴 P0 | S | - | AsyncStorage에 JWT 저장 시 즉시 SecureStore 이전 |
| API 엔드포인트 rate limiting | 🔴 P0 | M | Supabase Edge Functions | 채팅/검색 봇 어뷰즈 방지 |
| OWASP Mobile Top 10 점검 | 🔴 P0 | M | 보안 감사 도구 | M1 misuse, M2 insecure data, M5 insufficient cryptography 우선 |
| 의존성 취약점 스캔 (`npm audit`, Snyk) | 🔴 P0 | S | - | 이미 발견된 취약점 0건 가정, CI에 통합 |
| Supabase Service Role 키 노출 점검 | 🔴 P0 | S | - | 클라이언트 번들에 절대 포함 금지 |
| HTTPS 인증서 pinning | 🟡 P1 | M | - | MITM 공격 방어. expo-ssl-pinning 또는 fetch 래퍼 |
| 로그아웃 시 모든 세션 토큰 invalidate | 🟡 P1 | S | - | refresh token 서버 측 폐기 |
| 비밀번호 정책 강화 (최소 길이/복잡도) | 🟡 P1 | S | - | Supabase Auth 설정 |
| 2FA / 소셜 로그인 옵션 | 🟢 P2 | M | - | 카카오/네이버 로그인 |

---

## 3. 관찰성 (Observability)

| 항목 | 우선순위 | 노력 | 의존성 | 비고 |
|------|----------|------|--------|------|
| Sentry (또는 동급) 에러 모니터링 통합 | 🔴 P0 | S | Sentry 계정 | 프로덕션 크래시/예외 추적 필수 |
| 크래시 리포팅 (Expo + native) | 🔴 P0 | S | Sentry | iOS/Android 네이티브 크래시 |
| 사용자 분석 (Mixpanel / Amplitude / PostHog) | 🟡 P1 | M | 분석 도구 | 핵심 funnel: 회원가입 → 첫 채팅 → 7일 retention |
| API 레이턴시 모니터링 | 🟡 P1 | M | Supabase Logs / DataDog | p50/p95/p99 응답 시간 |
| AI 응답 품질 로깅 (사용자 피드백) | 🟡 P1 | M | 데이터 모델 추가 | 👍/👎 수집 → 정확도 개선 |
| 스트럭처드 로깅 (winston/pino 동급) | 🟢 P2 | S | - | 백엔드 로그 일관성 |
| 비용 모니터링 (Anthropic API / Supabase) | 🟢 P2 | S | 청구 알림 | 월 예산 초과 알림 |

---

## 4. 알림 / 리텐션

| 항목 | 우선순위 | 노력 | 의존성 | 비고 |
|------|----------|------|--------|------|
| 푸시 알림 (Expo Notifications) | 🟡 P1 | M | APNs/FCM 계정 | 학습 streak 유지, 새 답변 알림 |
| 이메일 알림 (회원가입 인증, 비밀번호 재설정) | 🔴 P0 | S | Supabase Auth | 이미 Supabase 기본 제공 — 검토만 필요 |
| 알림 설정 UI (현재 placeholder) | 🟡 P1 | S | 푸시 알림 통합 후 | profile/notifications 화면 실제 구현 |
| 학습 streak 끊김 방지 알림 | 🟢 P2 | S | 푸시 알림 | "오늘 학습하면 N일 연속!" |

---

## 5. 데이터 / 백엔드 인프라

| 항목 | 우선순위 | 노력 | 의존성 | 비고 |
|------|----------|------|--------|------|
| Supabase 프로덕션 프로젝트 분리 | 🔴 P0 | S | - | dev/staging/prod 환경 분리 |
| 데이터베이스 백업 정책 | 🔴 P0 | S | Supabase 유료 플랜 | Point-in-time recovery |
| 마이그레이션 절차 문서화 | 🔴 P0 | S | - | 스키마 변경 SOP |
| `study_activities` 이벤트 로깅 구현 | 🟡 P1 | M | - | 현재 streak 데이터 source 미작동. 채팅/검색/북마크 시 자동 insert |
| RAG 벡터 DB 백업 / 재생성 절차 | 🟡 P1 | M | Pinecone/pgvector | 법령 업데이트 시 재인덱싱 |
| Supabase 사용량 한도 모니터링 | 🟡 P1 | S | - | 무료 플랜 한도 초과 방지 |

---

## 6. 플랫폼 / 배포

| 항목 | 우선순위 | 노력 | 의존성 | 비고 |
|------|----------|------|--------|------|
| iOS App Store 메타데이터 (스크린샷, 설명, 카테고리) | 🔴 P0 | M | 디자인 리소스 | 6.7"/6.5"/5.5" 기기별 스크린샷 5장 |
| Apple Developer 계정 / App ID / 인증서 | 🔴 P0 | S | $99/년 | 이미 보유 시 스킵 |
| TestFlight 베타 배포 | 🔴 P0 | S | Apple Dev 계정 | 외부 검토자 100명까지 |
| Apple App Review 대응 (반려 사유 사전 점검) | 🔴 P0 | M | - | AI/법률 앱은 review 가이드라인 5.1 (법률 정보 정확성) 검토 |
| Android 빌드 검증 (현재 미실시) | 🔴 P0 | M | EAS Build | Play Store 출시 시 필수 |
| Google Play Console 계정 + 메타데이터 | 🔴 P0 | M | $25 1회 | 안드로이드 출시 시 |
| 다중 iOS 기기 테스트 (iPhone SE, 14, 15 Pro Max) | 🟡 P1 | M | 실기기 또는 Simulator | safe area / notch / dynamic island |
| 다중 Android 기기 테스트 (저사양/고해상도) | 🟡 P1 | M | 실기기 | 갤럭시 / 픽셀 |
| EAS Update (OTA 업데이트) 채널 설정 | 🟡 P1 | S | EAS 계정 | 핫픽스용 |
| 앱 아이콘 / 스플래시 스크린 최종본 | 🔴 P0 | S | 디자인 | 1024×1024 + 다크/라이트 |

---

## 7. CI/CD

| 항목 | 우선순위 | 노력 | 의존성 | 비고 |
|------|----------|------|--------|------|
| GitHub Actions: lint + typecheck on PR | 🔴 P0 | S | - | 기본 안전망 |
| EAS Build 자동화 (main → preview, tag → production) | 🟡 P1 | M | EAS | 수동 빌드 부담 제거 |
| 의존성 취약점 자동 스캔 (Dependabot) | 🟡 P1 | S | - | GitHub 무료 |
| 환경 변수 검증 스크립트 | 🟢 P2 | S | - | 빌드 전 .env 누락 방지 |

---

## 8. 테스트

| 항목 | 우선순위 | 노력 | 의존성 | 비고 |
|------|----------|------|--------|------|
| 핵심 사용자 흐름 E2E 테스트 (회원가입 → 첫 채팅 → 북마크) | 🔴 P0 | L | Detox 또는 Maestro | 회귀 방지 |
| 인증 플로우 단위 테스트 | 🟡 P1 | M | Jest | login/logout/refresh/forgot password |
| Supabase RLS 정책 테스트 | 🟡 P1 | M | Supabase test helpers | 다른 사용자 데이터 접근 차단 검증 |
| AI 응답 회귀 테스트 (snapshot) | 🟡 P1 | M | 골든 데이터셋 100건 | 모델 변경 시 quality drift 감지 |
| 접근성 테스트 (VoiceOver / TalkBack) | 🟡 P1 | M | 실기기 | a11y 라벨 검증 |

---

## 9. AI 품질 / 콘텐츠

| 항목 | 우선순위 | 노력 | 의존성 | 비고 |
|------|----------|------|--------|------|
| AI 응답 100건 변호사 샘플링 평가 | 🔴 P0 | L | 외부 변호사 1명 ×40h | 정확도 baseline 측정 — 80%+ 미달 시 출시 보류 |
| Hallucination 감지 메커니즘 | 🔴 P0 | L | RAG 신뢰도 점수 | 인용 없는 응답에 경고 배지 |
| 모델 A/B 벤치마크 (Claude vs GPT vs Gemini) | 🟢 P2 | M | 평가 프레임워크 | 비용/품질 trade-off |
| 사용자 피드백 → 재학습 루프 | 🟢 P2 | XL | 데이터 파이프라인 | 👎 답변 → fine-tuning candidate |
| 법령 인용 정확성 검증 (자동) | 🟡 P1 | M | 정규식 + DB 검증 | "민법 §103" 같은 인용이 실제 존재하는 조항인지 |

---

## 10. 컴플라이언스 (일반)

| 항목 | 우선순위 | 노력 | 의존성 | 비고 |
|------|----------|------|--------|------|
| 개인정보 수집 동의 UI (회원가입 시) | 🔴 P0 | S | 약관 확정 후 | 체크박스 + 약관 전문 링크 |
| 회원 탈퇴 시 데이터 삭제 절차 | 🔴 P0 | M | Supabase | PIPA §21 (개인정보 파기) |
| 개인정보 처리 위탁 공시 (Anthropic, Supabase) | 🔴 P0 | S | 약관에 포함 | 제3자 제공 명시 |
| 데이터 다운로드 요청 처리 (PIPA §35) | 🟡 P1 | M | API + UI | 사용자 요청 시 본인 데이터 export |
| GDPR 대응 (EU 사용자 차단 또는 준수) | 🟢 P2 | L | 정책 결정 | 한국 출시면 차단으로 단순화 가능 |
| Apple ATT (App Tracking Transparency) | 🟡 P1 | S | 분석 도구 통합 시 | 분석 SDK 사용 시 필수 |

---

## 11. 이번 세션에서 미완성된 in-app 항목

| 항목 | 우선순위 | 노력 | 비고 |
|------|----------|------|------|
| `study_activities` 자동 이벤트 수집기 구현 | 🟡 P1 | M | StreakCard가 보이지만 데이터 source 없음 → 항상 0 |
| 탭 badge 실시간 refresh (현재 mount-only) | 🟢 P2 | S | 새 채팅 생성 시 즉시 반영되는 store/이벤트 |
| Follow-up 질문 칩 동적 생성 (현재 정적) | 🟢 P2 | M | LLM이 직전 응답 기반 3-4개 제안 |
| `useOptimisticToggle` 채팅 archive/star에 적용 | 🟢 P2 | S | 추출만 하고 호출 0건 |
| Profile screen 통계 정확성 (count 쿼리 전환) | 🟢 P2 | S | 현재 limit:1 페치 + length로 부정확 |
| Search 탭 필터 결과 비어있을 때 EmptyState 메시지 차별화 | ⚪ P3 | S | "검색어 없음" vs "결과 없음" |

---

## 출시 전 최종 체크포인트

다음 모두 ✅ 되어야 출시 가능:

- [ ] 외부 변호사 약관/방침 검토 완료 + 의견서 수령
- [ ] AI 응답 100건 샘플 정확도 ≥ 80%
- [ ] Sentry 통합 + 크래시 리포팅 동작 확인
- [ ] Supabase RLS 감사 완료 + 페네트레이션 테스트 통과
- [ ] iOS TestFlight 외부 베타 14일 + 주요 버그 0건
- [ ] Android 빌드 + 실기기 테스트 5종 이상
- [ ] App Store / Play Store 메타데이터 + 스크린샷 + 정책 페이지 URL 준비
- [ ] 법률 자문 아님 디스클레이머 모든 AI 응답 화면에 노출
- [ ] 개인정보 처리방침 + 이용약관 앱 내 접근 가능
- [ ] 회원 탈퇴 → 데이터 완전 삭제 동작 검증

---

## 추천 4-8주 로드맵

**Week 1-2 (법률 + 보안 기반)**:
- 변호사 위촉 + 약관/방침 검토 의뢰 (병렬 진행)
- Sentry 통합, RLS 감사, SecureStore 마이그레이션
- 디스클레이머 UI 추가

**Week 3-4 (인프라 + 테스트)**:
- Supabase 프로덕션 분리 + 백업 설정
- E2E 핵심 흐름 테스트 작성
- `study_activities` 수집기 구현
- Android 빌드 + 5종 기기 테스트

**Week 5-6 (AI 품질 + 베타)**:
- 변호사 100건 샘플 평가 진행
- Hallucination 경고 UI
- TestFlight 외부 베타 시작

**Week 7-8 (출시 준비)**:
- App Store / Play Store 메타데이터 + 스크린샷
- 베타 피드백 반영
- 최종 회귀 테스트 + 출시

---

### 검증 수준

| 핵심 주장 | 수준 | 근거 |
|----------|------|------|
| 변호사법 §109 리스크 존재 | [추정] | 일반 법률 지식, 직접 변호사 자문 받지 않음 |
| 현재 MVP 수준 (내부 베타) | [검증됨] | 이번 세션에서 UX만 작업, 보안/관찰성/법률 검토 미진행 확인 |
| `study_activities` 데이터 source 미작동 | [추정] | `lib/stats.ts`는 읽기만, 쓰기 코드 grep 안 함 — 검증 필요 |
| Sentry 등 모니터링 미통합 | [추정] | 코드베이스에서 sentry import 검색 안 함 — 검증 필요 |
| 4-8주 추정 | [추정] | 일반적 모바일 앱 출시 기준, 변호사 검토 lead time 가변 |
| Apple Review 가이드라인 5.1 적용 | [추정] | 법률/의료 앱 일반 정책, 정확한 조항 재확인 필요 |
