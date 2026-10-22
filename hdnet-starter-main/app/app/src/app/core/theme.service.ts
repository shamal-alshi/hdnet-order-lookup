import { Injectable, signal } from '@angular/core';

type Theme = 'light' | 'dark';

const storageKey = 'hdnet.orders-theme';

@Injectable({ providedIn: 'root' })
/** Stores the order workspace colour preference for the current browser session. */
export class ThemeService {
  private readonly currentTheme = signal<Theme>(this.readTheme());

  readonly theme = this.currentTheme.asReadonly();

  constructor() {
    this.apply(this.currentTheme());
  }

  toggle(): void {
    const theme = this.currentTheme() === 'light' ? 'dark' : 'light';
    this.currentTheme.set(theme);
    this.apply(theme);
  }

  private readTheme(): Theme {
    return typeof window !== 'undefined' && sessionStorage.getItem(storageKey) === 'dark'
      ? 'dark'
      : 'light';
  }

  private apply(theme: Theme): void {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle('dark-theme', theme === 'dark');
    sessionStorage.setItem(storageKey, theme);
  }
}
