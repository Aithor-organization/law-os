# LAW.OS — Design-First Workflow (🔴 MUST READ)

> **Version**: 1.0
> **Priority**: 🔴 Critical — 이 문서의 규칙은 모든 구현 작업에 예외 없이 적용됩니다.
> **Last Updated**: 2026-04-15

---

## 철칙 (The Hard Rules)

### 🔴 Rule 1 — 디자인 먼저, 로직 나중에 (Design-First)
모든 화면은 **순수 UI 구현 → 사용자 컨펌 → 로직 연결** 순서로 작업한다.

```
❌ 금지: 화면 UI와 API 호출을 동시에 구현
✅ 필수: 1) UI를 정적(mock 데이터)으로 완성 → 2) 컨펌 → 3) 로직 연결
```

**이유**: 로직이 섞이면 디자인 수정 비용이 폭증한다. 픽셀을 먼저 고정한다.

---

### 🔴 Rule 2 — Stitch 디자인과 무조건 일치 (Stitch Parity)
구현된 화면은 **Stitch 시안과 픽셀 단위로 동일**해야 한다.

```
Stitch Project IDs:
  모바일 앱 + 관리자: 7657386961511176864
  랜딩 페이지: 5047194537981448179
```

#### 허용되는 차이 (Allowed Deltas)
- **반응형 대응**: 시안에 없는 태블릿/소형 폰 브레이크포인트
- **접근성 보강**: 최소 터치 타겟 44×44, 최소 대비 4.5:1 (시안이 미달 시 보정)
- **플랫폼 관습**: iOS/Android native 컴포넌트의 기본 동작 (예: iOS 백 제스처)

#### 금지되는 차이 (Forbidden Deltas)
- ❌ 색상 변경 (디자인 토큰 외 색 사용 금지)
- ❌ 간격/패딩 임의 조정
- ❌ 폰트/크기/무게 변경
- ❌ 레이아웃 재구성
- ❌ "더 나아 보여서" 식의 즉흥적 수정
- ❌ 컴포넌트 추가/제거
- ❌ 아이콘 교체

**즉흥적 개선은 디자인 부채다.** 시안과 다르게 만들고 싶으면 → Stitch에서 시안을 먼저 수정 → 그 다음 코드를 맞춘다.

---

### 🔴 Rule 3 — 사용자 컨펌 게이트 (Confirmation Gate)
각 화면의 UI 구현이 끝나면 **반드시 사용자에게 시각적으로 확인**받아야 한다.

```
Phase A: UI 구현 완료
  ↓
Phase B: 시각적 증거 제시 (아래 중 하나 이상)
  • Expo 웹 프리뷰 URL
  • Storybook 스토리
  • 실기기 스크린샷 (EAS Build QR)
  • Playwright/Maestro 스냅샷
  ↓
Phase C: 사용자 컨펌 ("OK" / "수정 필요")
  ↓ (컨펌 받은 후에만)
Phase D: 로직 연결 / API 호출 / 상태 관리
```

**컨펌 없이 Phase D로 넘어가면 즉시 작업 중단**.

---

## 구현 순서 (Implementation Order)

### Step 0 — Stitch 시안 확인 (작업 시작 전)
```bash
# 해당 화면의 Stitch 스크린 ID 확인
mcp__stitch__list_screens project_id=7657386961511176864

# 스크린 상세 + 디자인 토큰 확인
mcp__stitch__get_screen project_id=7657386961511176864 screen_id=<id>
```

### Step 1 — 디자인 토큰 동기화
`packages/shared-types/design-tokens.ts`에 Stitch의 색/폰트/간격이 모두 정의되어 있는지 확인.
누락된 토큰이 있으면 **먼저 토큰을 추가**하고 코드에서 참조한다. 하드코딩 금지.

```ts
// ❌ 금지
<View style={{ backgroundColor: "#A855F7", padding: 16 }} />

// ✅ 필수
<View className="bg-violet p-4" />
```

### Step 2 — 정적 UI 구현
- Mock 데이터 사용 (props로 주입)
- 로딩/빈/에러 상태도 **모두** 정적으로 구현
- 애니메이션/트랜지션 포함

### Step 3 — Pixel Parity 검증
구현 화면과 Stitch 스크린샷을 **나란히 비교**:
```
tools/compare-to-stitch.ts <screen_id> <component_path>
```
- 색상 hex 비교
- 주요 요소 bounding box 비교
- 폰트 metric 비교

불일치 발견 시 **코드를 수정**한다 (Stitch를 수정하는 건 디자이너 승인 필요).

### Step 4 — 사용자 컨펌 요청
```markdown
## 🎨 디자인 구현 컨펌 요청

**화면**: [Screen Name] (Stitch ID: xxx)
**경로**: apps/mobile/app/(tabs)/chat/[id].tsx
**상태**: ✅ UI 구현 완료 (mock 데이터)

### 확인 방법
1. Expo 웹: http://localhost:8081/chat/demo
2. Storybook: http://localhost:6006/?path=/story/chat--active
3. 스크린샷: [첨부]

### Stitch 대비 차이점
- 없음 (100% 일치)
  또는
- [ ] [차이 항목] — 이유

### 다음 단계
컨펌 받으면 API 연결 + 상태 관리 작업 시작합니다.
```

