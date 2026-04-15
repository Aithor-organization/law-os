# LAW.OS Mobile (Expo)

> iOS + Android 크로스플랫폼 앱. Expo SDK 52 + NativeWind + expo-router.
> 디자인 시스템: **Dark Academia Pro** (참조: `docs/design-workflow.md`)

## 🚀 빠른 시작

```bash
cd mobile
npm install
npm run dev
```

- `i` 키 → iOS 시뮬레이터
- `a` 키 → Android 에뮬레이터
- `w` 키 → 웹 브라우저 (픽셀 검증 용도)

## 📂 구조

```
mobile/
├── app/                    # expo-router 파일 기반 라우팅
│   ├── _layout.tsx         # 루트 Stack
│   ├── index.tsx           # → /(auth)/login 리다이렉트
│   └── (auth)/
│       ├── _layout.tsx     # Auth 스택
│       └── login.tsx       # 🎯 현재 작업 중 (정적 UI)
├── components/ui/          # 공통 컴포넌트
│   ├── Button.tsx
│   └── Input.tsx
├── tailwind.config.js      # Dark Academia Pro 토큰 (SSOT)
└── global.css
```

## 🎨 디자인 규칙 (반드시 준수)

- **Stitch 시안**: 프로젝트 `7657386961511176864` 참조
- **픽셀 일치**: 색/간격/폰트 임의 변경 금지
- **토큰만 사용**: 하드코딩 색상 금지 (`tailwind.config.js`의 tokens만)
- **디자인 우선**: UI 정적 완성 → 사용자 컨펌 → 로직 연결 순서

자세한 규칙: [`../docs/design-workflow.md`](../docs/design-workflow.md)

## 📋 현재 상태

| 화면 | Stitch ID | 코드 | 컨펌 |
|------|-----------|:---:|:---:|
| Login | `3f20490d4b48480aa10157ce29d13fe4` | ✅ 정적 UI | 🛑 대기 중 |
| 그 외 | — | — | — |

## 🎯 다음 단계 (컨펌 후)

1. Login UI 사용자 컨펌
2. Supabase Auth 로직 연결
3. 다음 화면 (Signup → Consent) 정적 UI 작업
