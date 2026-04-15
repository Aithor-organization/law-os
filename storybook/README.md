# LAW.OS Component Library — Storybook

The canonical source for the **Sovereign Terminal** design system primitives.

## Setup

From inside `landing-page/`:

```bash
npx storybook@latest init --type nextjs --builder vite
npm run storybook
# → http://localhost:6006
```

Accept defaults. Storybook will auto-detect Next.js + Tailwind.

## Add these addons

```bash
npm install -D @storybook/addon-a11y @storybook/addon-themes @storybook/addon-interactions
```

Enable in `.storybook/main.ts`:

```ts
addons: [
  "@storybook/addon-essentials",
  "@storybook/addon-a11y",       // WCAG violations inline
  "@storybook/addon-themes",     // Theme switcher (we only have dark)
  "@storybook/addon-interactions" // Play functions for interaction tests
]
```

## Preview global decorator

`.storybook/preview.ts`:

```ts
import type { Preview } from "@storybook/react";
import "../app/globals.css";

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: "void",
      values: [
        { name: "void", value: "#000000" },
        { name: "surface", value: "#141418" },
        { name: "surface-low", value: "#0A0A0B" },
      ],
    },
    layout: "centered",
  },
  globalTypes: {
    locale: {
      description: "Locale",
      defaultValue: "ko",
      toolbar: {
        items: [
          { value: "ko", title: "한국어" },
          { value: "en", title: "English" },
        ],
      },
    },
  },
};

export default preview;
```

## Stories included

| File | Component | Variants |
| --- | --- | --- |
| `Button.stories.tsx` | Button | primary, ghost, mono, with icon, loading |
| `TerminalCard.stories.tsx` | TerminalCard | 3 sample cards (features) |

Add more as the component library grows.

## Conventions

1. **One story per variant** — don't combine "all variants in one" unless it's a visual QA page.
2. **Use Korean + English copy** — every story shows both locales to catch text overflow.
3. **`// COMMENT` labels** in story titles to match the terminal aesthetic.
4. **A11y addon must pass** — no red violations allowed before merging.

## Publishing to Chromatic (recommended)

```bash
npm install -D chromatic
npx chromatic --project-token=<YOUR_TOKEN>
```

Gives you:
- Visual regression tests on every PR
- Shareable URL for designers/PM
- Component review before Figma handoff
