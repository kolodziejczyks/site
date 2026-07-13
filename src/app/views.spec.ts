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
  it('groups sources by domain within the "all" range', () => {
    TestBed.configureTestingModule({ providers: providers() });
    const svc = TestBed.inject(DataService);
    svc.range.set('all');
    const groups = svc.sourceGroups();
    // Sample data cites 7 distinct source domains.
    expect(groups.length).toBe(7);
    const oecd = groups.find((g) => g.domain === 'oecd.org');
    expect(oecd?.org).toBe('OECD');
    expect(oecd?.posts.length).toBeGreaterThan(0);
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

  it('shows the empty-sources label on a post without sources', async () => {
    TestBed.configureTestingModule({ imports: [PostsView], providers: providers() });
    const svc = TestBed.inject(DataService);
    svc.range.set('all');
    const fixture = TestBed.createComponent(PostsView);
    await fixture.whenStable();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Nie dodano jeszcze źródeł');
    expect(text).toContain('Źródła · 2');
  });
});

describe('SourcesView', () => {
  it('renders the source list and a selected detail', async () => {
    TestBed.configureTestingModule({ imports: [SourcesView], providers: providers() });
    const svc = TestBed.inject(DataService);
    svc.range.set('all');
    const fixture = TestBed.createComponent(SourcesView);
    await fixture.whenStable();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('OECD');
    expect(text).toContain('Cytowane w');
  });
});
