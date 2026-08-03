import { existsSync, mkdtempSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  type ConvertedDatasetRecord,
  DatasetLibrary,
  type ImportedDatasetRecord,
  sourceProvenance,
} from './dataset-library';

const importedId = '11111111-1111-4111-8111-111111111111';
const convertedId = '33333333-3333-4333-8333-333333333333';
const importedRecordFor = (
  library: DatasetLibrary,
  id = importedId,
  name = 'Fixture',
): ImportedDatasetRecord => ({
  id,
  name,
  fifaVersion: 23,
  source: sourceProvenance('text-folder', ['/original'], { 'players.txt': 'hash' }),
  status: 'available',
  tableNames: ['players'],
  tableCount: 1,
  rowCount: 2,
  warnings: [],
  snapshotDirectory: library.importedTemporaryDirectory(id),
});

const convertedRecordFor = (
  library: DatasetLibrary,
  source = importedRecordFor(library),
  id = convertedId,
  name = 'Fixture — FIFA 22',
): ConvertedDatasetRecord => ({
  id,
  name,
  sourceDatasetId: source.id,
  sourceDatasetName: source.name,
  sourceVersion: source.fifaVersion,
  fifaVersion: 22,
  createdAt: new Date(1).toISOString(),
  status: 'available',
  tableNames: ['players'],
  tableCount: 1,
  rowCount: 2,
  tableSummaries: [],
  warnings: [],
  snapshotDirectory: library.convertedTemporaryDirectory(id),
});

