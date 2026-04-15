# LAW.OS — Landing Page

Next.js 14 (App Router) + Tailwind CSS scaffold for the **Dark Academia Pro / Sovereign Terminal** design system.

## Quick start

```bash
cd landing-page
npm install
npm run dev
# → http://localhost:3000
```

## What's here

```
landing-page/
├── app/
│   ├── layout.tsx      # SEO metadata + JSON-LD + scanline layer
│   ├── page.tsx        # Hero / Features / Stats / CTA / Footer
│   └── globals.css     # Font imports + scanline overlay + selection
├── components/ui/
│   ├── Button.tsx      # primary / ghost / mono variants
│   └── TerminalCard.tsx # The "Folio" card
├── tailwind.config.ts  # Design tokens (colors, fonts, shadows)
└── public/             # /og.png, /favicon.ico, /apple-touch-icon.png
```

## Design tokens (Sovereign Terminal)

| Token | Value | Usage |
| --- | --- | --- |
| `bg-bg` | `#000000` | Base canvas — the void |
| `bg-surface` | `#141418` | Data modules, cards |
| `bg-surface-low` | `#0A0A0B` | Sidebars, nav |
| `text-fg` | `#F4F4F5` | Off-white (never pure white) |
| `text-dim` | `#71717A` | Metadata |
| `text-violet` | `#A855F7` | Primary action, focus |
| `text-violet-glow` | `#DDB7FF` | Light violet, headings accents |
| `text-cyan` | `#06B6D4` | Citations, numbers ONLY |
| `text-amber` | `#FBBF24` | Warnings |
| `shadow-glow` | `0 0 24px violet/15%` | Focus state (replaces drop shadow) |

## Rules

1. **No drop shadows.** Use `shadow-glow` or tonal layering.
2. **Max 6px radius.** Ever. No pills.
3. **JetBrains Mono** for all numbers, timestamps, keyboard hints.
4. **Pretendard** for Korean body text. **Inter** for English UI.
5. **Ghost borders only** — `border-white/10` (10% opacity), never 100%.
6. **`// COMMENT`** labels throughout (terminal vibe).

## Assets needed before launch

Place in `public/`:
- `og.png` (1200×630, from Stitch)
- `favicon.ico` (16/32)
- `apple-touch-icon.png` (180×180)
- `hero-iphone.png` (600×1200, transparent bg)
- `logo.svg`

See `../docs/asset-pack-spec.md` for the full checklist.

## Deployment

```bash
npm run build
# Deploy to Vercel / Netlify / your platform of choice
vercel --prod
```
