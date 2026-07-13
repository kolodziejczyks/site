import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Social } from '../socials';

@Component({
  selector: 'app-social-links',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './social-links.html',
  styleUrl: './social-links.scss',
})
export class SocialLinks {
  readonly links = input.required<Social[]>();
}
