import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SourceGroup } from '../models';
import { plPosts } from '../util';

interface Bar {
  group: SourceGroup;
  count: number;
  pct: number;
  label: string; // accessible "N wpisów"
}

@Component({
  selector: 'app-sources-chart',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sources-chart.html',
  styleUrl: './sources-chart.scss',
})
export class SourcesChart {
  readonly groups = input.required<SourceGroup[]>();
  /** Optional cap (e.g. 10 for the "Top" chart). */
  readonly limit = input<number | undefined>(undefined);
  readonly title = input<string>('');

  /** Ranked bars (groups arrive already sorted descending by post count). */
  readonly bars = computed<Bar[]>(() => {
    const all = this.groups();
    const max = all.reduce((m, g) => Math.max(m, g.posts.length), 0) || 1;
    const lim = this.limit();
    const shown = lim ? all.slice(0, lim) : all;
    return shown.map((g) => ({
      group: g,
      count: g.posts.length,
      pct: Math.round((g.posts.length / max) * 100),
      label: plPosts(g.posts.length),
    }));
  });

  /** How many sources aren't shown due to the limit (for a "+N more" note). */
  readonly hidden = computed(() => {
    const lim = this.limit();
    return lim ? Math.max(0, this.groups().length - lim) : 0;
  });

  monogram(org: string): string {
    return (org.trim()[0] ?? '?').toLocaleUpperCase('pl');
  }
}
