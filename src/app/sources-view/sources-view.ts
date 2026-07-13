import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { DataService } from '../data.service';
import { DateFilter } from '../date-filter/date-filter';
import { PostCard } from '../post-card/post-card';
import { SourcesChart } from '../sources-chart/sources-chart';
import { plCitedIn } from '../util';

type SourcesViewMode = 'list' | 'chart';

@Component({
  selector: 'app-sources-view',
  imports: [DateFilter, PostCard, SourcesChart, MatButtonToggleModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sources-view.html',
  styleUrl: './sources-view.scss',
})
export class SourcesView {
  private readonly data = inject(DataService);
  readonly groups = this.data.sourceGroups;

  readonly view = signal<SourcesViewMode>('list');
  setView(v: SourcesViewMode): void {
    this.view.set(v);
  }

  private readonly doc = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private savedScrollY = 0;

  private isMobile(): boolean {
    return this.isBrowser && (this.doc.defaultView?.innerWidth ?? 1000) <= 900;
  }

  /** Mobile drill-down: whether the selected source's detail is showing. */
  readonly opened = signal(false);
  back(): void {
    const y = this.savedScrollY;
    this.opened.set(false);
    if (this.isMobile()) {
      // Restore the list scroll position after it re-renders.
      setTimeout(() => this.doc.defaultView?.scrollTo(0, y), 0);
    }
  }

  private readonly sel = signal(0);
  /** Selected index clamped to the current list length. */
  readonly selIndex = computed(() => Math.min(this.sel(), Math.max(0, this.groups().length - 1)));
  readonly selected = computed(() => this.groups()[this.selIndex()] ?? null);
  readonly citedIn = computed(() => (this.selected() ? plCitedIn(this.selected()!.posts.length) : ''));

  select(i: number): void {
    this.sel.set(i);
    if (this.isMobile()) {
      if (!this.opened()) this.savedScrollY = this.doc.defaultView?.scrollY ?? 0;
      this.opened.set(true); // reveal the detail…
      this.doc.defaultView?.scrollTo(0, 0); // …starting at its top
    } else {
      this.opened.set(true);
    }
  }

  monogram(org: string): string {
    return (org.trim()[0] ?? '?').toLocaleUpperCase('pl');
  }
}
