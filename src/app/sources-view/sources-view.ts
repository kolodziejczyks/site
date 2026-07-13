import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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

  /** Mobile drill-down: whether the selected source's detail is showing. */
  readonly opened = signal(false);
  back(): void {
    this.opened.set(false);
  }

  private readonly sel = signal(0);
  /** Selected index clamped to the current list length. */
  readonly selIndex = computed(() => Math.min(this.sel(), Math.max(0, this.groups().length - 1)));
  readonly selected = computed(() => this.groups()[this.selIndex()] ?? null);
  readonly citedIn = computed(() => (this.selected() ? plCitedIn(this.selected()!.posts.length) : ''));

  select(i: number): void {
    this.sel.set(i);
    this.opened.set(true); // mobile: reveal the detail
  }

  monogram(org: string): string {
    return (org.trim()[0] ?? '?').toLocaleUpperCase('pl');
  }
}
