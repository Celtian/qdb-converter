import { Service, signal } from '@angular/core';

export type ThemePreference = 'system' | 'light' | 'dark';

@Service()
export class Theme {
  readonly preference = signal<ThemePreference>(
    (localStorage.getItem('qdb-converter-theme') as ThemePreference | null) ?? 'system',
  );

  constructor() {
    this.apply(this.preference());
  }

  set(preference: ThemePreference): void {
    this.preference.set(preference);
    localStorage.setItem('qdb-converter-theme', preference);
    this.apply(preference);
  }

  private apply(preference: ThemePreference): void {
    document.documentElement.style.colorScheme =
      preference === 'system' ? 'light dark' : preference;
    document.documentElement.dataset['theme'] = preference;
  }
}
