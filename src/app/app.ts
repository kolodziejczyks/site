import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { PostsView } from './posts-view/posts-view';
import { SourcesView } from './sources-view/sources-view';
import { AboutView } from './about-view/about-view';
import { SocialLinks } from './social-links/social-links';
import { HEADER_SOCIALS } from './socials';
import { ThemeService } from './theme.service';

type Tab = 'posts' | 'sources' | 'about';

interface NavItem {
  tab: Tab;
  icon: string;
  label: string;
}

@Component({
  selector: 'app-root',
  imports: [PostsView, SourcesView, AboutView, SocialLinks],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly themeSvc = inject(ThemeService);
  readonly theme = this.themeSvc.theme;

  readonly tab = signal<Tab>('posts');
  readonly subtitle = '@niewiemniczego · yap yap yap';

  readonly nav: NavItem[] = [
    { tab: 'posts', icon: 'grid_view', label: 'Wpisy' },
    { tab: 'sources', icon: 'menu_book', label: 'Źródła' },
    { tab: 'about', icon: 'person', label: 'O mnie' },
  ];

  readonly socials = HEADER_SOCIALS;

  setTab(tab: Tab): void {
    this.tab.set(tab);
  }

  toggleTheme(): void {
    this.themeSvc.toggle();
  }
}
