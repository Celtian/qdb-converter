import { TestBed } from '@angular/core/testing';

import { DatasetColumnPreferences, datasetColumnPreferenceKey } from './dataset-column-preferences';

describe('DatasetColumnPreferences', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('provides independent built-in layouts for both dataset tables', () => {
    const preferences = TestBed.inject(DatasetColumnPreferences);

    expect(preferences.load('imported')).toEqual({
      version: 1,
      order: ['name', 'version', 'source', 'tables', 'rows', 'imported', 'status', 'actions'],
      visible: ['name', 'version', 'source', 'tables', 'rows', 'imported', 'status', 'actions'],
    });
    expect(preferences.load('converted')).toEqual({
      version: 1,
      order: ['name', 'source', 'target', 'tables', 'rows', 'created', 'status', 'actions'],
      visible: ['name', 'source', 'target', 'tables', 'rows', 'created', 'status', 'actions'],
    });
  });

  it('persists each table independently and forces required columns visible', () => {
    const preferences = TestBed.inject(DatasetColumnPreferences);
    preferences.save('imported', {
      version: 1,
      order: ['status', 'actions', 'name', 'rows', 'source', 'tables', 'version', 'imported'],
      visible: ['status'],
    });

    expect(preferences.load('imported')).toEqual({
      version: 1,
      order: ['status', 'actions', 'name', 'rows', 'source', 'tables', 'version', 'imported'],
      visible: ['status', 'actions', 'name'],
    });
    expect(localStorage.getItem(datasetColumnPreferenceKey('converted'))).toBeNull();
    expect(preferences.load('converted').visible).toContain('created');
  });

  it('normalizes duplicate, unknown, and newly introduced columns', () => {
    const preferences = TestBed.inject(DatasetColumnPreferences);
    localStorage.setItem(
      datasetColumnPreferenceKey('converted'),
      JSON.stringify({
        version: 1,
        order: ['status', 'name', 'status', 'unknown'],
        visible: ['status', 'unknown'],
      }),
    );

    expect(preferences.load('converted')).toEqual({
      version: 1,
      order: ['status', 'name', 'source', 'target', 'tables', 'rows', 'created', 'actions'],
      visible: ['status', 'name', 'source', 'target', 'tables', 'rows', 'created', 'actions'],
    });
  });

  it('falls back to defaults for malformed, unsupported, or unavailable storage', () => {
    const preferences = TestBed.inject(DatasetColumnPreferences);
    localStorage.setItem(datasetColumnPreferenceKey('imported'), '{invalid');
    expect(preferences.load('imported').visible).toContain('imported');

    localStorage.setItem(
      datasetColumnPreferenceKey('imported'),
      JSON.stringify({ version: 2, order: [], visible: [] }),
    );
    expect(preferences.load('imported').visible).toContain('version');

    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage unavailable');
    });
    expect(preferences.load('converted').visible).toContain('target');
    getItem.mockRestore();
  });

  it('resets one table without removing the other layout', () => {
    const preferences = TestBed.inject(DatasetColumnPreferences);
    localStorage.setItem(datasetColumnPreferenceKey('imported'), '{}');
    localStorage.setItem(datasetColumnPreferenceKey('converted'), '{}');

    preferences.reset('imported');

    expect(localStorage.getItem(datasetColumnPreferenceKey('imported'))).toBeNull();
    expect(localStorage.getItem(datasetColumnPreferenceKey('converted'))).toBe('{}');
  });
});