describe('dataset library', () => {
  it('manages imported and converted datasets in separate namespaces', async () => {
    const root = mkdtempSync(join(tmpdir(), 'qdb-library-'));
    const library = new DatasetLibrary(root);
    const imported = importedRecordFor(library);
    const converted = convertedRecordFor(library, imported);
    await Promise.all([mkdir(imported.snapshotDirectory), mkdir(converted.snapshotDirectory)]);
    await Promise.all([
      writeFile(join(imported.snapshotDirectory, 'source.txt'), 'imported'),
      writeFile(join(converted.snapshotDirectory, 'players.txt'), 'converted'),
    ]);

    expect(library.installImported(imported).status).toBe('available');
    expect(library.installConverted(converted).status).toBe('available');
    expect(library.renameImported(imported.id, 'Imported renamed').name).toBe('Imported renamed');
    expect(library.renameConverted(converted.id, 'Converted renamed').name).toBe(
      'Converted renamed',
    );
    expect(() => library.ensureUniqueImportedName('imported renamed')).toThrow(/already exists/);
    expect(() => library.ensureUniqueConvertedName('converted renamed')).toThrow(/already exists/);
    expect(() => library.ensureUniqueImportedName('')).toThrow(/between 1 and 80/);

    expect(library.removeImported(imported.id)).toBe(true);
    expect(library.listImportedDatasets()).toEqual([]);
    expect(library.listConvertedDatasets()).toEqual([
      expect.objectContaining({ id: converted.id, sourceDatasetName: 'Fixture' }),
    ]);
    expect(existsSync(library.convertedFinalDirectory(converted.id))).toBe(true);
    expect(library.removeConverted(converted.id)).toBe(true);
    expect(library.removeConverted(converted.id)).toBe(false);
  });

  it('bulk removes selected converted datasets while preserving other managed data', async () => {
    const root = mkdtempSync(join(tmpdir(), 'qdb-library-'));
    const library = new DatasetLibrary(root);
    const imported = importedRecordFor(library);
    const removed = convertedRecordFor(library, imported);
    const retained = convertedRecordFor(
      library,
      imported,
      '55555555-5555-4555-8555-555555555555',
      'Retained conversion',
    );
    await Promise.all([
      mkdir(imported.snapshotDirectory),
      mkdir(removed.snapshotDirectory),
      mkdir(retained.snapshotDirectory),
    ]);
    library.installImported(imported);
    library.installConverted(removed);
    library.installConverted(retained);

    expect(library.removeConvertedMany([removed.id, removed.id])).toBe(1);
    expect(library.listImportedDatasets()).toEqual([expect.objectContaining({ id: imported.id })]);
    expect(library.listConvertedDatasets()).toEqual([expect.objectContaining({ id: retained.id })]);
    expect(existsSync(library.convertedFinalDirectory(removed.id))).toBe(false);
    expect(existsSync(library.convertedFinalDirectory(retained.id))).toBe(true);
  });

  it('migrates v1 imported datasets and preferences while discarding conversion history', async () => {
    const root = mkdtempSync(join(tmpdir(), 'qdb-library-'));
    const sourceDirectory = join(root, 'source');
    const legacyLibrary = new DatasetLibrary(root);
    const imported = importedRecordFor(legacyLibrary);
    await mkdir(imported.snapshotDirectory);
    legacyLibrary.installImported(imported);
    await mkdir(sourceDirectory);
    await writeFile(
      join(root, 'registry.json'),
      JSON.stringify({
        schemaVersion: 1,
        datasets: [
          { ...imported, snapshotDirectory: legacyLibrary.importedFinalDirectory(imported.id) },
        ],
        conversions: [{ id: 'legacy-history' }],
        preferences: { lastImportDirectory: sourceDirectory },
      }),
    );

    const migrated = new DatasetLibrary(root);
    expect(migrated.listImportedDatasets()).toEqual([expect.objectContaining({ id: imported.id })]);
    expect(migrated.listConvertedDatasets()).toEqual([]);
    expect(migrated.lastImportDirectory()).toBe(sourceDirectory);
    const registry = JSON.parse(await readFile(join(root, 'registry.json'), 'utf8')) as {
      schemaVersion: number;
      importedDatasets: unknown[];
      convertedDatasets: unknown[];
      conversions?: unknown[];
    };
    expect(registry).toMatchObject({
      schemaVersion: 2,
      importedDatasets: [expect.objectContaining({ id: imported.id })],
      convertedDatasets: [],
    });
    expect(registry.conversions).toBeUndefined();
  });

  it('persists the last import directory and ignores it when it no longer exists', async () => {
    const root = mkdtempSync(join(tmpdir(), 'qdb-library-'));
    const sourceDirectory = join(root, 'source');
    await mkdir(sourceDirectory);
    const library = new DatasetLibrary(root);

    expect(library.lastImportDirectory()).toBeUndefined();
    expect(() => library.rememberImportDirectory('relative/source')).toThrow(/absolute path/);
    library.rememberImportDirectory(sourceDirectory);
    expect(new DatasetLibrary(root).lastImportDirectory()).toBe(sourceDirectory);
    await rm(sourceDirectory, { recursive: true });
    expect(library.lastImportDirectory()).toBeUndefined();
  });

  it('cleans interrupted operations and reports missing snapshots', async () => {
    const root = mkdtempSync(join(tmpdir(), 'qdb-library-'));
    await Promise.all([
      mkdir(join(root, 'datasets', `${importedId}.importing`), { recursive: true }),
      mkdir(join(root, 'converted-datasets', `${convertedId}.creating`), { recursive: true }),
    ]);
    const library = new DatasetLibrary(root);
    expect(existsSync(library.importedTemporaryDirectory(importedId))).toBe(false);
    expect(existsSync(library.convertedTemporaryDirectory(convertedId))).toBe(false);

    const imported = importedRecordFor(library);
    expect(() => library.installImported(imported)).toThrow(/snapshot is missing/);
    await mkdir(imported.snapshotDirectory);
    library.installImported(imported);
    await rm(library.importedFinalDirectory(imported.id), { recursive: true });
    expect(library.listImportedDatasets()[0]).toMatchObject({
      status: 'corrupt',
      error: 'The managed imported snapshot is missing.',
    });
    expect(() => library.importedDataset('bad')).toThrow(/Invalid/);
    expect(() => library.convertedDataset(convertedId)).toThrow(/not found/);
  });

  it('backs up malformed registry files without deleting managed directories', async () => {
    const root = mkdtempSync(join(tmpdir(), 'qdb-library-'));
    await mkdir(join(root, 'datasets'), { recursive: true });
    await writeFile(join(root, 'registry.json'), '{not-json');
    const library = new DatasetLibrary(root);
    expect(library.listImportedDatasets()).toEqual([]);
    const entries = await (await import('node:fs/promises')).readdir(root);
    expect(entries.some((entry) => entry.startsWith('registry.json.corrupt-'))).toBe(true);
  });
});
