import { Injectable, computed, signal } from '@angular/core';
import { CatalogEntry, Post, PostsData, SourceGroup } from './models';
import postsData from './data/posts.json';

export type RangeKey = 'all' | 'month' | '3months' | 'year' | 'custom';

const data = postsData as PostsData;

@Injectable({ providedIn: 'root' })
export class DataService {
  /** All posts, newest first. */
  readonly posts: Post[] = [...data.posts].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  readonly catalog: Record<string, CatalogEntry> = data.catalog;

  // ---- shared date-range filter (Posts + Sources) ----
  readonly range = signal<RangeKey>('month');
  readonly from = signal<string>('');
  readonly to = signal<string>('');

  private readonly bounds = computed<{ lo: string | null; hi: string | null }>(() => {
    const now = new Date();
    const iso = (d: Date) => d.toISOString().slice(0, 10);
    switch (this.range()) {
      case 'month':
        return { lo: iso(new Date(now.getTime() - 30 * 864e5)), hi: null };
      case '3months':
        return { lo: iso(new Date(now.getTime() - 90 * 864e5)), hi: null };
      case 'year':
        return { lo: `${now.getFullYear()}-01-01`, hi: null };
      case 'custom':
        return { lo: this.from() || null, hi: this.to() || null };
      default:
        return { lo: null, hi: null };
    }
  });

  private inRange = (date: string): boolean => {
    const { lo, hi } = this.bounds();
    return (!lo || date >= lo) && (!hi || date <= hi);
  };

  /** Posts within the active range (newest first). */
  readonly filteredPosts = computed<Post[]>(() => this.posts.filter((p) => this.inRange(p.date)));

  /** Sources grouped by domain, each with the in-range posts that cite it. */
  readonly sourceGroups = computed<SourceGroup[]>(() => {
    const byDomain = new Map<string, SourceGroup>();
    const seenPosts = new Map<string, Set<string>>(); // domain -> post ids
    const seenLinks = new Map<string, Set<string>>(); // domain -> urls
    const orderedLabels = Object.keys(this.catalog);
    for (const post of this.filteredPosts()) {
      for (const s of post.sources) {
        const meta = this.catalog[s.label];
        if (!meta) continue;
        let group = byDomain.get(meta.domain);
        if (!group) {
          group = { ...meta, label: s.label, links: [], posts: [] };
          byDomain.set(meta.domain, group);
          seenPosts.set(meta.domain, new Set());
          seenLinks.set(meta.domain, new Set());
        }
        if (!seenPosts.get(meta.domain)!.has(post.id)) {
          seenPosts.get(meta.domain)!.add(post.id);
          group.posts.push(post);
        }
        if (!seenLinks.get(meta.domain)!.has(s.url)) {
          seenLinks.get(meta.domain)!.add(s.url);
          group.links.push(s);
        }
      }
    }
    // Collect in catalog declaration order…
    const seen = new Set<string>();
    const out: SourceGroup[] = [];
    for (const label of orderedLabels) {
      const domain = this.catalog[label].domain;
      const group = byDomain.get(domain);
      if (group && !seen.has(domain)) {
        seen.add(domain);
        out.push(group);
      }
    }
    // …then rank most-cited first (stable sort keeps catalog order on ties).
    out.sort((a, b) => b.posts.length - a.posts.length);
    return out;
  });
}
