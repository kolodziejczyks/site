import { DOCUMENT, Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'light' | 'dark';
const STORAGE_KEY = 'theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly theme = signal<Theme>('light');

  constructor() {
    if (!this.isBrowser) return;
    let stored: Theme | null = null;
    let prefersDark = false;
    try {
      const win = this.doc.defaultView;
      if (typeof win?.localStorage?.getItem === 'function') {
        stored = win.localStorage.getItem(STORAGE_KEY) as Theme | null;
      }
      if (typeof win?.matchMedia === 'function') {
        prefersDark = win.matchMedia('(prefers-color-scheme: dark)').matches;
      }
    } catch {
      /* storage/matchMedia unavailable — fall back to light */
    }
    this.set(stored ?? (prefersDark ? 'dark' : 'light'));
  }

  toggle(): void {
    this.set(this.theme() === 'dark' ? 'light' : 'dark');
  }

  set(theme: Theme): void {
    this.theme.set(theme);
    const root = this.doc.documentElement;
    if (theme === 'dark') root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
    if (this.isBrowser) {
      try {
        this.doc.defaultView?.localStorage?.setItem(STORAGE_KEY, theme);
      } catch {
        /* storage unavailable — ignore */
      }
    }
  }
}
