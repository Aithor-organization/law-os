# LAW.OS — BYOK + 튜토리얼 + 버그 픽스 계획서

> **작성일**: 2026-05-01
> **상태**: Phase 1 ✅ + Phase 2 ✅ + Phase 3 ✅ (AdMob native SDK는 EAS 재빌드 시점에 활성)

---

## 📋 전체 요구사항 (5건)

사용자가 결정한 사양:

### 1. BYOK (사용자 LLM API Key)
- **Provider**: Gemini, Anthropic, OpenAI, OpenRouter (4종)
  - Gemini: `gemini-3-pro`, `gemini-3-flash`
  - Anthropic: `claude-opus-4-7`, `claude-sonnet-4-6`, `claude-haiku-4-5`
  - OpenAI: `gpt-5.4`, `gpt-5.4-mini`
  - OpenRouter: `https://openrouter.ai/api/v1/models` 동적 fetch (실패 시 텍스트 입력)
- **저장**: 클라이언트 SecureStorage만 (서버 동기화 X)
- **Test Ping**: 각 provider별 minimal API 호출로 키 검증

### 2. Free tier 제한
- **매일 5회** 메시지 전송 (자정 KST 리셋)
- 5회 소진 → BYOK 등록 유도 모달
- 광고 시청 시 +2회 (AdMob 권장, 일일 광고 시청 5회 상한 추천)

### 3. UX
- 화살표 토글 회복 버그 수정 (Phase 1)
- 온보딩 영속성 버그 수정 (Phase 1)
- 5페이지 튜토리얼 + 마지막 BYOK 안내 (Phase 2)
- 설정창에 "튜토리얼 다시 보기" 버튼 (Phase 2)

---

## 🚦 단계 분리 (3 phase)

### 🟢 Phase 1: 빠른 버그 픽스 (현재 진행)

| 작업 | 파일 | 라인 | 위험도 |
|------|------|------|--------|
| 아코디언 화살표 rotation 버그 | `mobile/components/ui/CollapsibleSection.tsx` | 33-50 | LOW |
| 온보딩 영속성 (splash 라우팅) | `mobile/app/splash.tsx` | 18-25 | LOW |
| 온보딩 영속성 (saveOnboarding flag) | `mobile/lib/auth.ts` | 103-122 | LOW |
| 온보딩 skip 버튼 제거 | `mobile/app/(auth)/onboarding.tsx` | 86-88 | LOW |
| Supabase migration | `docs/supabase/016_onboarding_completed.sql` (신규) | — | LOW |

**완료 기준**:
- `npx tsc --noEmit` 통과
- 시뮬레이터에서 아코디언 토글 3회 반복 시 chevron 정상 회전
- 회원가입 → 온보딩 미완료 → 앱 강종 → 재실행 → 온보딩 화면 다시 표시

### 🟡 Phase 2: 튜토리얼 페이지 ✅ 완료 (2026-05-01)
- ✅ 5페이지 슬라이더 (검색 / 인용 / 북마크 / 노트 / BYOK 안내)
- ✅ Reanimated 4 애니메이션 (각 페이지별 entering/sharedValue 시연)
- ✅ 설정창 "// app" 섹션에 "튜토리얼 다시 보기" 버튼
- ✅ `tutorial_completed` 컬럼 사용 + `markTutorialCompleted()` RPC
- ✅ splash → 온보딩 완료 + 튜토리얼 미완료 → /tutorial 자동 라우팅
- 신규 파일: `mobile/app/tutorial/{_layout,index}.tsx` + `pages/{Search,Citation,Bookmark,Notes,Byok}Page.tsx` (모두 ≤116줄)

### 🔴 Phase 3: BYOK + Rate Limit + 광고 ✅ 완료 (2026-05-01)

