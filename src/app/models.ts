export type Platform = 'Instagram' | 'YouTube' | 'TikTok';

export interface Source {
  /** Domain (used for grouping/fallback display). */
  label: string;
  url: string;
  /** Page metadata fetched at build time (best-effort; may be absent). */
  title?: string;
  siteName?: string;
  description?: string;
}

export interface Post {
  id: string;
  platform: Platform;
  /** YYYY-MM-DD (Europe/Warsaw). */
  date: string;
  permalink: string;
  /** Local served path (e.g. /thumbnails/{id}.jpg) or null when not yet available. */
  thumbnailUrl: string | null;
  caption?: string;
  sources: Source[];
}

export interface CatalogEntry {
  org: string;
  domain: string;
  url: string;
}

export interface PostsData {
  generatedAt: string;
  posts: Post[];
  catalog: Record<string, CatalogEntry>;
}

/** A source grouped with the posts (in the current filter range) that cite it. */
export interface SourceGroup extends CatalogEntry {
  label: string;
  posts: Post[];
}
