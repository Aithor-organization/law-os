# LAW.OS — Asset Pack Specification

Every asset needed before launching the landing page + mobile apps. Dark Academia Pro / Sovereign Terminal brand.

## Source of truth

- **Design system**: `law-os/landing-page/tailwind.config.ts` (colors, fonts)
- **Stitch exports**: `https://stitch.withgoogle.com/project/5047194537981448179` (OG, landing)
- **App screens**: `https://stitch.withgoogle.com/project/7657386961511176864`

## 1. Favicon & app icons

Place in `landing-page/public/` and mobile build folders.

| File | Size | Use | Export from |
| --- | --- | --- | --- |
| `favicon.ico` | 16, 32, 48 | Browser tab | ICO bundle |
| `favicon.svg` | Vector | Modern browsers | Logo SVG |
| `apple-touch-icon.png` | 180×180 | iOS home screen | Logo on #000 bg |
| `android-chrome-192.png` | 192×192 | Android home | Logo on #000 bg |
| `android-chrome-512.png` | 512×512 | PWA splash | Logo on #000 bg |
| `mstile-150.png` | 150×150 | Windows tile | Logo on #000 bg |
| `manifest.webmanifest` | JSON | PWA manifest | See below |

### manifest.webmanifest

```json
{
  "name": "LAW.OS",
  "short_name": "LAW.OS",
  "description": "법률 공부의 새로운 OS",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#A855F7",
  "icons": [
    { "src": "/android-chrome-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/android-chrome-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

## 2. Social / OG images

| File | Size | Platform | Source |
| --- | --- | --- | --- |
| `og.png` | 1200×630 | Twitter, Facebook, KakaoTalk, LinkedIn | Stitch screen `fac1082f96bb4215858752309eca6117` |
| `og-square.png` | 1200×1200 | Instagram, some Slack previews | Recrop from main OG |
| `twitter-card.png` | 1200×628 | Twitter large image card | Use og.png |

**Export from Stitch:**
1. Open project `5047194537981448179`
2. Find screen "LAW.OS | Social Media OG Image"
3. Click Export → PNG 2x
4. Save as `landing-page/public/og.png`

## 3. Mobile app store assets

### iOS App Store

| Asset | Size | Notes |
| --- | --- | --- |
| App icon | 1024×1024 | No transparency, square. Dark violet glow logo on true black. |
| iPhone 6.7" screenshots (min 3, max 10) | 1290×2796 | Export Home / Active Chat / Vault / ⌘K / Case Detail from Stitch |
| iPhone 6.5" screenshots | 1242×2688 | Scale from 6.7" |
| iPad 12.9" screenshots | 2048×2732 | Optional for Pro |

### Google Play Store

| Asset | Size | Notes |
| --- | --- | --- |
| App icon | 512×512 | PNG, 32-bit with alpha |
| Feature graphic | 1024×500 | Like a mini OG — use cropped `og.png` |
| Phone screenshots (min 2, max 8) | 1080×1920 min | Same 5 screens as iOS |
| Short description | 80 chars | "터미널처럼 빠른 AI 법률 튜터. ⌘K로 판례 검색, Vault로 지식 관리." |
| Full description | 4000 chars | See `store-copy.md` |

## 4. Logo variants

Need 5 versions of the LAW.OS wordmark:

| File | Use |
| --- | --- |
| `logo-violet.svg` | Primary. `#DDB7FF` JetBrains Mono Bold on transparent |
| `logo-white.svg` | On violet backgrounds |
| `logo-black.svg` | On white/cream (press kit) |
| `logo-mono.svg` | Single-color ASCII-style |
| `logo-favicon.svg` | Square icon — just "L" letter |

### SVG source (logo-violet.svg)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 60" width="240" height="60">
  <text x="0" y="42" font-family="JetBrains Mono, monospace" font-size="42" font-weight="700" fill="#DDB7FF" letter-spacing="-0.02em">LAW.OS</text>
</svg>
```

## 5. Hero imagery

| File | Size | Source |
| --- | --- | --- |
| `hero-iphone.png` | 600×1200 (transparent bg) | Crop from Stitch Active Chat screen + add phone frame |
| `hero-iphone-2x.png` | 1200×2400 | Retina version |
| `phone-frame-iphone.png` | PNG frame mask | Apple marketing kit: https://developer.apple.com/design/resources/ |
| `phone-frame-pixel.png` | Android frame | Google device art: https://developer.android.com/distribute/marketing-tools/device-art-generator |

## 6. Screenshot gallery (for /features page, future)

Export these 5 app screens from Stitch at 2x:

1. `screen-home.png` — Command Center
2. `screen-chat.png` — Active Chat with diff view
3. `screen-vault.png` — File tree browser
4. `screen-case.png` — Case detail with minimap
5. `screen-palette.png` — ⌘K glassmorphic modal

Save to `landing-page/public/screens/`.

## 7. Video/motion (optional, high-impact)

| File | Duration | Use |
| --- | --- | --- |
| `hero-demo.mp4` | 30 sec | Screen recording of actual app: open ⌘K → search → view case. Silent, looping. |
| `hero-demo-poster.jpg` | Frame 1 | Fallback image |
| `feature-keyboard.mp4` | 10 sec | Just the ⌘K animation |
| `feature-vault.mp4` | 10 sec | Tree navigation |

Format: H.264 MP4, 1920×1080, ~3-5 MB each (under 5MB for instant load).

## 8. Email / press kit

| File | Use |
| --- | --- |
| `press-kit.zip` | Bundle for journalists: logo, OG image, 3 screenshots, 1-paragraph pitch |
| `pitch-email.md` | Template for reaching out to TechCrunch, 한국경제, etc. |

## Production checklist

Before launch, verify:

- [ ] All favicon sizes generated and placed in `public/`
- [ ] `og.png` loads correctly in Twitter Card Validator (https://cards-dev.twitter.com/validator)
- [ ] `og.png` loads in Facebook Sharing Debugger
- [ ] Apple touch icon shows on iOS "Add to Home Screen"
- [ ] Manifest validates at https://manifest-validator.appspot.com/
- [ ] App Store Connect has all required iOS assets
- [ ] Google Play Console has all required Android assets
- [ ] Logo SVGs render correctly at 16px, 32px, 240px, 480px
- [ ] Hero iPhone mockup looks sharp on retina (@2x exported)
- [ ] Press kit ZIP is under 10MB

## Tools

- **Favicon generator**: https://realfavicongenerator.net — upload master SVG, get all sizes
- **OG image test**: https://www.opengraph.xyz/
- **App icon generator**: https://appicon.co — upload 1024×1024, get iOS + Android
- **Device frames**: https://mockuphone.com — wrap screenshots in device frames free
- **ImageOptim** (mac): crush all PNGs before commit

## Estimated timeline

| Task | Time |
| --- | --- |
| Logo SVG design (5 variants) | 2 hr |
| Favicon + app icons (from logo) | 1 hr (automated) |
| OG image export + test | 30 min |
| Mobile app store screenshots | 2 hr (5 screens × 2 platforms) |
| Hero iPhone mockup | 1 hr |
| Feature screenshots | 1 hr |
| Press kit bundle | 1 hr |
| Hero demo video (optional) | 4 hr |
| **Total (without video)** | **~8.5 hr** |
| **With video** | **~12.5 hr** |
