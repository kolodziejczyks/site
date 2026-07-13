import { TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { DataService } from './data.service';
import { PostsView } from './posts-view/posts-view';
import { SourcesView } from './sources-view/sources-view';
import { plPosts, plCitedIn, formatPlDate } from './util';

function providers() {
  return [provideAnimationsAsync(), provideNativeDateAdapter()];
}

describe('util (Polish)', () => {
  it('pluralizes wpis correctly', () => {
    expect(plPosts(1)).toBe('1 wpis');
    expect(plPosts(3)).toBe('3 wpisy');
    expect(plPosts(5)).toBe('5 wpisów');
    expect(plPosts(12)).toBe('12 wpisów');
    expect(plPosts(22)).toBe('22 wpisy');
  });

  it('formats pl-PL dates', () => {
    expect(formatPlDate('2026-07-10')).toContain('2026');
  });

  it('phrases cited-in', () => {
    expect(plCitedIn(1)).toContain('1 wpisie');
    expect(plCitedIn(3)).toContain('3 wpisach');
  });
});

describe('DataService', () => {
  it('groups sources by domain, one group per cited domain, each non-empty', () => {
    TestBed.configureTestingModule({ providers: providers() });
    const svc = TestBed.inject(DataService);
    svc.range.set('all');
    const groups = svc.sourceGroups();

    // Groups are unique by domain and never empty.
    const domains = groups.map((g) => g.domain);
    expect(new Set(domains).size).toBe(groups.length);
    for (const g of groups) {
      expect(g.domain).toBeTruthy();
      expect(g.posts.length).toBeGreaterThan(0);
    }

    // One group per distinct domain actually cited across all posts (data-agnostic).
    const cited = new Set<string>();
    for (const p of svc.posts) {
      for (const s of p.sources) {
        const d = svc.catalog[s.label]?.domain;
        if (d) cited.add(d);
      }
    }
    expect(groups.length).toBe(cited.size);
  });

  it('narrows the feed when the range shrinks', () => {
    TestBed.configureTestingModule({ providers: providers() });
    const svc = TestBed.inject(DataService);
    svc.range.set('all');
    const all = svc.filteredPosts().length;
    svc.range.set('custom');
    svc.from.set('2099-01-01');
    svc.to.set('2099-12-31');
    expect(svc.filteredPosts().length).toBe(0);
    expect(all).toBeGreaterThan(0);
  });
});

describe('PostsView', () => {
  it('renders the empty state for an out-of-range window', async () => {
    TestBed.configureTestingModule({ imports: [PostsView], providers: providers() });
    const svc = TestBed.inject(DataService);
    svc.range.set('custom');
    svc.from.set('2099-01-01');
    svc.to.set('2099-12-31');
    const fixture = TestBed.createComponent(PostsView);
    await fixture.whenStable();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Brak wpisów w tym zakresie dat.');
  });

  it('renders one card per post, with badges/empty-labels matching the data', async () => {
    TestBed.configureTestingModule({ imports: [PostsView], providers: providers() });
    const svc = TestBed.inject(DataService);
    svc.range.set('all');
    const fixture = TestBed.createComponent(PostsView);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    const withSources = svc.posts.filter((p) => p.sources.length > 0).length;
    const withoutSources = svc.posts.length - withSources;

    expect(el.querySelectorAll('.thumb').length).toBe(svc.posts.length);
    expect(el.querySelectorAll('.sources-btn').length).toBe(withSources);
    expect(el.querySelectorAll('.no-sources').length).toBe(withoutSources);
  });
});

describe('SourcesView', () => {
  it('renders a row per source group and a selected detail (or the empty state)', async () => {
    TestBed.configureTestingModule({ imports: [SourcesView], providers: providers() });
    const svc = TestBed.inject(DataService);
    svc.range.set('all');
    const fixture = TestBed.createComponent(SourcesView);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const groups = svc.sourceGroups();

    if (groups.length > 0) {
      expect(el.querySelectorAll('.row').length).toBe(groups.length);
      expect(el.textContent ?? '').toContain('Cytowane w');
    } else {
      expect(el.textContent ?? '').toContain('Brak źródeł w tym zakresie dat.');
    }
  });
});
