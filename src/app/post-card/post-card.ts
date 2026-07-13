import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  computed,
  inject,
  input,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { Post } from '../models';
import { formatPlDate } from '../util';
import { SourcesDialog } from '../sources-dialog/sources-dialog';

@Component({
  selector: 'app-post-card',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './post-card.html',
  styleUrl: './post-card.scss',
})
export class PostCard {
  readonly post = input.required<Post>();
  /** Compact = thumbnail + platform tag only (used in the Sources detail grid). */
  readonly compact = input(false);

  private readonly dialog = inject(MatDialog);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly dateLabel = computed(() => formatPlDate(this.post().date));

  openPost(): void {
    if (this.isBrowser) window.open(this.post().permalink, '_blank', 'noopener');
  }

  openSources(event: MouseEvent): void {
    event.stopPropagation();
    this.dialog.open(SourcesDialog, {
      data: this.post(),
      panelClass: 'sources-dialog-panel',
      autoFocus: 'dialog',
      width: 'min(520px, 92vw)',
    });
  }
}
