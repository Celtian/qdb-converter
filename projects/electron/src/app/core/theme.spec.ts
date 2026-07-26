import { TestBed } from '@angular/core/testing';

import { Theme } from './theme';

describe('Theme', () => {
  let service: Theme;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Theme);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('applies and persists explicit theme preferences', () => {
    service.set('dark');
    expect(service.preference()).toBe('dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');
    expect(localStorage.getItem('qdb-converter-theme')).toBe('dark');
    service.set('system');
    expect(document.documentElement.style.colorScheme).toBe('light dark');
  });
});