### Step 5 — 로직 연결 (컨펌 후)
- API 호출 hook 연결
- 상태 관리 (Zustand/TanStack Query)
- 에러 핸들링
- 분석 이벤트 트리거

### Step 6 — E2E 검증
- Maestro 플로우 테스트
- 실기기 확인 (EAS Build)

---

## Stitch → RN 컴포넌트 매핑

Stitch의 디자인 요소는 다음 RN 컴포넌트로 구현한다:

| Stitch 요소 | React Native | 근거 |
|------------|--------------|------|
| Frame (container) | `View` | 기본 컨테이너 |
| Text | `Text` with NativeWind | 타이포그래피 |
| Button | `Pressable` + 커스텀 `<Button>` | 피드백 애니메이션 |
| Input | `TextInput` + 커스텀 `<Input>` | 키보드 관리 |
| Icon | `@expo/vector-icons` 또는 SVG | 벡터 |
| Image | `expo-image` | 캐싱 우수 |
| List | `FlashList` (@shopify/flash-list) | 성능 |
| Modal | `@gorhom/bottom-sheet` or native Modal | 제스처 |
| Gradient | `expo-linear-gradient` | 네이티브 |
| Blur | `expo-blur` | 성능 |

모든 재사용 컴포넌트는 `packages/ui/` 에 단일 구현. 앱/관리자가 공유.

---

## 디자인 시스템 토큰 (SSOT)

**단일 진실 공급원**: `packages/ui/tokens.ts`

```ts
export const tokens = {
  color: {
    bg: "#000000",
    surface: { DEFAULT: "#141418", low: "#0A0A0B", high: "#1C1B1C" },
    fg: "#F4F4F5",
    dim: "#71717A",
    violet: { DEFAULT: "#A855F7", glow: "#DDB7FF", deep: "#400071" },
    cyan: "#06B6D4",
    amber: "#FBBF24",
    danger: "#EF4444",
  },
  radius: {
    none: 0,
    sm: 2,
    DEFAULT: 6,    // Dark Academia Pro: 최대 6px
    full: 9999,
  },
  spacing: {
    0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48,
  },
  fontSize: {
    xs: 10, sm: 12, base: 14, lg: 16, xl: 18, "2xl": 22, "3xl": 28, "4xl": 36, "5xl": 48,
  },
  fontFamily: {
    kr: "Pretendard",
    en: "Inter",
    mono: "JetBrainsMono",
  },
  shadow: {
    glow: {
      shadowColor: "#A855F7",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 24,
      elevation: 8,
    },
  },
};
```

이 파일을 `tailwind.config.ts` (landing-page) 와 `nativewind.config.ts` (mobile) 양쪽에서 import.

---

## 체크리스트 — 화면 PR 머지 전 필수

- [ ] Stitch 시안 ID 명시 (PR description)
- [ ] 정적 UI 완성 (mock 데이터)
- [ ] 로딩/빈/에러 상태 모두 구현
- [ ] 디자인 토큰만 사용 (하드코딩 zero)
- [ ] Pixel parity 검증 스크립트 통과
- [ ] 사용자 컨펌 획득 (PR 코멘트 또는 대화 기록)
- [ ] 로직 연결 작업은 **별도 PR**로 분리
- [ ] 접근성 (터치 타겟, 대비, VoiceOver) 확인
- [ ] 다크모드 (LAW.OS는 다크 기본이므로 해당 없음, 향후 라이트모드 추가 시 필수)

---

## 위반 시 처리

이 문서의 규칙 위반은 **자동 블록**된다:

| 위반 | 자동 차단 |
|------|----------|
| 디자인 토큰 외 색상 하드코딩 | ESLint rule `no-raw-colors` |
| Stitch 확인 없이 화면 구현 | PR 템플릿의 Stitch ID 필수 필드 |
| 컨펌 없이 로직 커밋 | `pre-push` 훅에서 design-only 커밋 분리 확인 |
| 즉흥적 레이아웃 변경 | Pixel parity 스크립트 실패 |

---

## FAQ

**Q: Stitch 시안이 명확하지 않으면?**
A: 추측하지 말고 디자이너에게 확인. 구현을 멈추고 기다린다.

**Q: Stitch에 없는 상태(로딩/에러)는?**
A: 디자인 시스템 토큰을 조합해 만들되, 결과물을 사용자에게 컨펌받는다.

**Q: 반응형 대응은 어떻게?**
A: 디자인 시안은 iPhone 14 기준. 소형 폰/태블릿은 비율 유지 + 간격 조정. 단, **새로운 레이아웃 생성 금지**.

**Q: 애니메이션은 Stitch에 표현되지 않는데?**
A: `design-animations.md` (TODO) 문서에서 별도 정의. 기본값은 `react-native-reanimated` 300ms easeOut.
