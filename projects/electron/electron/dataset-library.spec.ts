import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { ConversionRecord } from '../shared/contracts';
import { DatasetLibrary, type DatasetRecord, sourceProvenance } from './dataset-library';

const id = '11111111-1111-4111-8111-111111111111';
const recordFor = (library: DatasetLibrary, datasetId = id, name = 'Fixture'): DatasetRecord => ({
  id: datasetId,
  name,
  fifaVersion: 23,
  source: sourceProvenance('text-folder', ['/original'], { 'players.txt': 'hash' }),
  status: 'available',
  tableNames: ['players'],
  tableCount: 1,
  rowCount: 2,
  warnings: [],
  snapshotDirectory: library.temporaryDirectory(datasetId),
});

describe('dataset library', () => {
  it('atomically installs, renames, reports, and removes managed snapshots', async () => {
    const root = mkdtempSync(join(tmpdir(), 'qdb-library-'));
    const library = new DatasetLibrary(root);
    const record = recordFor(library);
    await mkdir(record.snapshotDirectory);
    await writeFile(join(record.snapshotDirectory, 'fixture.txt'), 'managed');

    expect(library.install(record).status).toBe('available');
    expect(library.listDatasets()).toHaveLength(1);
    expect(library.rename(id, 'Renamed').name).toBe('Renamed');
    expect(() => library.ensureUniqueName('renamed')).toThrow(/already exists/);
    expect(() => library.ensureUniqueName('')).toThrow(/between 1 and 80/);
    expect(() => library.dataset('bad')).toThrow(/Invalid/);
    expect(() => library.dataset('33333333-3333-4333-8333-333333333333')).toThrow(/not found/);
    expect(() => library.temporaryDirectory('bad')).toThrow(/Invalid/);
    expect(library.remove(id)).toBe(true);
    expect(library.remove(id)).toBe(false);
  });

  it('persists conversion history and retains source provenance', () => {
    const root = mkdtempSync(join(tmpdir(), 'qdb-library-'));
    const library = new DatasetLibrary(root);
    const conversion: ConversionRecord = {
      id,
      requestId: '22222222-2222-4222-8222-222222222222',
      datasetId: id,
      datasetName: 'Fixture',
      sourceVersion: 23,
      targetVersion: 22,
      source: sourceProvenance('t3db', ['/source.db', '/source.xml'], {}),
      status: 'completed',
      outputPath: '/external/output',
      selectedTables: ['players'],
      tableSummaries: [],
      warnings: [],
      startedAt: new Date(0).toISOString(),
      completedAt: new Date(1).toISOString(),
      durationMs: 1,
    };
    library.addConversion(conversion);
    expect(new DatasetLibrary(root).listConversions()[0]?.source.originalPaths).toContain(
      '/source.db',
    );
    expect(library.removeConversion(id)).toBe(true);
    expect(library.removeConversion(id)).toBe(false);
  });

  it('persists the last import directory and ignores it when it no longer exists', async () => {
    const root = mkdtempSync(join(tmpdir(), 'qdb-library-'));
    const sourceDirectory = join(root, 'source');
    await mkdir(sourceDirectory);
    await writeFile(
      join(root, 'registry.json'),
      JSON.stringify({ schemaVersion: 1, datasets: [], conversions: [] }),
    );
    const library = new DatasetLibrary(root);

    expect(library.lastImportDirectory()).toBeUndefined();
    expect(() => library.rememberImportDirectory('relative/source')).toThrow(/absolute path/);

    library.rememberImportDirectory(sourceDirectory);
    expect(library.lastImportDirectory()).toBe(sourceDirectory);
    expect(new DatasetLibrary(root).lastImportDirectory()).toBe(sourceDirectory);

    const { rm } = await import('node:fs/promises');
    await rm(sourceDirectory, { recursive: true });
    expect(library.lastImportDirectory()).toBeUndefined();
  });

  it('removes multiple managed snapshots once while preserving conversion history', async () => {
    const root = mkdtempSync(join(tmpdir(), 'qdb-library-'));
    const library = new DatasetLibrary(root);
    const secondId = '44444444-4444-4444-8444-444444444444';
    const missingId = '55555555-5555-4555-8555-555555555555';
    const first = recordFor(library);
    const second = recordFor(library, secondId, 'Second');
    await mkdir(first.snapshotDirectory);
    await mkdir(second.snapshotDirectory);
    library.install(first);
    library.install(second);
    library.addConversion({
      id: '33333333-3333-4333-8333-333333333333',
      requestId: '22222222-2222-4222-8222-222222222222',
      datasetId: id,
      datasetName: first.name,
      sourceVersion: 23,
      targetVersion: 22,
      source: first.source,
      status: 'completed',
      outputPath: '/external/output',
      selectedTables: ['players'],
      tableSummaries: [],
      warnings: [],
      startedAt: new Date(0).toISOString(),
      completedAt: new Date(1).toISOString(),
      durationMs: 1,
    });

    expect(library.removeMany([id, id, missingId])).toBe(1);
    expect(library.listDatasets()).toEqual([expect.objectContaining({ id: secondId })]);
    expect(existsSync(library.finalDirectory(id))).toBe(false);
    expect(existsSync(library.finalDirectory(secondId))).toBe(true);
    expect(library.listConversions()).toHaveLength(1);
    expect(new DatasetLibrary(root).listConversions()).toHaveLength(1);
  });

  it('recovers a corrupt registry and interrupted import directory', async () => {
    const root = mkdtempSync(join(tmpdir(), 'qdb-library-'));
    await mkdir(join(root, 'datasets', `${id}.importing`), { recursive: true });
    await writeFile(join(root, 'registry.json'), '{not-json');
    const library = new DatasetLibrary(root);
    expect(library.listDatasets()).toEqual([]);
    expect(
      await readFile(join(root, 'registry.json.corrupt-'.slice(0, -1))).catch(() => undefined),
    ).toBeUndefined();
    expect(() => library.finalDirectory('invalid')).toThrow(/Invalid/);
    library.discardTemporary(id);
  });

  it('reports missing installed snapshots and rejects incomplete imports', async () => {
    const root = mkdtempSync(join(tmpdir(), 'qdb-library-'));
    const library = new DatasetLibrary(root);
    const record = recordFor(library);
    expect(() => library.install(record)).toThrow(/snapshot is missing/);
    await mkdir(record.snapshotDirectory);
    library.install(record);
    const { rm } = await import('node:fs/promises');
    await rm(library.finalDirectory(id), { recursive: true });
    expect(library.listDatasets()[0]).toMatchObject({
      status: 'corrupt',
      error: 'The managed source snapshot is missing.',
    });
  });
});
