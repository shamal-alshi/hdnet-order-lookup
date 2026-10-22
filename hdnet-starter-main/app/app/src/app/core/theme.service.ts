import { Injectable, signal } from '@angular/core';

type Theme = 'light' | 'dark';

const themeKey = 'hdnet.theme';

@Injectable({ providedIn: 'root' })
/** Persists the staff member's colour preference for the current browser session. */
export class ThemeService {
  private readonly themeState = signal<Theme>(this.readTheme());

  readonly theme = this.themeState.asReadonly();

  constructor() {
    this.apply(this.themeState());
  }

  toggle(): void {
    const nextTheme = this.themeState() === 'light' ? 'dark' : 'light';
    this.themeState.set(nextTheme);
    this.apply(nextTheme);
  }

  private readTheme(): Theme {
    if (typeof window === 'undefined') return 'light';
    return sessionStorage.getItem(themeKey) === 'dark' ? 'dark' : 'light';
  }

  private apply(theme: Theme): void {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle('dark-theme', theme === 'dark');
    sessionStorage.setItem(themeKey, theme);
  }
}
