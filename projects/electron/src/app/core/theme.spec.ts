import { TestBed } from '@angular/core/testing';

import { Theme } from './theme';

describe('Theme', () => {
  let service: Theme;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.style.removeProperty('color-scheme');
    TestBed.configureTestingModule({});
    service = TestBed.inject(Theme);
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.style.removeProperty('color-scheme');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it.each([
    ['system', 'light dark'],
    ['light', 'light'],
    ['dark', 'dark'],
  ] as const)('applies the %s preference', (preference, colorScheme) => {
    service.set(preference);

    expect(service.preference()).toBe(preference);
    expect(document.documentElement.dataset['theme']).toBe(preference);
    expect(document.documentElement.style.colorScheme).toBe(colorScheme);
    expect(localStorage.getItem('qdb-converter-theme')).toBe(preference);
  });

  it('restores a persisted preference', () => {
    localStorage.setItem('qdb-converter-theme', 'dark');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    service = TestBed.inject(Theme);

    expect(service.preference()).toBe('dark');
    expect(document.documentElement.dataset['theme']).toBe('dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });
});
