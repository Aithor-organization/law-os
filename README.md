# LAW.OS

> 법률 공부의 새로운 OS · Terminal for Korean Law Students

법학 수험생과 로스쿨 학생을 위한 AI 법률 튜터. ⌘K 하나로 민법/형법/헌법 전체와 대법원 판례를 탐색하는 파워유저 중심 모바일 앱 + 웹 랜딩 페이지.

## 🎨 Design Philosophy

**"Dark Academia Pro / The Sovereign Terminal"** — VSCode, Cursor, Raycast에서 영감을 받은 파워유저 전용 미학. Korean law student에 특화.

- **Colors**: True black `#000000` + electric violet `#A855F7` + citation cyan `#06B6D4`
- **Typography**: Inter (UI) + Pretendard Variable (Korean) + JetBrains Mono (data)
- **Rules**: Max 6px radius, ghost borders only, violet glow instead of drop shadows

## 📂 Repository Structure

```
law-os/
├── landing-page/       # Next.js 14 + Tailwind CSS 마케팅 사이트
│   ├── app/            # App Router 페이지
│   ├── components/ui/  # Button, TerminalCard
│   └── public/         # OG image, favicons, logo
├── docs/               # 개발 + 디자인 문서
│   ├── figma-import-guide.md
│   ├── asset-pack-spec.md
│   └── what-i-can-do-for-you.md
├── storybook/          # 컴포넌트 스토리북 설정 + stories
│   ├── Button.stories.tsx
│   └── TerminalCard.stories.tsx
└── assets/             # 공용 브랜드 에셋 (추후)
```

## 🚀 Quick Start — Landing Page

```bash
cd landing-page
npm install
npm run dev
# → http://localhost:3000
```

현재 구현된 섹션:
- ✅ Navigation (fixed, glassmorphic)
- ✅ Hero (headline + metric chips + App Store/Google Play 버튼)
- ✅ Features (3-column grid)
- ✅ Stats strip (cyan mono numbers)
- ✅ Big CTA (violet glow background)
- ✅ Footer (status bar + links)

## 🎯 Roadmap

- [ ] Full-res OG image (Stitch export)
- [ ] Real iPhone mockup (hero-iphone.png)
- [ ] Pricing page (`/pricing`)
- [ ] FAQ accordion
- [ ] App Store + Google Play 실제 딥링크 (앱 출시 후)
- [ ] Storybook 초기 셋업 + publish to Chromatic
- [ ] Figma 디자인 시스템 라이브러리 공유
- [ ] 모바일 앱 개발 착수

## 🎨 Stitch Projects (Figma-ready source)

| Project | ID | Screens |
| --- | --- | --- |
| 모바일 앱 + 관리자 | `7657386961511176864` | 18 |
| 랜딩 페이지 (desktop/mobile/tablet + OG) | `5047194537981448179` | 4 |

## 📚 Documentation

- [Figma Import Guide](./docs/figma-import-guide.md) — html.to.design 플러그인 사용법
- [Asset Pack Spec](./docs/asset-pack-spec.md) — 파비콘, OG, 앱스토어 에셋 체크리스트
- [Storybook Setup](./storybook/README.md) — 컴포넌트 라이브러리 구축

## 📜 License

Proprietary — LAW.OS inc. © 2026
