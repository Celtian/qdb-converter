import { mkdtempSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

import { parseTextTable } from '../shared/text-format';
import type { ImportedDatasetRecord } from './dataset-library';
import { sourceProvenance } from './dataset-library';

const openFifaDatabase = vi.fn(() => ({
  schema: {
    tables: [
      { name: 'playernames', fields: [{ name: 'name' }, { name: 'nameid' }] },
      {
        name: 'players',
        fields: [
          { name: 'firstnameid' },
          { name: 'lastnameid' },
          { name: 'playerjerseynameid' },
          { name: 'commonnameid' },
        ],
      },
      { name: 'custom', fields: [{ name: 'value' }] },
    ],
  },
  listTables: () => [{ name: 'playernames' }, { name: 'players' }, { name: 'custom' }],
  readTable: (name: string) => {
    switch (name) {
      case 'playernames':
        return {
          rows: [
            { name: 'First', nameid: 100 },
            { name: 'Last', nameid: 200 },
          ],
        };
      case 'players':
        return {
          rows: [{ firstnameid: 100, lastnameid: 200, playerjerseynameid: 100, commonnameid: 200 }],
        };
      default:
        return { rows: [{ value: 'preserved' }] };
    }
  },
}));

vi.mock('fifa-t3db', () => ({ openFifaDatabase }));

describe('Playernames t3db materialization', () => {
  it('extracts every readable table before applying the operation', async () => {
    const { analyzePlayernameDataset } = await import('./playername-analysis');
    const { createPlayernameDatasetSnapshot } = await import('./playername-engine');
    const root = mkdtempSync(join(tmpdir(), 'qdb-playernames-t3db-'));
    const snapshotDirectory = join(root, 'source');
    const output = join(root, 'output');
    await mkdir(snapshotDirectory);
    await Promise.all([
      writeFile(join(snapshotDirectory, 'database.db'), 'database'),
      writeFile(join(snapshotDirectory, 'metadata.xml'), '<metadata />'),
    ]);
    const dataset: ImportedDatasetRecord = {
      id: '11111111-1111-4111-8111-111111111111',
      name: 't3db fixture',
      fifaVersion: 23,
      source: sourceProvenance('t3db', ['/fixture.db', '/fixture.xml'], {}),
      managedFormat: 't3db',
      updatedAt: new Date(0).toISOString(),
      status: 'available',
      tableNames: ['playernames', 'players'],
      tableCount: 2,
      rowCount: 3,
      warnings: [],
      snapshotDirectory,
    };

    const analysis = await analyzePlayernameDataset(dataset);
    expect(analysis).toMatchObject([
      {
        table: 'playernames',
        profile: { occupiedCount: 2, holeCount: 199, outOfRangeCount: 0 },
      },
    ]);

    await createPlayernameDatasetSnapshot(dataset, { minimize: true, removeUnused: false }, output);

    expect(parseTextTable(await readFile(join(output, 'custom.txt'))).rows).toEqual([
      { value: 'preserved' },
    ]);
    expect(
      parseTextTable(await readFile(join(output, 'playernames.txt'))).rows.map(
        (row) => row['nameid'],
      ),
    ).toEqual(['0', '1']);
  });
});
