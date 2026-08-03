import { describe, expect, it } from 'vitest';

import { parseDatasetKinds } from './dataset-cleanup';

describe('dataset cleanup request validation', () => {
  it('accepts either category or both unique categories', () => {
    expect(parseDatasetKinds(['imported'])).toEqual(['imported']);
    expect(parseDatasetKinds(['converted'])).toEqual(['converted']);
    expect(parseDatasetKinds(['imported', 'converted'])).toEqual(['imported', 'converted']);
  });

  it.each([
    undefined,
    'imported',
    [],
    ['unknown'],
    ['imported', 'imported'],
    ['imported', 'converted', 'imported'],
  ])('rejects invalid categories: %j', (value) => {
    expect(() => parseDatasetKinds(value)).toThrow('Invalid dataset categories.');
  });
});
