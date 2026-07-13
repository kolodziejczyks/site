import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-about-view',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './about-view.html',
  styleUrl: './about-view.scss',
})
export class AboutView {}
