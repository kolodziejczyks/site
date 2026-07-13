import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Post } from '../models';

@Component({
  selector: 'app-sources-dialog',
  imports: [MatDialogModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dlg">
      <span class="kicker">Źródła</span>
      <h2 class="title serif">{{ post.caption || 'Wpis' }}</h2>
      <div class="platform">{{ post.platform }}</div>

      <div class="body">
        @if (post.sources.length) {
          <ol class="list">
            @for (s of post.sources; track s.url; let i = $index) {
              <li>
                <span class="num">{{ i + 1 }}</span>
                <a [href]="s.url" target="_blank" rel="noopener">
                  <span class="label">{{ s.label }}</span>
                  <span class="msym">open_in_new</span>
                </a>
              </li>
            }
          </ol>
        } @else {
          <p class="empty">Nie dodano jeszcze źródeł</p>
        }
      </div>

      <div class="actions">
        <button matButton (click)="close()">Zamknij</button>
      </div>
    </div>
  `,
  styleUrl: './sources-dialog.scss',
})
export class SourcesDialog {
  readonly post = inject<Post>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<SourcesDialog>);

  close(): void {
    this.ref.close();
  }
}
