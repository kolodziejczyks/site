#!/usr/bin/env node
/**
 * Build-time Instagram fetcher for the personal site.
 *
 * Pulls the owner's own Instagram posts + comments via the Instagram Graph API,
 * derives each post's "Źródła" (sources) from a marker comment the owner writes,
 * downloads thumbnails locally (the API's CDN URLs expire in ~2 days), and writes
 * a static `data/posts.json` in the exact shape the site's UI consumes.
 *
 * Scope: the owner's single account only. No scraping, no live backend.
 *
 * Env (see .env.example):
 *   IG_ACCESS_TOKEN   long-lived token (required)
 *   IG_USER_ID        the owner's IG user id (required)
 *   IG_API_BASE       Graph API base (default https://graph.instagram.com/v21.0)
 *   IG_SOURCES_MARKER first-line marker of the sources comment (default "Źródła:")
 *
 * Run: node tools/fetch-instagram.mjs
 */

import { readFile, writeFile, mkdir, rename, access } from 'node:fs/promises';
import { constants as FS } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
// JSON is baked into the Angular app at build (imported by DataService);
// thumbnails are served as static files from public/.
const OUT_FILE = join(ROOT, 'src', 'app', 'data', 'posts.json');
const THUMBS_DIR = join(ROOT, 'public', 'thumbnails');
const THUMB_URL_PREFIX = '/thumbnails'; // served from public root
const DEBUG = process.argv.includes('--debug');

// ---------------------------------------------------------------------------
// Minimal .env loader (no dependency). Real env vars take precedence.
// ---------------------------------------------------------------------------
async function loadDotEnv() {
  try {
    const raw = await readFile(join(ROOT, '.env'), 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i.exec(line);
      if (!m) continue;
      const key = m[1];
      let val = m[2];
      if (/^".*"$/.test(val) || /^'.*'$/.test(val)) val = val.slice(1, -1);
      if (process.env[key] === undefined) process.env[key] = val;
    }
  } catch {
    /* no .env file — rely on real environment */
  }
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
export const cfg = {};
export function requireConfig() {
  cfg.token = process.env.IG_ACCESS_TOKEN;
  cfg.userId = process.env.IG_USER_ID || ''; // optional — resolved from the token if blank
  cfg.username = '';
  cfg.base = (process.env.IG_API_BASE || 'https://graph.instagram.com/v21.0').replace(/\/+$/, '');
  if (!cfg.token) {
    throw new Error('Missing IG_ACCESS_TOKEN. Copy .env.example to .env and paste your token.');
  }
}

/**
 * Resolve the authenticated account's numeric id + username from the token.
 * Lets onboarding be "just paste the token" and gives us the id used to match
 * the owner's own comments. Honors IG_USER_ID if provided (skips the id lookup).
 */
export async function resolveUser() {
  const me = await apiGet(apiUrl('me', { fields: 'user_id,username,profile_picture_url' })).catch(
    () => null,
  );
  // graph.instagram.com returns `user_id` (numeric IG id) and `username`; older
  // shapes return `id`. Prefer an explicit IG_USER_ID, then user_id, then id.
  if (me) {
    cfg.userId = cfg.userId || String(me.user_id ?? me.id ?? '');
    cfg.username = me.username || '';
    cfg.profilePicUrl = me.profile_picture_url || '';
  }
  if (!cfg.userId && !cfg.username) {
    throw new Error('Could not resolve the account from the token (is it valid and for a Business/Creator account?).');
  }
  console.log(`  Authenticated as @${cfg.username || '?'}${cfg.userId ? ` (id ${cfg.userId})` : ''}.`);
}

// ---------------------------------------------------------------------------
// Graph API helpers
// ---------------------------------------------------------------------------
export function apiUrl(path, params = {}) {
  const url = new URL(`${cfg.base}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set('access_token', cfg.token);
  return url;
}

export async function apiGet(url) {
  const res = await fetch(url);
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.error) {
    const e = body.error || {};
    throw new Error(`Graph API ${res.status}: ${e.message || res.statusText} (type=${e.type || '?'}, code=${e.code || '?'})`);
  }
  return body;
}

/** Follow `paging.next` and collect every page's `data`. */
async function apiGetAll(path, params) {
  const out = [];
  let url = apiUrl(path, params);
  while (url) {
    const body = await apiGet(url);
    if (Array.isArray(body.data)) out.push(...body.data);
    url = body.paging && body.paging.next ? new URL(body.paging.next) : null;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Sources parsing
//
// A sources comment starts with the marker "źródła:" or "źródło:" (case-
// insensitive, colon optional). We then pull EVERY link out of the comment —
// Instagram doesn't render links nicely (it wants users to stay on IG), so the
// comment text needn't be readable. Each link's label is just its domain; the
// site displays those.
// ---------------------------------------------------------------------------

/** True if the comment text begins with the "źródła"/"źródło" marker. */
export const hasMarker = (text) => /^\s*źródł[ao]\s*[:：]?/iu.test(text || '');

/** Match http(s):// links and bare www. links anywhere in the text. */
const URL_RE = /(?:https?:\/\/|www\.)[^\s]+/giu;

/** Extract all links from a marker comment as [{ label, url }] (deduped). */
export function parseSources(text) {
  const out = [];
  const seen = new Set();
  for (const raw of text.match(URL_RE) ?? []) {
    const trimmed = raw.replace(/[.,;:)\]}>"'’]+$/u, ''); // strip trailing punctuation
    const url = /^www\./i.test(trimmed) ? `https://${trimmed}` : trimmed;
    let label;
    try {
      label = new URL(url).hostname.replace(/^www\./, '');
    } catch {
      continue; // not a usable URL
    }
    const key = url.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ label, url });
  }
  return out;
}

