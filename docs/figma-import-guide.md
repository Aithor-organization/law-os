# Figma Import Guide — LAW.OS Dark Academia Pro

How to get all Stitch screens into Figma for development handoff, prototyping, and design iteration.

## Stitch projects to import

| Project | ID | Purpose |
| --- | --- | --- |
| LAW.OS App + Admin | `7657386961511176864` | 16 screens (mobile app + 2 admin desktop) |
| LAW.OS Landing Page | `5047194537981448179` | 3 screens (desktop, mobile, tablet) + OG image |

## Method A — HTML → Figma (recommended)

Stitch generates real HTML/CSS. The fastest path to Figma is via the **html.to.design** plugin.

### Steps

1. **Download HTML from Stitch**
   - Open each screen in Stitch web UI (`https://stitch.withgoogle.com/project/<ID>`)
   - Click the `< >` icon → **Export HTML**
   - Save each file as `screen-<name>.html` in `law-os/stitch-exports/`

2. **Install Figma plugin**
   - Figma → Plugins → Browse plugins
   - Search "**html.to.design**" (by divriots) → Install
   - Free tier supports up to 20 imports/month — enough for this project

3. **Import each screen**
   - In Figma, open a new file
   - Plugins → html.to.design → Upload HTML
   - Screen imports as native Figma layers (text, rects, auto-layout)
   - Group by section: Auth, Core, Admin, Landing

4. **Organize into pages**
   ```
   LAW.OS (Figma file)
   ├── 🎨 Design System  (tokens, color styles, text styles)
   ├── 📱 Mobile App     (16 screens)
   ├── 🖥  Admin Web      (2 screens)
   ├── 🌐 Landing        (desktop / tablet / mobile)
   └── 📐 Components     (extracted primitives)
   ```

## Method B — Screenshot + manual rebuild (higher quality)

Best when you want pixel-perfect Figma-native components.

1. In Stitch, for each screen, click **Screenshot** → download PNG at 2x
2. Import PNGs to Figma as reference boards
3. Rebuild key components manually:
   - Button (primary / ghost / mono)
   - TerminalCard (with stripe + footer)
   - CommandPalette modal
   - Input (terminal prompt style)
4. Use the rebuilt components to reconstruct full screens

## Design tokens — manual setup in Figma

Before importing screens, set up these local styles so imported layers snap to them:

### Color styles

```
bg/base          #000000
bg/surface       #141418
bg/surface-low   #0A0A0B
bg/surface-high  #1C1B1C
text/fg          #F4F4F5
text/dim         #71717A
violet/primary   #A855F7
violet/glow      #DDB7FF
cyan             #06B6D4
amber/warn       #FBBF24
ghost-border     rgba(255,255,255,0.1)
```

### Text styles

```
Display / 84 / Inter Bold / -3% tracking
H1 / 60 / Inter SemiBold / -2%
H2 / 40 / Inter SemiBold / -2%
Body / 16 / Pretendard Variable / 0
Mono-lg / 14 / JetBrains Mono Medium
Mono-sm / 11 / JetBrains Mono Regular / +5% uppercase tracking
```

### Effect styles

```
Glow / primary  →  drop-shadow(0 0 24px #A855F7 @ 15%)
Glow / large    →  drop-shadow(0 0 48px #A855F7 @ 25%)
```

### Grid styles

```
Desktop / 12col / 80 gutter / max-w 1440
Tablet  / 8col / 32 gutter / max-w 768
Mobile  / 4col / 16 gutter
```

## Component library strategy

After import, extract these into a **shared Figma library** (publish to team):

1. **Button** — 3 variants × 4 states (default / hover / active / disabled)
2. **TerminalCard** — 3 sizes (sm / md / lg)
3. **Input** — terminal prompt style with focus glow
4. **Chip** — statute reference, filter, metric
5. **TableRow** — admin dense row
6. **CommandPaletteItem** — ⌘K list row
7. **NavBar** — top nav, fixed glassmorphic
8. **Footer** — terminal bootup style

## Handoff to developers

Once in Figma:

1. **Use Inspect panel** — devs can copy exact CSS
2. **Link components to Storybook** — use `Figma to Storybook` plugin to connect
3. **Export assets** via Figma's Export tab (PNG 1x/2x/3x or SVG)
4. **Share prototype links** for PM/stakeholder review

## Known limitations

- Stitch's html.to.design import may lose the **2% scanline texture** (it's a CSS `repeating-linear-gradient`). Recreate manually in Figma with Background Fill → Pattern.
- **Violet glow shadows** from Tailwind may import as plain drop-shadows. Reapply the `Glow / primary` effect style.
- **Glassmorphic blur** (command palette modal) requires Figma's `Background blur` effect, not Drop Shadow.

## Timeline estimate

| Task | Time |
| --- | --- |
| Download all 20 screens from Stitch | 30 min |
| Set up color/text/effect styles | 1 hr |
| Import via html.to.design | 1 hr (batch) |
| Organize into pages + clean up | 2 hr |
| Extract 8 shared components | 3 hr |
| Publish library + share with team | 30 min |
| **Total** | **~8 hr** |

## Resources

- Stitch docs: https://stitch.withgoogle.com/docs
- html.to.design plugin: https://www.figma.com/community/plugin/1159123024924461424
- Figma community — Dark Academia inspiration: search "dark academia pro" or "terminal ui"
