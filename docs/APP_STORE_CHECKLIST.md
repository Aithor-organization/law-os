# LAW.OS App Store 출시 체크리스트

> **상태**: 코드 80% 준비 / 인프라/콘텐츠 사용자 작업 필요
> **목표 일정**: 2-3주 (full-time 기준)

---

## Phase A — 인프라 정리 (1-2일)

### A-1. ✅ Supabase Migration 적용 (5분, 사용자)
```sql
-- Supabase Dashboard → SQL Editor에서 순서대로 실행
\i docs/supabase/016_onboarding_completed.sql
\i docs/supabase/017_rate_limit_byok.sql
```
**검증**: `select column_name from information_schema.columns where table_name='profiles' and column_name in ('onboarding_completed', 'free_chat_used_today');` → 2 rows 반환

### A-2. ⚠️ Backend Railway 재배포 (5분, 사용자)
현재 Railway에 배포된 코드는 **Phase 3 + 보안 hotfix 미반영** (`/byok/test` endpoint 404 확인됨).

```bash
cd /Users/seohun/Documents/에이전트/infiniteAgent/law-os
git status                      # 36개 변경 확인
# Claude가 commit 정리한 후
git push                        # Railway auto-deploy 트리거
```
**검증**: `curl -X POST https://law-os-production.up.railway.app/byok/test -H "Authorization: Bearer test"` → 401 (auth fail은 OK, 404가 아니어야 함)

### A-3. ✅ 외부 정책 페이지 호스팅 (이미 코드 작성됨, 사용자가 deploy)
- `landing-page/app/privacy/page.tsx` 작성됨
- `landing-page/app/terms/page.tsx` 작성됨
- Vercel auto-deploy 시 → `https://lawos.kr/privacy`, `https://lawos.kr/terms` 자동 활성화
- App Store Connect 등록 시 위 URL 입력

---

## Phase B — 실기기 검증 (1일)

### B-1. EAS preview 빌드 받기 (15분 빌드 + 5분 install)
```bash
cd mobile
eas build --platform ios --profile preview
# 빌드 완료 알림 후 시뮬레이터 또는 등록한 실기기에 설치
```

### B-2. E2E 시나리오 5개 (각 5분)
| # | 시나리오 | 통과 기준 |
|---|---|---|
| 1 | **회원가입** → 인증 메일 → 로그인 | 메인 진입 |
| 2 | **온보딩 3단계** → **튜토리얼 5페이지** → **메인** | 모든 페이지 정상 표시 + skip 안 됨 |
| 3 | **채팅 5회** → RateLimit Modal | 모달 표시 + 카운트 정확 |
| 4 | **BYOK 등록** (Gemini key 1개) → Test Ping → 저장 → 6번째 채팅 | 무제한 작동 |
| 5 | **앱 강종** → 재실행 | onboarding/tutorial 상태 정확히 복원 |

### B-3. 발견된 버그 fix
- 직전 보안 hotfix(5건) 이외 발견되는 모든 버그 → 별도 commit

---

## Phase C — 출시 준비물 (3-5일)

### C-1. AdMob 통합 (사용자가 ID 받은 후 자동)
- `docs/admob-integration.md` 절차
- 사용자가 4개 ID 전달 → Claude 자동 진행

### C-2. Apple Developer 자산 (사용자)
- ✅ Apple Developer Program 가입 (이미 완료)
- App Store Connect 앱 등록:
  - 앱 이름: **LAW.OS**
  - Bundle ID: `kr.lawos.app`
  - Primary 언어: 한국어
  - SKU: `lawos-ios-001` (임의)

### C-3. 앱 아이콘 (사용자)
- 1024×1024 PNG (alpha 없음)
- 현재 `mobile/assets/icon.png` 존재 — 1024 사이즈인지 확인
- 디자인: Dark Academia Pro 테마 — 보라+사이안 글로우 LAW.OS 텍스트 또는 책+법봉 아이콘

### C-4. 스크린샷 (사용자, 5장 권장)
시뮬레이터에서 `Cmd+S` 캡처 후 App Store Connect 업로드:
1. **온보딩** — "어떤 분이신가요?" 화면
2. **검색/채팅** — "민법 제103조 무효" 답변 + 인용 [1][2]
3. **인용 원문** — 조문 본문 패널
4. **북마크/노트** — 학습 통계 streak 그래프
5. **프로필 + BYOK 등록** — 무제한 사용 안내

iPhone 6.5" + 6.7" 두 사이즈 필수 (시뮬레이터 iPhone 15 Pro / Pro Max).

### C-5. App Store 메타데이터
**`docs/app-store-metadata.md` 참조** (별도 파일).

---

## Phase D — 심사 제출 (1주)

### D-1. eas.json submit.production 채우기 (사용자)
```jsonc
"submit": {
  "production": {
    "ios": {
      "appleId": "your-apple-id@email.com",        // ← Apple Developer 계정
      "ascAppId": "1234567890",                     // ← App Store Connect 앱 ID
      "appleTeamId": "ABCD123456"                   // ← Apple Team ID
    }
  }
}
```

### D-2. EAS Production Build + Submit
```bash
eas build --platform ios --profile production
eas submit --platform ios --latest
```

### D-3. App Store Connect에서 빌드 선택 + 제출
- Test Information: 시연 계정 정보 (테스터용 이메일/비밀번호)
- Review Notes:
  ```
  법학 학습 도구입니다. 변호사·법률 상담 서비스가 아닙니다.
  앱 내 모든 답변은 학습 보조용이며, 실제 법적 결정은 전문가와 상담하도록 안내합니다.
  
  데모 계정: demo@lawos.kr / demo1234
  ```
- 제출 → 24~48시간 (요즘 빠름)

### D-4. 거절 시 대응 (확률 높음, 1-2 라운드 예상)
- 가장 흔한 거절: "법률 정보 제공이 면허 필요한 행위" → DisclaimerBanner 강화로 대응
- 5.6 (개발자 ID): 본인 확인 추가 자료 요구 가능
- 4.2.1 (디자인 - 최소 기능): 튜토리얼 + 5개 핵심 기능으로 충분, 부족 시 노트 기능 강조

---

## 현재 차단 항목 (이거 안 풀면 출시 불가)

| 항목 | 차단 정도 | 해결자 | 예상 시간 |
|---|:---:|---|:---:|
| Migration 016/017 미적용 | 🔴 | 사용자 | 5분 |
| Railway 백엔드 hotfix 미배포 | 🔴 | 사용자 (git push) | 5분 + 자동 5분 |
| 실기기 E2E 미검증 | 🔴 | 사용자 + Claude | 1일 |
| App Store Connect 앱 미등록 | 🔴 | 사용자 | 30분 |
| 외부 정책 URL 미배포 | 🟠 | Vercel auto-deploy 후 (5분) | 자동 |
| 앱 아이콘 1024 누락 | 🟠 | 사용자 | 1-2시간 |
| 스크린샷 5장 | 🟠 | 사용자 | 30분 |
| AdMob 통합 (출시 후 보강 가능) | 🟡 | 사용자 + Claude | 별도 |

---

## 다음 한 줄 액션

```
/auto Phase A 단계 자동 진행해줘
```
→ Claude가 commit 정리 (사용자가 git push) + 그 외 자동 가능한 작업 진행
