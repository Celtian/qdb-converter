import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { encodeFifaText } from '../shared/text-format';
import {
  analyzeDatasetIdTable,
  analyzeDatasetIds,
  canonicalIdField,
  createDatasetIdProfile,
} from './dataset-id-analysis';
import type { ConvertedDatasetRecord } from './dataset-library';

describe('dataset ID analysis', () => {
  it('creates deterministic exact profiles with holes, capacity, and overflow', () => {
    const values = [-2, 0, 2, 5, 11, 2];
    const profile = createDatasetIdProfile(values, { min: 0, max: 9 });

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
    expect(profile.buckets.reduce((sum, bucket) => sum + bucket.occupied, 0)).toBe(3);
    expect(profile.buckets.reduce((sum, bucket) => sum + bucket.holes, 0)).toBe(3);
    expect(profile.buckets.reduce((sum, bucket) => sum + bucket.capacity, 0)).toBe(4);

    const large = createDatasetIdProfile(
      Array.from({ length: 500_000 }, (_, index) => index),
      { min: 0, max: 500_000 },
    );
    expect(large).toMatchObject({ occupiedCount: 500_000, holeCount: 0, capacityCount: 1 });
    expect(large.occupiedIds).toHaveLength(500_000);
  });

  it('resolves version-aware canonical keys without using foreign keys', () => {
    expect(canonicalIdField(23, 'competition')?.name).toBe('competitionid');
    expect(canonicalIdField(23, 'formations')?.name).toBe('formationid');
    expect(canonicalIdField(23, 'players')?.name).toBe('playerid');
    expect(canonicalIdField(23, 'playernames')?.name).toBe('nameid');
    expect(canonicalIdField(22, 'teams')?.name).toBe('teamid');
    expect(canonicalIdField(23, 'teamplayerlinks')?.name).toBe('artificialkey');
    expect(canonicalIdField(23, 'leaguerefereelinks')).toBeUndefined();
    expect(canonicalIdField(23, 'teamstadiumlinks')).toBeUndefined();
    expect(canonicalIdField(23, 'dcplayernames')).toBeUndefined();
  });

  it('reports duplicates and invalid IDs without hiding the valid profile', () => {
    const result = analyzeDatasetIdTable(23, 'players', {
      headers: ['playerid', 'firstnameid'],
      rows: [
        { playerid: 0, firstnameid: 1 },
        { playerid: '2', firstnameid: 1 },
        { playerid: 2, firstnameid: 1 },
        { playerid: 'invalid', firstnameid: 1 },
        { playerid: 500_001, firstnameid: 1 },
      ],
    });

    expect(result).toMatchObject({
      keyField: 'playerid',
      rows: 5,
      duplicateCount: 1,
      duplicateSamples: [2],
      invalidCount: 1,
      invalidSamples: [{ row: 4, value: 'invalid' }],
      profile: { occupiedCount: 2, holeCount: 1, outOfRangeCount: 1 },
    });
  });

  it('returns an explicit unavailable state for tables without a canonical ranged key', () => {
    expect(
      analyzeDatasetIdTable(23, 'leaguerefereelinks', {
        headers: ['leagueid', 'refereeid'],
        rows: [{ leagueid: 1, refereeid: 2 }],
      }),
    ).toMatchObject({
      rows: 1,
      duplicateCount: 0,
      invalidCount: 0,
      unavailableReason: expect.stringContaining('No unique integer ID'),
    });
  });

  it('analyzes every managed text table and isolates per-table failures', async () => {
    const root = await mkdtemp(join(tmpdir(), 'qdb-dataset-id-analysis-'));
    await mkdir(root, { recursive: true });
    await writeFile(
      join(root, 'players.txt'),
      encodeFifaText(
        ['playerid', 'firstnameid'],
        [
          { playerid: 0, firstnameid: 1 },
          { playerid: 2, firstnameid: 1 },
        ],
      ),
    );
    await writeFile(
      join(root, 'leaguerefereelinks.txt'),
      encodeFifaText(['leagueid', 'refereeid'], [{ leagueid: 1, refereeid: 2 }]),
    );
    await writeFile(join(root, 'videos.txt'), encodeFifaText(['videoid'], [{ videoid: 1 }]));
    await writeFile(join(root, 'version.txt'), encodeFifaText(['version'], [{ version: 1 }]));
    const dataset: ConvertedDatasetRecord = {
      id: '33333333-3333-4333-8333-333333333333',
      name: 'Fixture',
      resultKind: 'conversion',
      sourceDatasetKind: 'imported',
      sourceDatasetId: '11111111-1111-4111-8111-111111111111',
      sourceDatasetName: 'Source',
      sourceVersion: 23,
      fifaVersion: 23,
      createdAt: new Date(0).toISOString(),
      updatedAt: new Date(0).toISOString(),
      status: 'available',
      tableNames: ['players', 'leaguerefereelinks', 'teams', 'videos', 'version'],
      tableCount: 3,
      rowCount: 3,
      tableSummaries: [],
      warnings: [],
      snapshotDirectory: root,
    };
    const progress: string[] = [];

    const tables = await analyzeDatasetIds(dataset, (message) => progress.push(message));

    expect(tables.map((table) => table.table)).toEqual(['leaguerefereelinks', 'players', 'teams']);
    expect(tables.find((table) => table.table === 'players')?.profile).toMatchObject({
      occupiedCount: 2,
      holeCount: 1,
    });
    expect(
      tables.find((table) => table.table === 'leaguerefereelinks')?.unavailableReason,
    ).toBeTruthy();
    expect(tables.find((table) => table.table === 'teams')?.error).toContain('missing');
    expect(tables.some((table) => table.table === 'videos' || table.table === 'version')).toBe(
      false,
    );
    expect(progress.at(-1)).toBe('Dataset ID analysis completed.');
  });
});