**확정된 결정** (사용자 답변):
- AdMob (`react-native-google-mobile-ads`) — Phase 3c stub만, native 통합은 EAS 재빌드 시점
- 일일 광고 시청 5회 상한 (= 최대 +10회 보너스)
- OpenRouter 모델 캐시 1시간
- BYOK 키 표시 마스킹 = 앞 4자리

**구현된 컴포넌트**:
- ✅ `docs/supabase/017_rate_limit_byok.sql` — 5개 컬럼 + `consume_free_chat()` + `grant_ad_bonus()` RPC
- ✅ `apps/backend/app/llm/{gemini,anthropic,openai,openrouter,router}.py` — 4 provider 어댑터 + dispatch
- ✅ `apps/backend/app/byok.py` — 헤더 파싱 + RPC gate
- ✅ `apps/backend/app/main.py` — `/chat` X-BYOK-* 헤더 분기 + 429 응답
- ✅ `apps/backend/app/auth.py` — JWT를 RPC로 전달하기 위해 token 보존
- ✅ `apps/backend/app/supabase_rest.py` — `rpc_as_user()` (auth.uid() 컨텍스트 유지)
- ✅ `mobile/lib/byok.ts` — Expo SecureStore 저장소 + `byokHeaders()` + `maskKey()`
- ✅ `mobile/lib/byokTestPing.ts` — 4종 Test Ping + OpenRouter 모델 1시간 캐시
- ✅ `mobile/lib/rewardAd.ts` — AdMob stub (실제 SDK는 admob-integration.md 참조)
- ✅ `mobile/lib/chat.ts` — BYOK 헤더 첨부 + `FreeQuotaExhaustedError` 클래스
- ✅ `mobile/app/profile/api-keys.tsx` + `_byok-pickers.tsx` — 입력 화면 + 분리된 picker
- ✅ `mobile/components/RateLimitModal.tsx` — 5회 소진 시 BYOK 유도 + 광고 시청 +2회
- ✅ `mobile/app/chat/[id].tsx` — `FreeQuotaExhaustedError` 캐치 + RateLimitModal 렌더
- ✅ `mobile/app/profile/settings.tsx` — "// account" 섹션에 "LLM API 키 등록" 항목
- 📄 `docs/admob-integration.md` — native SDK 통합 단계별 가이드

---

## 📂 영향받는 파일 (Phase 1만)

```
docs/supabase/016_onboarding_completed.sql   # 신규
mobile/components/ui/CollapsibleSection.tsx  # 토글 로직 useEffect로 변경
mobile/app/splash.tsx                        # onboarding_completed 체크 추가
mobile/app/(auth)/onboarding.tsx             # skip 버튼 제거 + saveOnboarding 호출 보장
mobile/lib/auth.ts                           # saveOnboarding이 onboarding_completed=true 설정
                                             # Profile 타입에 onboarding_completed 추가
```

---

## ❓ 미해결 항목 (Phase 3에서 결정)

1. AdMob SDK 선택 + ATT 처리
2. 일일 광고 시청 상한 (추천: 5회)
3. OpenRouter 모델 fetch 캐시 (추천: 1시간)
4. BYOK 키 표시 마스킹 (추천: 앞 4자리만)

---

## 🧪 검증 방법 (Phase 1)

```bash
# 빌드 검증
cd mobile && npx tsc --noEmit

# 시뮬레이터 시각 검증
# 1) 회원가입 → consent → onboarding step 1 → 앱 강제 종료 → 재실행 → onboarding step 1 다시 표시
# 2) 프로필 → "내 계정" 탭 (>) → expand (v) → collapse → 다시 (>)로 복원
# 3) 온보딩 완료 → 정상적으로 /(tabs) 진입
```

## 🔄 Migration 적용

```bash
# Supabase Dashboard SQL Editor에서 docs/supabase/016_onboarding_completed.sql 실행
# 또는 supabase CLI:
# supabase db push (만약 supabase 디렉토리에 migration이 동기화되어 있다면)
```
