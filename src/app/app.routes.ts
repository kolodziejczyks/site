import { Routes } from '@angular/router';
import { PostsView } from './posts-view/posts-view';
import { SourcesView } from './sources-view/sources-view';
import { AboutView } from './about-view/about-view';

export const routes: Routes = [
  { path: '', component: PostsView, title: 'Szymon Kołodziejczyk — Wpisy' },
  { path: 'zrodla', component: SourcesView, title: 'Źródła — Szymon Kołodziejczyk' },
  { path: 'o-mnie', component: AboutView, title: 'O mnie — Szymon Kołodziejczyk' },
  { path: '**', redirectTo: '' },
];
