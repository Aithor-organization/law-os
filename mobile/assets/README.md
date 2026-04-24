# Mobile Assets

현재 파일은 **placeholder** (programmatic 생성, Dark Academia Pro 팔레트). 출시 전 디자이너 최종본으로 교체 필요.

| 파일 | 용도 | 권장 사양 |
|------|------|----------|
| `icon.png` | iOS/Android app icon | 1024 × 1024 PNG, 투명 배경 지양, rounded corner 자동 처리됨 |
| `adaptive-icon.png` | Android 12+ adaptive icon foreground | 1024 × 1024 PNG, 중심 66% 내 콘텐츠 배치 (safe zone) |
| `splash.png` | 스플래시 스크린 | 1242 × 2688 PNG 또는 2048 × 2048 정방형, 단색 배경 위 중앙 로고 |

## 교체 프로세스

1. 디자이너에게 위 사양 + 브랜드 가이드 (`docs/design-workflow.md`, `assets-pack-spec.md`) 전달
2. 받은 PNG 를 동일 파일명으로 덮어쓰기
3. `npx expo prebuild --clean` 으로 네이티브 번들 재생성
4. `assets/` 에 다크/라이트 variant 가 필요하면 `app.json` 의 `userInterfaceStyle` 기반 분기 설정

## 현재 palette

- Background: `#0A0A0B` (bg)
- Accent: `#A855F7` (violet-glow)
- Foreground: `#F4F4F5` (fg)

## App Store / Play Store 스크린샷

별도 디렉토리 (`assets/store-screenshots/`) 에 기기별로:
- iPhone 6.7" (1290 × 2796) — 필수 3-5장
- iPhone 6.5" (1242 × 2688) — 필수
- iPhone 5.5" (1242 × 2208) — 선택 (구형 기기 호환)
- iPad 12.9" (2048 × 2732) — `ios.supportsTablet` 이 `false` 이므로 현재는 불필요
- Pixel 6 Pro (1440 × 3120) — Play Store

출시 전 실제 앱 스크린샷을 촬영해 교체할 것.
