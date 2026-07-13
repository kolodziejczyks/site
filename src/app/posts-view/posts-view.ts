import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DataService, RangeKey } from '../data.service';
import { DateFilter } from '../date-filter/date-filter';
import { PostCard } from '../post-card/post-card';
import { plPosts } from '../util';

const RANGE_LABELS: Record<RangeKey, string> = {
  all: 'Wszystko',
  month: 'Ostatni miesiąc',
  '3months': 'Ostatnie 3 miesiące',
  year: 'Ten rok',
  custom: 'Wybrany zakres',
};

@Component({
  selector: 'app-posts-view',
  imports: [DateFilter, PostCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './posts-view.html',
  styleUrl: './posts-view.scss',
})
export class PostsView {
  private readonly data = inject(DataService);
  readonly posts = this.data.filteredPosts;
  readonly heading = computed(() => RANGE_LABELS[this.data.range()]);
  readonly count = computed(() => plPosts(this.posts().length));
}
