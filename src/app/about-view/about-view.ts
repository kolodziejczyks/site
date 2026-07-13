import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SocialLinks } from '../social-links/social-links';
import { ABOUT_SOCIALS } from '../socials';

@Component({
  selector: 'app-about-view',
  imports: [SocialLinks],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './about-view.html',
  styleUrl: './about-view.scss',
})
export class AboutView {
  readonly socials = ABOUT_SOCIALS;
}
