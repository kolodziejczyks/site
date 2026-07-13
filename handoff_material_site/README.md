# Handoff: Szymon Kołodziejczyk — Personal Site (Material Design 3)

## Overview
A Polish-language personal site / business card for a journalist covering **journalism,
technology, and politics**. Built in the Material Design 3 visual language. Three sections
reached from a persistent navigation:

1. **Wpisy** (Posts) — an Instagram/YouTube/TikTok-style feed of the owner's content, shown
   as **thumbnails** (reels/posts have no titles — the thumbnail image carries the meaning),
   filterable by date. Posts that cite sources expose a **Źródła** (Sources) button that opens
   a dialog listing that post's citation links.
2. **Źródła** (Sources) — a "Pick & see" master/detail view: a list of every cited website on
   the left; selecting one shows, on the right, the posts that rely on it (as thumbnails).
   Also date-filterable.
3. **O mnie** (About) — bio + facts (Based in / Focus / Since).

Supports **light and dark mode** (toggle in the top bar) and is fully responsive
(navigation rail on desktop → bottom navigation bar on mobile).

## About the Design Files
The files here are a **design reference authored in HTML** (a streaming "Design Component"
prototype). They show the intended look, layout, and behavior — **they are not production
code to ship as-is.** Recreate this design in the target codebase using its conventions.

Because the owner asked for Material Design, **Angular Material or MUI (Material UI) is the
natural implementation target.** Map the prototype's hand-built Material surfaces onto real
components — but keep the custom look (see "Theming" — this is NOT default Google-Material
Roboto/purple; it uses editorial serif display type and a custom indigo palette).

Post data, sources, and dates in the prototype are **hard-coded Polish sample content**.
In production the feed comes from social APIs (see "Data").

## Fidelity
**High-fidelity.** Colors, type, spacing, interactions, and the light/dark system are final.
The bio paragraphs are lorem-ipsum placeholder — replace with real copy. Social URLs, post
permalinks (`https://instagram.com/p/exampleN`), and source URLs are examples to replace.

## Theming (light / dark)
Colors are CSS custom properties defined once and flipped by a `data-theme` attribute on the
root element. Recreate this as your framework's theme tokens.

### Light (`:root`)
- `--bg:#FAF9FD`  `--surface:#FFFFFF`  `--surface-1:#F3F3FA`  `--surface-2:#EDEDF4`
- `--on:#1A1B20`  `--on-2:#44474E`  `--on-3:#5F6268`  *(on-3 tuned to ~5.7:1 for AA)*
- `--outline:#C4C6D0`  `--hairline:#E1E2E8`
- `--accent:#415F91`  `--accent-container:#DAE2F9`  `--on-accent-container:#001B3E`  `--accent-soft:#E3E9FB`

### Dark (`[data-theme="dark"]`)
- `--bg:#111318`  `--surface:#1A1C22`  `--surface-1:#1E2027`  `--surface-2:#23262E`
- `--on:#E3E2E9`  `--on-2:#C4C6D0`  `--on-3:#8E9199`
- `--outline:#43474E`  `--hairline:#2A2D34`
- `--accent:#AAC7FF`  `--accent-container:#274777`  `--on-accent-container:#D6E3FF`  `--accent-soft:#223049`

Elevation: `--shadow` (M3 level-1/2 soft black shadows, slightly stronger in dark).
All contrast pairs verified against WCAG AA for small text.

## Typography (Google Fonts)
- **Source Serif 4** (400/500/600) — display: name, section headings, About headline, dialog titles.
- **Roboto Flex** (400/500/600) — UI, body, buttons, chips, meta.
- **Material Symbols Outlined** — icons (via ligatures; `.msym` class sets the font).
Note: this deliberately replaces Material's default Roboto to give an editorial feel — keep it.

## Iconography
- UI icons: Material Symbols (grid_view, menu_book, person, filter_list, check, date_range,
  link, open_in_new, close, event_busy, dark_mode/light_mode for the theme toggle, mail).
- Brand marks (Instagram, YouTube, TikTok, LinkedIn): inline SVG paths (Simple Icons style)
  with `fill="currentColor"`. **Instagram needs `fill-rule="evenodd"`** or it fills as a solid
  square. Email uses the Material `mail` glyph (not a brand).

## Shape / spacing
- Cards: 16px radius; About surface & dialog: 24–28px; chips/pills: 8px; nav pills: 16px; buttons: 20px.
- Post thumbnails: **4:5 portrait** aspect ratio (matches Instagram).
- Desktop grid: navigation rail `88px` + content `1fr`. Content padding ~28–40px.
- Posts grid: `repeat(auto-fill, minmax(220px,1fr))`; capped to 5 cols ≥1500px, 6 ≥2000px.

## Screens / behavior

