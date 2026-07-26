import { describe, expect, it } from 'vitest';
import {
  fieldsFor,
  fifaForVersion,
  isSupportedTable,
  isSupportedVersion,
  tableForName,
} from './table-config';

describe('FIFA schema configuration', () => {
  it('maps supported FIFA versions and tables', () => {
    expect(fifaForVersion(23)).toBe('fifa23');
    expect(tableForName('PLAYERS')).toBe('players');
    expect(fieldsFor(23, 'players').length).toBeGreaterThan(100);
    expect(isSupportedVersion(11)).toBe(true);
    expect(isSupportedVersion(24)).toBe(false);
    expect(isSupportedTable('players')).toBe(true);
    expect(isSupportedTable('unknown')).toBe(false);
  });

  it('rejects unsupported versions and tables', () => {
    expect(() => fifaForVersion(10)).toThrow(/Unsupported FIFA/);
    expect(() => tableForName('unknown')).toThrow(/Unsupported table/);
  });
});
