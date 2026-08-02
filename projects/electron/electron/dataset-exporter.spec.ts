import { existsSync } from 'node:fs';
import { mkdtempSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { exportDatasetSnapshot } from './dataset-exporter';
import type { ConvertedDatasetRecord, ImportedDatasetRecord } from './dataset-library';

describe('dataset exporter', () => {
  afterEach(() => vi.useRealTimers());

  it('copies exact bytes into unique child folders without overwriting exports', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-26T12:00:00Z'));
    const root = mkdtempSync(join(tmpdir(), 'qdb-exporter-'));
    const snapshotDirectory = join(root, 'snapshot');
    const target = join(root, 'exports');
    await Promise.all([
      mkdir(snapshotDirectory, { recursive: true }),
      mkdir(target, { recursive: true }),
    ]);
    const bytes = Buffer.from([0xff, 0xfe, 0x31, 0x00]);
    await writeFile(join(snapshotDirectory, 'players.txt'), bytes);
    const dataset: ConvertedDatasetRecord = {
      id: '33333333-3333-4333-8333-333333333333',
      name: 'Fixture dataset',
      sourceDatasetId: '11111111-1111-4111-8111-111111111111',
      sourceDatasetName: 'Fixture',
      sourceVersion: 23,
      fifaVersion: 22,
      createdAt: new Date(0).toISOString(),
      status: 'available',
      tableNames: ['players'],
      tableCount: 1,
      rowCount: 1,
      tableSummaries: [],
      warnings: [],
      snapshotDirectory,
    };

    const first = await exportDatasetSnapshot(dataset, target);
    const second = await exportDatasetSnapshot(dataset, target);

    expect(first).toMatch(/Fixture-dataset-fifa22-20260726T120000Z$/);
    expect(second).toMatch(/Fixture-dataset-fifa22-20260726T120000Z-2$/);
    expect(await readFile(join(first, 'players.txt'))).toEqual(bytes);
    expect(await readFile(join(second, 'players.txt'))).toEqual(bytes);

    await rm(snapshotDirectory, { recursive: true });
    expect(existsSync(first)).toBe(true);
    expect(existsSync(second)).toBe(true);
  });

  it('cleans temporary exports when the managed snapshot is missing', async () => {
    const root = mkdtempSync(join(tmpdir(), 'qdb-exporter-'));
    const target = join(root, 'exports');
    await mkdir(target);
    const dataset = {
      id: '33333333-3333-4333-8333-333333333333',
      name: 'Missing',
      fifaVersion: 22,
      snapshotDirectory: join(root, 'missing'),
    } as ConvertedDatasetRecord;

    await expect(exportDatasetSnapshot(dataset, target)).rejects.toThrow();
    await expect((await import('node:fs/promises')).readdir(target)).resolves.toEqual([]);
  });

  it('exports an imported dataset snapshot', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-26T12:00:00Z'));
    const root = mkdtempSync(join(tmpdir(), 'qdb-exporter-'));
    const snapshotDirectory = join(root, 'snapshot');
    const target = join(root, 'exports');
    await mkdir(snapshotDirectory, { recursive: true });
    await writeFile(join(snapshotDirectory, 'teams.txt'), 'imported');
    const dataset: ImportedDatasetRecord = {
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Imported fixture',
      fifaVersion: 23,
      source: {
        kind: 'text-folder',
        originalPaths: ['/fixtures/imported'],
        hashes: {},
        importedAt: new Date(0).toISOString(),
      },
      status: 'available',
      tableNames: ['teams'],
      tableCount: 1,
      rowCount: 1,
      warnings: [],
      snapshotDirectory,
    };

    const output = await exportDatasetSnapshot(dataset, target);

    expect(output).toMatch(/Imported-fixture-fifa23-20260726T120000Z$/);
    expect(await readFile(join(output, 'teams.txt'), 'utf8')).toBe('imported');
    await rm(root, { recursive: true });
  });
});
