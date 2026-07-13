import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SocialLinks } from './social-links/social-links';
import { HEADER_SOCIALS } from './socials';
import { ThemeService } from './theme.service';

interface NavItem {
  path: string;
  icon: string;
  label: string;
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, SocialLinks],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly themeSvc = inject(ThemeService);
  readonly theme = this.themeSvc.theme;

  readonly subtitle = '@niewiemniczego · yap yap yap';

  readonly nav: NavItem[] = [
    { path: '', icon: 'grid_view', label: 'Wpisy' },
    { path: 'zrodla', icon: 'menu_book', label: 'Źródła' },
    { path: 'o-mnie', icon: 'person', label: 'O mnie' },
  ];

  readonly socials = HEADER_SOCIALS;

  toggleTheme(): void {
    this.themeSvc.toggle();
  }
}
