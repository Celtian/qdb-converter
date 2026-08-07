import { mkdtempSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

import type { ImportedDatasetRecord } from './dataset-library';
import { sourceProvenance } from './dataset-library';

const openFifaDatabase = vi.fn(() => ({
  schema: {
    tables: [
      { name: 'players', fields: [{ name: 'playerid' }, { name: 'firstnameid' }] },
      {
        name: 'leaguerefereelinks',
        fields: [{ name: 'leagueid' }, { name: 'refereeid' }],
      },
      { name: 'videos', fields: [{ name: 'videoid' }] },
    ],
  },
  listTables: () => [{ name: 'players' }, { name: 'leaguerefereelinks' }, { name: 'videos' }],
  readTable: (name: string) =>
    name === 'players'
      ? {
          rows: [
            { playerid: 0, firstnameid: 1 },
            { playerid: 2, firstnameid: 1 },
          ],
        }
      : { rows: [{ leagueid: 1, refereeid: 2 }] },
}));

vi.mock('fifa-t3db', () => ({ openFifaDatabase }));

describe('t3db dataset ID analysis', () => {
  it('reads the managed t3db representation and analyzes every supported listed table', async () => {
    const { analyzeDatasetIds } = await import('./dataset-id-analysis');
    const root = mkdtempSync(join(tmpdir(), 'qdb-dataset-id-t3db-'));
    await Promise.all([
      writeFile(join(root, 'database.db'), 'database'),
      writeFile(join(root, 'metadata.xml'), '<metadata />'),
    ]);
    const dataset: ImportedDatasetRecord = {
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Fixture',
      fifaVersion: 23,
      source: sourceProvenance('t3db', ['/fixture.db', '/fixture.xml'], {}),
      managedFormat: 't3db',
      updatedAt: new Date(0).toISOString(),
      status: 'available',
      tableNames: ['players', 'leaguerefereelinks', 'videos'],
      tableCount: 2,
      rowCount: 3,
      warnings: [],
      snapshotDirectory: root,
    };

    const tables = await analyzeDatasetIds(dataset);

    expect(openFifaDatabase).toHaveBeenCalledOnce();
    expect(tables.find((table) => table.table === 'players')).toMatchObject({
      rows: 2,
      keyField: 'playerid',
      profile: { occupiedCount: 2, holeCount: 1 },
    });
    expect(tables.find((table) => table.table === 'leaguerefereelinks')).toMatchObject({
      rows: 1,
      unavailableReason: expect.stringContaining('No unique integer ID'),
    });
    expect(tables.some((table) => table.table === 'videos')).toBe(false);
  });
});
