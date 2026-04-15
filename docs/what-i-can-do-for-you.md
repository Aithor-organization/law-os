# 자동화 가능 vs 사용자 직접 작업

각 에셋을 누가 생성해야 하는지 정리.

## ✅ Claude가 자동으로 할 수 있는 것

| 항목 | 상태 | 위치 |
| --- | --- | --- |
| **OG 이미지** | ✅ 다운로드 완료 | `public/og.png` (Stitch 썸네일, 512×410 — production은 Stitch 웹에서 2x export 권장) |
| **Hero iPhone 이미지** | ✅ 다운로드 완료 | `public/hero-iphone.png` (Stitch 썸네일) |
| **로고 SVG** | ✅ 생성 완료 | `public/logo.svg` (JetBrains Mono + violet glow) |
| **Favicon SVG** | ✅ 생성 완료 | `public/favicon.svg` (모던 브라우저 대응) |
| **Apple Touch Icon SVG** | ✅ 생성 완료 | `public/apple-touch-icon.svg` |
| **Web App Manifest** | ✅ 생성 완료 | `public/manifest.webmanifest` |

## ⚠️ 사용자가 직접 해야 하는 것 (외부 서비스 필요)

| 항목 | 왜 직접? | 어떻게 |
| --- | --- | --- |
| **favicon.ico** (레거시 브라우저용) | Bash에서 PNG→ICO 변환 도구가 없음 | 1. `public/favicon.svg`를 [realfavicongenerator.net](https://realfavicongenerator.net)에 업로드<br>2. 자동 생성된 ZIP 다운로드<br>3. `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`를 `public/`에 넣기 (1분 소요) |
| **Full-res OG/Hero 이미지** | Stitch 썸네일은 512px, 프로덕션은 고해상도 필요 | 1. Stitch 웹에서 `5047194537981448179` 프로젝트 열기<br>2. OG 이미지 스크린 → Export → PNG 2x<br>3. `public/og.png` 덮어쓰기<br>(현재 썸네일은 로컬 개발에는 충분) |
| **App Store / Google Play 배지** | 애플/구글 공식 라이센스 필요 | [Apple 공식 배지](https://developer.apple.com/app-store/marketing/guidelines/) + [Google Play 배지](https://play.google.com/intl/en_us/badges/)에서 SVG 다운로드 후 `public/badges/`에 저장 |
| **실제 앱스토어 딥링크** | 앱 미출시 | 출시 후 `app/page.tsx`의 `APP_STORE`, `GOOGLE_PLAY` 상수에 실제 URL 대입 |

## 🚀 지금 바로 실행 가능

```bash
cd /Users/seohun/Documents/에이전트/infiniteAgent/law-os/landing-page
npm install
npm run dev
```

→ `http://localhost:3000`에서 Dark Academia Pro 랜딩 페이지가 동작합니다.

현재 썸네일 해상도 이미지로도 로컬 개발에는 문제없고, Hero 섹션에서 iPhone 목업 자리에 fallback 텍스트가 보이는 상태입니다. `public/og.png`를 프로덕션 배포 전에만 교체하면 됩니다.

## 요약

- **5가지 작업 중 "OG/Hero/Favicon" 3개** → 모두 Claude가 자동 생성했습니다 (SVG는 완전 생성, PNG는 썸네일 다운로드)
- **favicon.ico 1개만** 외부 서비스(realfavicongenerator)가 필요한데, 1분이면 끝납니다
- **앱스토어 배지 + 실제 딥링크**는 앱 출시 후에만 필요