### Navigation
- **Desktop rail** (≥900px, sticky, full height, `--surface-1`): avatar (click → About) + three
  destinations (Wpisy / Źródła / O mnie), each an icon-in-pill + label. Active destination:
  filled `--accent-container` pill, `--on-accent-container` icon/label. Inactive: `--on-2`.
- **Mobile bottom bar** (<900px, fixed): same three destinations.
- **Top app bar** (always): name (Source Serif 4) + subtitle
  `@niewiemniczego · Dziennikarstwo · Technologia · Polityka`; right side = theme toggle +
  brand icon links (Instagram/YouTube/TikTok/LinkedIn/email).

### Wpisy (Posts)
- **Date filter chip bar** (shared with Sources): Cały czas / Ostatni miesiąc / Ostatnie 3
  miesiące / Ten rok / Zakres (Custom → two `<input type="date">` From/To = Od/Do). Active chip
  filled; a check icon marks the active one. Default: **Ostatni miesiąc** (past month).
- Section heading reflects the active filter (e.g. "Ostatni miesiąc") + a Polish-pluralized
  count ("4 wpisy").
- Post card: 4:5 thumbnail with a platform tag overlay (INSTAGRAM/YOUTUBE/TIKTOK), the post's
  date below (pl-PL formatted, e.g. "10 lip 2026"), and — if it has sources — a tonal
  **Źródła · N** button. Clicking the card opens the post permalink (new tab); clicking Źródła
  opens the sources dialog (stops propagation).
- Empty range → centered empty state "Brak wpisów w tym zakresie dat."

### Źródła (Sources) — "Pick & see"
- Same date filter chip bar.
- Two-column master/detail: left = source list (org monogram, name, `domain · N wpis(y/ów)`),
  selectable (active row = `--accent-container`). Right = detail card, fixed height, header
  ("Cytowane w N wpisie/wpisach", org name, domain link) + a scrolling 4-col thumbnail grid of
  that source's posts. Detail posts reuse the SAME image slots as the feed (drop once, appears
  in both). Sources with no posts in range are hidden; none left → "Brak źródeł w tym zakresie dat."
- Mobile: stacks to one column; detail height caps at 70vh.

### O mnie (About)
- Rounded surface card: "O mnie" chip, Source Serif 4 headline "Relacje z Warszawy", lead +
  secondary paragraphs (lorem placeholder), and three fact tiles: **Mieszkam w** / **Tematy** /
  **Od**. A portrait image beside it (grows on large screens). Social links live only in the top
  bar (intentionally not duplicated here).

### Sources dialog (from a post's Źródła button)
- M3 dialog (28px radius, `--surface-1`): "Źródła" kicker, post title, platform, a list of
  citation links (numbered tonal chip + label + open_in_new), and a "Zamknij" text button.
  Dismiss via scrim or the button.

## State
- `tab`: 'posts' | 'sources' | 'about'
- `theme`: 'light' | 'dark'  *(in-session only in the prototype — persist to localStorage and/or
  honor `prefers-color-scheme` in production)*
- `range`: 'all'|'month'|'3months'|'year'|'custom' + `from`/`to` (shared by Posts & Sources)
- `openId`: which post's sources dialog is open (or null)
- `selSrc`: selected source index in Pick & see

## Data (production)
- **Posts**: `{ id, thumbnailUrl, platform, permalink, date, sources[] }`, where
  `sources = [{ label, url }]`. Pull from the **Instagram Graph API** (Business/Creator account +
  Facebook app + long-lived token); optionally YouTube Data API / TikTok Display API. Reels/posts
  have no titles — use `thumbnailUrl` as the primary representation and `date` for filtering.
  `sources` is author-curated metadata stored alongside each post (CMS/JSON), not from the API.
- **Sources view** is derived: group posts by the sources they cite (catalog maps a source label
  → `{ org, domain, url }`). See the `catalog` object and the grouping loop in the logic class.
- **About copy** and the **social links** are static site content.
- Polish plural helper (wpis / wpisy / wpisów) and `pl-PL` date formatting are in the logic class —
  port both.

## Assets
- `image-slot.js` — the prototype's drag-drop image placeholder web component. **Not needed in
  production**; replace `<image-slot>` with real `<img>`/framework Image bound to `thumbnailUrl`
  and the portrait photo.
- `uploads/photo-1783179165474.jpg` — placeholder portrait (a stand-in; swap for the real photo).

## Files
- `Personal Site - Material.dc.html` — the full design: template markup + a logic class near the
  bottom holding sample data, the source-catalog grouping, date filtering, Polish
  pluralization/dates, theme tokens, and all state. Read it for exact markup, inline styles,
  the theme `:root` / `[data-theme="dark"]` blocks, and the responsive `@media` rules.
- `image-slot.js`, `uploads/photo-1783179165474.jpg` — reference assets.
