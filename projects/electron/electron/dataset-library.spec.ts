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
  managedFormat: 'text-folder',
  updatedAt: new Date(0).toISOString(),
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
  resultKind: 'conversion',
  sourceDatasetKind: 'imported',
  sourceDatasetId: source.id,
  sourceDatasetName: source.name,
  sourceVersion: source.fifaVersion,
  fifaVersion: 22,
  createdAt: new Date(1).toISOString(),
  updatedAt: new Date(1).toISOString(),
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
      schemaVersion: 4,
      importedDatasets: [expect.objectContaining({ id: imported.id })],
      convertedDatasets: [],
    });
    expect(registry.conversions).toBeUndefined();
  });

  it('migrates v2 converted records to explicit conversion result metadata', async () => {
    const root = mkdtempSync(join(tmpdir(), 'qdb-library-'));
    const library = new DatasetLibrary(root);
    const source = importedRecordFor(library);
    const converted = convertedRecordFor(library, source);
    await Promise.all([mkdir(source.snapshotDirectory), mkdir(converted.snapshotDirectory)]);
    library.installImported(source);
    library.installConverted(converted);

    const registryPath = join(root, 'registry.json');
    const current = JSON.parse(await readFile(registryPath, 'utf8')) as {
      importedDatasets: ImportedDatasetRecord[];
      convertedDatasets: ConvertedDatasetRecord[];
      preferences: unknown;
    };
    await writeFile(
      registryPath,
      JSON.stringify({
        ...current,
        schemaVersion: 2,
        convertedDatasets: current.convertedDatasets.map((record) =>
          Object.fromEntries(
            Object.entries(record).filter(
              ([key]) => key !== 'resultKind' && key !== 'sourceDatasetKind',
            ),
          ),
        ),
      }),
    );

    const migrated = new DatasetLibrary(root);
    expect(migrated.listConvertedDatasets()[0]).toMatchObject({
      resultKind: 'conversion',
      sourceDatasetKind: 'imported',
    });
    expect(JSON.parse(await readFile(registryPath, 'utf8'))).toMatchObject({ schemaVersion: 4 });
  });

  it('migrates v3 managed formats and updated timestamps', async () => {
    const root = mkdtempSync(join(tmpdir(), 'qdb-library-'));
    const library = new DatasetLibrary(root);
    const source = importedRecordFor(library);
    const converted = convertedRecordFor(library, source);
    await Promise.all([mkdir(source.snapshotDirectory), mkdir(converted.snapshotDirectory)]);
    library.installImported(source);
    library.installConverted(converted);
    const registryPath = join(root, 'registry.json');
    const current = JSON.parse(await readFile(registryPath, 'utf8')) as {
      importedDatasets: Record<string, unknown>[];
      convertedDatasets: Record<string, unknown>[];
      preferences: unknown;
    };
    const without = (record: Record<string, unknown>, keys: string[]) =>
      Object.fromEntries(Object.entries(record).filter(([key]) => !keys.includes(key)));
    await writeFile(
      registryPath,
      JSON.stringify({
        ...current,
        schemaVersion: 3,
        importedDatasets: current.importedDatasets.map((record) =>
          without(record, ['managedFormat', 'updatedAt', 'playernameSummary']),
        ),
        convertedDatasets: current.convertedDatasets.map((record) =>
          without(record, ['updatedAt']),
        ),
      }),
    );

    const migrated = new DatasetLibrary(root);
    expect(migrated.listImportedDatasets()[0]).toMatchObject({
      managedFormat: 'text-folder',
      updatedAt: source.source.importedAt,
    });
    expect(migrated.listConvertedDatasets()[0]).toMatchObject({
      updatedAt: converted.createdAt,
    });
  });

  it('atomically replaces a managed snapshot and cleans unreferenced directories', async () => {
    const root = mkdtempSync(join(tmpdir(), 'qdb-library-'));
    const library = new DatasetLibrary(root);
    const source = importedRecordFor(library);
    await mkdir(source.snapshotDirectory);
    await writeFile(join(source.snapshotDirectory, 'old.txt'), 'old');
    library.installImported(source);
    const oldDirectory = library.importedDataset(source.id).snapshotDirectory;
    const replacementId = '77777777-7777-4777-8777-777777777777';
    const replacementDirectory = library.replacementTemporaryDirectory(
      'imported',
      source.id,
      replacementId,
    );
    await mkdir(join(replacementDirectory, 'text'), { recursive: true });
    await writeFile(join(replacementDirectory, 'text', 'players.txt'), 'new');
    const updatedAt = new Date(2).toISOString();
    const installed = library.replaceImported(
      {
        ...library.importedDataset(source.id),
        managedFormat: 'text-folder',
        updatedAt,
        playernameSummary: {
          operations: { minimize: true, removeUnused: true },
          tables: [],
          referencesUpdated: 4,
          totalRowsBefore: 5,
          totalRowsAfter: 3,
        },
      },
      replacementId,
    );

    expect(installed).toMatchObject({ id: source.id, name: source.name, updatedAt });
    expect(installed.playernameSummary?.operations).toEqual({
      minimize: true,
      removeUnused: true,
    });
    expect(existsSync(oldDirectory)).toBe(false);
    expect(existsSync(library.importedDataset(source.id).snapshotDirectory)).toBe(true);

    const orphan = join(library.importedDatasetDirectory, 'orphaned-snapshot');
    await mkdir(orphan);
    new DatasetLibrary(root);
    expect(existsSync(orphan)).toBe(false);
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
