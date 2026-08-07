import { mkdtempSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { encodeFifaText } from '../shared/text-format';
import type { ImportedDatasetRecord } from './dataset-library';
import { sourceProvenance } from './dataset-library';
import {
  analyzePlayernameDataset,
  createPlayernameIdProfile,
  playernameInteger,
} from './playername-analysis';

describe('Playername ID profile', () => {
  it('rejects empty and non-integer ID values', () => {
    expect(() => playernameInteger('', 'nameid')).toThrow('not a valid integer');
    expect(() => playernameInteger('1.5', 'nameid')).toThrow('not a valid integer');
  });

  it('separates occupied IDs, active-span holes, free capacity, and overflow', () => {
    const profile = createPlayernameIdProfile([-2, 0, 2, 5, 11], { min: 0, max: 9 });

    expect(profile).toMatchObject({
      rangeMin: 0,
      rangeMax: 9,
      activeMax: 5,
      occupiedIds: [-2, 0, 2, 5, 11],
      occupiedCount: 3,
      holeCount: 3,
      capacityCount: 4,
      outOfRangeCount: 2,
      belowRange: { count: 1, min: -2, max: -2, samples: [-2] },
      aboveRange: { count: 1, min: 11, max: 11, samples: [11] },
    });
    expect(profile.buckets).toHaveLength(256);
    expect(profile.buckets.reduce((total, bucket) => total + bucket.occupied, 0)).toBe(3);
    expect(profile.buckets.reduce((total, bucket) => total + bucket.holes, 0)).toBe(3);
    expect(profile.buckets.reduce((total, bucket) => total + bucket.capacity, 0)).toBe(4);
  });

  it('handles exact range boundaries and an empty table', () => {
    const boundaries = createPlayernameIdProfile([0, 9], { min: 0, max: 9 });
    expect(boundaries).toMatchObject({
      activeMax: 9,
      occupiedCount: 2,
      holeCount: 8,
      capacityCount: 0,
      outOfRangeCount: 0,
    });

    const empty = createPlayernameIdProfile([], { min: 100, max: 999 });
    expect(empty).toMatchObject({
      activeMax: undefined,
      occupiedCount: 0,
      holeCount: 0,
      capacityCount: 900,
      outOfRangeCount: 0,
    });
  });

  it('caps sorted overflow samples without losing totals or extrema', () => {
    const overflow = Array.from({ length: 30 }, (_, index) => 100 + index);
    const profile = createPlayernameIdProfile(overflow, { min: 0, max: 9 });

    expect(profile.aboveRange).toEqual({
      count: 30,
      min: 100,
      max: 129,
      samples: overflow.slice(0, 20),
    });
  });

  it('analyzes the current managed text representation instead of t3db provenance', async () => {
    const root = mkdtempSync(join(tmpdir(), 'qdb-playername-analysis-'));
    const text = join(root, 'text');
    await mkdir(text);
    await Promise.all([
      writeFile(
        join(text, 'playernames.txt'),
        encodeFifaText(
          ['name', 'nameid'],
          [
            { name: 'In range', nameid: 10 },
            { name: 'Out of range', nameid: 50_001 },
          ],
        ),
      ),
      writeFile(
        join(text, 'players.txt'),
        encodeFifaText(
          ['firstnameid', 'lastnameid', 'playerjerseynameid', 'commonnameid'],
          [{ firstnameid: 10, lastnameid: 50_001, playerjerseynameid: 10, commonnameid: 50_001 }],
        ),
      ),
    ]);
    const dataset: ImportedDatasetRecord = {
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Managed text fixture',
      fifaVersion: 21,
      source: sourceProvenance('t3db', ['/original.db', '/original.xml'], {}),
      managedFormat: 'text-folder',
      updatedAt: new Date(0).toISOString(),
      status: 'available',
      tableNames: ['players', 'playernames'],
      tableCount: 2,
      rowCount: 3,
      warnings: [],
      snapshotDirectory: root,
    };

    await expect(analyzePlayernameDataset(dataset)).resolves.toMatchObject([
      {
        table: 'playernames',
        profile: { occupiedCount: 1, outOfRangeCount: 1, activeMax: 10 },
      },
    ]);
    await expect(analyzePlayernameDataset(dataset, undefined, () => true)).rejects.toThrow(
      'PLAYERNAMES_CANCELLED',
    );
  });

  it('returns playernames and dcplayernames profiles when both tables are supported', async () => {
    const root = mkdtempSync(join(tmpdir(), 'qdb-playername-union-analysis-'));
    const text = join(root, 'text');
    await mkdir(text);
    await Promise.all([
      writeFile(
        join(text, 'playernames.txt'),
        encodeFifaText(['name', 'nameid'], [{ name: 'Main', nameid: 0 }]),
      ),
      writeFile(
        join(text, 'dcplayernames.txt'),
        encodeFifaText(['name', 'nameid'], [{ name: 'DC', nameid: 44_000 }]),
      ),
      writeFile(
        join(text, 'players.txt'),
        encodeFifaText(
          ['firstnameid', 'lastnameid', 'playerjerseynameid', 'commonnameid'],
          [
            {
              firstnameid: 0,
              lastnameid: 44_000,
              playerjerseynameid: 0,
              commonnameid: 44_000,
            },
          ],
        ),
      ),
    ]);
    const dataset: ImportedDatasetRecord = {
      id: '22222222-2222-4222-8222-222222222222',
      name: 'Both name tables',
      fifaVersion: 21,
      source: sourceProvenance('text-folder', ['/fixture'], {}),
      managedFormat: 'text-folder',
      updatedAt: new Date(0).toISOString(),
      status: 'available',
      tableNames: ['players', 'playernames', 'dcplayernames'],
      tableCount: 3,
      rowCount: 3,
      warnings: [],
      snapshotDirectory: root,
    };

    await expect(analyzePlayernameDataset(dataset)).resolves.toMatchObject([
      { table: 'playernames', profile: { rangeMin: 0, rangeMax: 43_999 } },
      { table: 'dcplayernames', profile: { rangeMin: 44_000, rangeMax: 50_000 } },
    ]);
  });
});