/** True if a comment was authored by the account owner (match by id or username). */
const isOwnComment = (c) => {
  if (!c.from) return false;
  if (cfg.userId && String(c.from.id) === String(cfg.userId)) return true;
  if (cfg.username && c.from.username && c.from.username.toLowerCase() === cfg.username.toLowerCase())
    return true;
  return false;
};

/** Pick the owner's newest marker comment and extract its links. */
export function extractSources(comments, mediaId, warnings) {
  const own = comments
    .filter(isOwnComment)
    .filter((c) => typeof c.text === 'string' && hasMarker(c.text))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  if (!own.length) return []; // normal "not yet annotated" state
  const sources = parseSources(own[0].text);
  if (!sources.length) {
    warnings.push(`post ${mediaId}: marker comment found but no links in it`);
  }
  return sources;
}

/** Derive the source catalog (label -> { org, domain, url }) from all posts. */
export function buildCatalog(posts) {
  const catalog = {};
  for (const post of posts) {
    for (const s of post.sources) {
      let domain = s.label, origin = s.url;
      try {
        const u = new URL(s.url);
        domain = u.hostname.replace(/^www\./, '');
        origin = u.origin;
      } catch { /* leave as-is */ }
      // Prefer a real site name (from page metadata) as the org label; keep the
      // best one seen for this domain.
      const existing = catalog[s.label];
      const org = s.siteName || existing?.org || domain;
      catalog[s.label] = {
        org,
        domain,
        url: existing?.url || origin,
        favicon: s.favicon || existing?.favicon,
      };
    }
  }
  return catalog;
}

// ---------------------------------------------------------------------------
// Link metadata (page title / site name / description) — best-effort, fetched
// at build time so the Źródła list can show more than a bare domain.
// ---------------------------------------------------------------------------
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

function decodeEntities(s) {
  if (!s) return s;
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;|&apos;|&#x0*27;/gi, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/\s+/g, ' ')
    .trim();
}

/** Read a <meta> content value by property/name (attribute order-independent). */
function metaContent(html, key) {
  const attr = `(?:property|name)=["']${key}["']`;
  const re = new RegExp(`<meta[^>]*${attr}[^>]*>`, 'i');
  const tag = html.match(re)?.[0];
  if (!tag) return '';
  return decodeEntities(tag.match(/content=["']([^"']*)["']/i)?.[1] || '');
}

export function parseMeta(html) {
  const head = html.slice(0, 200_000);
  const title =
    metaContent(head, 'og:title') ||
    metaContent(head, 'twitter:title') ||
    decodeEntities(head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '');
  const siteName = metaContent(head, 'og:site_name');
  const description =
    metaContent(head, 'og:description') ||
    metaContent(head, 'twitter:description') ||
    metaContent(head, 'description');
  const clip = (s, n) => (s && s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);
  return {
    title: clip(title, 140) || undefined,
    siteName: clip(siteName, 60) || undefined,
    description: clip(description, 200) || undefined,
  };
}

async function fetchMeta(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml' },
    });
    const ct = res.headers.get('content-type') || '';
    if (!res.ok || !ct.includes('text/html')) return null;
    const html = await res.text();
    return parseMeta(html);
  } catch {
    return null; // blocked / timed out / not HTML — fall back to the domain
  } finally {
    clearTimeout(timer);
  }
}

