# Instagram data pipeline

`fetch-instagram.mjs` pulls the owner's Instagram posts + comments and writes
`src/app/data/posts.json` (imported into the Angular bundle at build) plus thumbnails to
`public/thumbnails/` (served statically). These drive the site's **Wpisy** and **Źródła** views.
No live backend, no scraping — the owner's single account, via the official Instagram Graph API.

## One-time setup
1. Convert the Instagram account to **Business** or **Creator**.
2. Create a **Meta app** (Business type), add the **Instagram Graph API** product, and complete the
   OAuth flow as the account owner to get a **long-lived access token** (60 days).
3. `cp .env.example .env` and fill in `IG_ACCESS_TOKEN` and `IG_USER_ID`.
   In CI, set these as secrets instead of committing `.env`.

## Run
```bash
npm run fetch:instagram      # or: node tools/fetch-instagram.mjs
```
Outputs `src/app/data/posts.json` and `public/thumbnails/{id}.jpg`. Safe to re-run — existing
thumbnails are reused, and a failed fetch leaves the previous `src/app/data/posts.json` untouched.
`npm run build` also runs this automatically (via `prebuild`); without a token it is skipped and
the committed sample data is used.

## Sources convention (the "Źródła" feature)
On a post, the owner writes (and pins, for human viewers) a comment that **starts with the marker**
`źródła:` or `źródło:` (case-insensitive, colon optional). The script then extracts **every link**
in that comment — Instagram doesn't render links nicely, so the comment needn't be readable. Line
breaks are not required (Instagram comments are effectively single-line):

```
źródła: reuters https://reuters.com/article oecd https://oecd.org/report
```

Each link's display label is just its domain (e.g. `reuters.com`); the site shows those and links
out to the full URL. `www.`-prefixed links are accepted; duplicate links are removed.

- A post with **no** marker comment → `sources: []`, shown in the UI as **"Nie dodano jeszcze
  źródeł"** (not hidden, not an error).
- A marker comment containing no links is logged as a warning.

## Token refresh
The long-lived token expires after 60 days. Refresh it before expiry:
```
GET {IG_API_BASE}/refresh_access_token?grant_type=ig_refresh_token&access_token=OLD_TOKEN
```
Update the `IG_ACCESS_TOKEN` secret with the returned token.

## Output shape (`src/app/data/posts.json`)
```jsonc
{
  "generatedAt": "2026-07-13T09:00:00Z",
  "posts": [
    { "id": "...", "platform": "Instagram", "date": "2026-07-10",
      "permalink": "https://instagram.com/p/...", "thumbnailUrl": "/thumbnails/....jpg",
      "caption": "...", "sources": [{ "label": "OECD — ...", "url": "https://oecd.org/..." }] }
  ],
  "catalog": { "OECD — ...": { "org": "OECD", "domain": "oecd.org", "url": "https://oecd.org" } }
}
```
`thumbnailUrl` is `null` when a post has no downloaded image yet — the UI shows a placeholder.
