# Szymon Kołodziejczyk — personal site

Polish-language personal site for a journalist (journalism · technology · politics), built in
**Angular 22 + Angular Material** (Material Design 3) with a custom editorial theme (Source Serif 4
display type, Roboto Flex UI, a custom indigo palette, light/dark). Rendered as a fully
**static prerendered (SSG)** site.

Three sections, reached from a persistent navigation (rail on desktop → bottom bar on mobile):

- **Wpisy** — a thumbnail feed of the owner's posts, filterable by date. Posts with sources expose
  a **Źródła · N** button opening a dialog of citation links; posts without show
  *"Nie dodano jeszcze źródeł"*.
- **Źródła** — a master/detail "pick & see": pick a cited source, see the posts that rely on it.
- **O mnie** — bio + facts.

## Where the data comes from

Posts and their sources are pulled from Instagram at **build time** by
[`tools/fetch-instagram.mjs`](tools/README.md) and written to `src/app/data/posts.json`
(baked into the bundle) + `public/thumbnails/` (served statically). Each post's **Źródła** come from
a marker comment the owner writes on the post (first line `Źródła:`, then `Label — URL` per line) —
read via the official Instagram Graph API, no scraping. See [`tools/README.md`](tools/README.md) for
setup, the comment convention, and token handling. A committed sample dataset lets the site build
and render without a token.

## Commands

```bash
npm start                 # dev server at http://localhost:4200
npm run build             # prod build (SSG) → dist/personal-site/browser  (runs fetch first if a token is set)
npm test                  # unit tests (Vitest + jsdom)
npm run fetch:instagram   # refresh src/app/data/posts.json from Instagram (needs .env — see tools/README.md)
```

Deploy the static contents of `dist/personal-site/browser/`.

## Layout

- `src/app/` — standalone components: shell (`app.*`), `posts-view`, `sources-view`, `about-view`,
  `post-card`, `date-filter`, `sources-dialog`; `data.service.ts` (data + shared date filter),
  `theme.service.ts`, `util.ts` (Polish plural/date helpers), `models.ts`, `data/posts.json`.
- `tools/` — the build-time Instagram pipeline.
- `handoff_material_site/` — the original design reference (HTML prototype); not shipped.
