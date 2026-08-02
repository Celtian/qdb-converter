import { mkdtempSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fieldsFor } from '../shared/table-config';

const openFifaDatabase = vi.fn();
vi.mock('fifa-t3db', () => ({ openFifaDatabase }));

const fakeDatabase = () => {
  const fields = fieldsFor(23, 'playernames').map((field) => ({ name: field.name }));
  return {
    schema: {
      tables: [
        { name: 'playernames', fields },
        { name: 'unsupported', fields: [] },
      ],
    },
    listTables: () => [
      { name: 'playernames', validRecordCount: 1 },
      { name: 'unsupported', validRecordCount: 99 },
    ],
    readTable: () => ({ rows: [{ nameid: 1, name: 'A quoted\tname' }] }),
  };
};

describe('t3db source adapter', () => {
  beforeEach(() => openFifaDatabase.mockReturnValue(fakeDatabase()));

  it('detects, snapshots, hashes, and converts a paired source', async () => {
    const { inspectT3dbSource } = await import('./source-inspection');
    const { importDatasetSnapshot } = await import('./dataset-importer');
    const { createConvertedDatasetSnapshot } = await import('./conversion-engine');
    const root = mkdtempSync(join(tmpdir(), 'qdb-t3db-'));
    const databasePath = join(root, 'fixture.db');
    const metadataPath = join(root, 'fixture.xml');
    const snapshot = join(root, 'snapshot');
    await writeFile(databasePath, 'database');
    await writeFile(metadataPath, '<metadata />');

    const inspection = await inspectT3dbSource(databasePath, metadataPath);
    expect(inspection.matchingVersions).toContain(23);
    expect(inspection.tables).toEqual([{ table: 'playernames', rows: 1 }]);
    const record = await importDatasetSnapshot(
      '11111111-1111-4111-8111-111111111111',
      't3db fixture',
      23,
      { selectionId: 'selection', inspection },
      snapshot,
    );
    expect(record.rowCount).toBe(1);
    expect(record.source.hashes['fixture.db']).toMatch(/^[a-f0-9]{64}$/);

    const output = join(root, 'output');
    await createConvertedDatasetSnapshot(record, 23, output);
    expect((await readFile(join(output, 'playernames.txt'))).byteLength).toBeGreaterThan(2);
  });

  it('rejects databases without supported or matching schema tables', async () => {
    const { inspectT3dbSource } = await import('./source-inspection');
    const root = mkdtempSync(join(tmpdir(), 'qdb-t3db-'));
    const databasePath = join(root, 'fixture.db');
    const metadataPath = join(root, 'fixture.xml');
    await Promise.all([writeFile(databasePath, 'db'), writeFile(metadataPath, '<xml />')]);
    openFifaDatabase.mockReturnValueOnce({
      schema: { tables: [{ name: 'unknown', fields: [] }] },
    });
    await expect(inspectT3dbSource(databasePath, metadataPath)).rejects.toThrow(/no supported/);

    openFifaDatabase.mockReturnValueOnce({
      schema: { tables: [{ name: 'playernames', fields: [{ name: 'wrong' }] }] },
    });
    await expect(inspectT3dbSource(databasePath, metadataPath)).rejects.toThrow(/does not match/);
  });

  it('requires both selected t3db paths', async () => {
    const { importDatasetSnapshot } = await import('./dataset-importer');
    const root = mkdtempSync(join(tmpdir(), 'qdb-t3db-'));
    await mkdir(join(root, 'snapshot'));
    await expect(
      importDatasetSnapshot(
        '11111111-1111-4111-8111-111111111111',
        'broken',
        23,
        {
          selectionId: 'selection',
          inspection: {
            suggestedName: 'broken',
            sourceKind: 't3db',
            originalPaths: [],
            matchingVersions: [23],
            tables: [{ table: 'players', rows: 1 }],
            warnings: [],
          },
        },
        join(root, 'snapshot'),
      ),
    ).rejects.toThrow(/Both t3db/);
  });
});