/** Download the account's profile picture to public/portrait.jpg (best-effort). */
async function downloadProfilePic(warnings) {
  if (!cfg.profilePicUrl) {
    warnings.push('no profile_picture_url on the account — keeping existing portrait.jpg');
    return;
  }
  const abs = join(ROOT, 'public', 'portrait.jpg');
  try {
    const res = await fetch(cfg.profilePicUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await writeFile(abs, Buffer.from(await res.arrayBuffer()));
    console.log('  Downloaded profile picture → public/portrait.jpg');
  } catch (err) {
    warnings.push(`profile picture download failed (${err.message}); keeping existing portrait.jpg`);
  }
}

/**
 * Download a domain's favicon (via Google's favicon service, reliable even for
 * sites that block us) to public/favicons/{domain}.png. Returns local path or null.
 */
async function downloadFavicon(domain) {
  const rel = `/favicons/${domain}.png`;
  const abs = join(ROOT, 'public', 'favicons', `${domain}.png`);
  if (await exists(abs)) return rel;
  try {
    const res = await fetch(
      `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`,
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await writeFile(abs, Buffer.from(await res.arrayBuffer()));
    return rel;
  } catch {
    return null;
  }
}

/** Fetch page metadata + favicon for every source (in parallel) and attach it. */
async function enrichSources(posts, warnings) {
  const urls = [...new Set(posts.flatMap((p) => p.sources.map((s) => s.url)))];
  if (!urls.length) return;
  const domains = [...new Set(posts.flatMap((p) => p.sources.map((s) => s.label)))];
  console.log(`→ Fetching metadata for ${urls.length} link(s) + ${domains.length} favicon(s)…`);

  const [metaEntries, favEntries] = await Promise.all([
    Promise.all(urls.map(async (u) => [u, await fetchMeta(u)])),
    Promise.all(domains.map(async (d) => [d, await downloadFavicon(d)])),
  ]);
  const byUrl = new Map(metaEntries);
  const favByDomain = new Map(favEntries);

  let ok = 0;
  for (const post of posts) {
    for (const s of post.sources) {
      const fav = favByDomain.get(s.label);
      if (fav) s.favicon = fav;
      const m = byUrl.get(s.url);
      if (m && (m.title || m.siteName || m.description)) {
        if (m.title) s.title = m.title;
        if (m.siteName) s.siteName = m.siteName;
        if (m.description) s.description = m.description;
        ok++;
      } else {
        warnings.push(`source ${s.url}: no metadata (blocked/timeout) — showing domain only`);
      }
    }
  }
  console.log(`  metadata resolved for ${ok}/${urls.length} link(s).`);
}

// ---------------------------------------------------------------------------
// Thumbnails
// ---------------------------------------------------------------------------
const exists = (p) => access(p, FS.F_OK).then(() => true, () => false);

/** Download a media thumbnail to data/thumbnails/{id}.jpg; returns local rel path or falls back to remote URL. */
async function downloadThumb(media, warnings) {
  const remote = media.media_type === 'VIDEO' ? media.thumbnail_url : media.media_url;
  const urlPath = `${THUMB_URL_PREFIX}/${media.id}.jpg`;
  const abs = join(THUMBS_DIR, `${media.id}.jpg`);
  if (await exists(abs)) return urlPath; // already have it
  if (!remote) {
    warnings.push(`post ${media.id}: no media_url/thumbnail_url available`);
    return null;
  }
  try {
    const res = await fetch(remote);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(abs, buf);
    return urlPath;
  } catch (err) {
    warnings.push(`post ${media.id}: thumbnail download failed (${err.message}); using expiring CDN URL as fallback`);
    return remote; // expiring fallback — better than crashing the build
  }
}

// ---------------------------------------------------------------------------
// Date: IG timestamp -> YYYY-MM-DD in Europe/Warsaw
// ---------------------------------------------------------------------------
export function toWarsawDate(ts) {
  // 'en-CA' yields YYYY-MM-DD; timeZone anchors it to the owner's locale.
  return new Date(ts).toLocaleDateString('en-CA', { timeZone: 'Europe/Warsaw' });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  await loadDotEnv();
  requireConfig();

  console.log('→ Verifying token…');
  await resolveUser();

  // `--whoami` = connectivity check only (used when connecting the account).
  if (process.argv.includes('--whoami')) {
    console.log('✓ Token works. You can now run: npm run fetch:instagram');
    return;
  }

  // `--probe` = diagnose comment access: show comment counts + one raw fetch.
  if (process.argv.includes('--probe')) {
    const mediaProbe = await apiGetAll(`${cfg.userId || 'me'}/media`, {
      fields: 'id,caption,comments_count',
    });
    console.log(`\n[probe] ${mediaProbe.length} media; comments_count per post:`);
    for (const m of mediaProbe.slice(0, 12)) {
      console.log(`  ${m.id}  count=${m.comments_count ?? '?'}  "${(m.caption || '').slice(0, 30)}"`);
    }
    const withComments = mediaProbe.find((m) => (m.comments_count ?? 0) > 0);
    if (withComments) {
      console.log(`\n[probe] raw /comments for ${withComments.id} (count=${withComments.comments_count}):`);
      const raw = await apiGet(apiUrl(`${withComments.id}/comments`, {
        fields: 'id,text,timestamp,username,from{id,username}',
      }));
      console.log(JSON.stringify(raw, null, 2).slice(0, 1500));
    } else {
      console.log('\n[probe] no post reports comments_count > 0.');
    }
    return;
  }

  await mkdir(THUMBS_DIR, { recursive: true });
  await mkdir(join(ROOT, 'public', 'favicons'), { recursive: true });
  await mkdir(dirname(OUT_FILE), { recursive: true });

  const warnings = [];

  await downloadProfilePic(warnings);

  console.log('→ Fetching media…');
  const allMedia = await apiGetAll(`${cfg.userId || 'me'}/media`, {
    fields: 'id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp',
  });
  // Reels only — skip regular feed posts/carousels.
  const isReel = (m) => m.media_product_type === 'REELS' || /\/reel\//.test(m.permalink || '');
  const media = allMedia.filter(isReel);
  console.log(`  ${allMedia.length} media items, ${media.length} reels (skipping ${allMedia.length - media.length} non-reels).`);

  const posts = [];
  for (const m of media) {
    const comments = await apiGetAll(`${m.id}/comments`, {
      fields: 'id,text,timestamp,from{id,username}',
    }).catch((err) => {
      warnings.push(`post ${m.id}: comments fetch failed (${err.message}); treating as no sources`);
      return [];
    });
    if (DEBUG && comments.length) {
      console.log(`\n  [debug] media ${m.id} — "${(m.caption || '').slice(0, 40)}" — ${comments.length} comment(s):`);
      for (const c of comments) {
        const own = isOwnComment(c) ? 'OWN' : `by @${c.from?.username ?? '?'}`;
        console.log(`    [${own}] marker=${hasMarker(c.text)} text="${(c.text || '').slice(0, 80).replace(/\n/g, '⏎')}"`);
      }
    }
    const sources = extractSources(comments, m.id, warnings);
    const thumbnailUrl = await downloadThumb(m, warnings);
    posts.push({
      id: m.id,
      platform: 'Instagram',
      date: toWarsawDate(m.timestamp),
      permalink: m.permalink,
      thumbnailUrl,
      caption: m.caption || '',
      sources, // [] === "Nie dodano jeszcze źródeł" in the UI
    });
  }

  await enrichSources(posts, warnings);

  posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)); // newest first
  const catalog = buildCatalog(posts);

  const payload = { generatedAt: new Date().toISOString(), posts, catalog };

  // Atomic write: only replace a known-good posts.json after everything succeeded.
  const tmp = `${OUT_FILE}.tmp`;
  await writeFile(tmp, JSON.stringify(payload, null, 2) + '\n', 'utf8');
  await rename(tmp, OUT_FILE);

  const withSources = posts.filter((p) => p.sources.length).length;
  console.log(`✓ Wrote ${posts.length} posts (${withSources} with sources) → src/app/data/posts.json`);
  if (warnings.length) {
    console.warn(`\n⚠ ${warnings.length} warning(s):`);
    for (const w of warnings) console.warn(`  - ${w}`);
  }
}

// Run only when executed directly (so the parsing helpers can be imported for tests).
const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  main().catch((err) => {
    // On any fatal error, leave the last good posts.json untouched.
    console.error(`\n✗ Fetch failed: ${err.message}`);
    console.error('  src/app/data/posts.json was NOT modified.');
    // Set exitCode (rather than process.exit) so Node can tear down open
    // sockets cleanly — avoids a libuv assertion on abrupt exit.
    process.exitCode = 1;
  });
}
