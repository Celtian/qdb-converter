import { existsSync, mkdtempSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  type ConvertedDatasetRecord,
  DatasetLibrary,
  type ImportedDatasetRecord,
  sourceProvenance,
} from './dataset-library';

const importedRecordFor = (library: DatasetLibrary, index: number): ImportedDatasetRecord => {
  const id = `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`;
  return {
    id,
    name: `Fixture ${index}`,
    fifaVersion: 23,
    source: sourceProvenance('text-folder', ['/original'], { 'players.txt': 'hash' }),
    status: 'available',
    tableNames: ['players'],
    tableCount: 1,
    rowCount: 2,
    warnings: [],
    snapshotDirectory: library.importedFinalDirectory(id),
  };
};

const convertedRecordFor = (
  library: DatasetLibrary,
  source: ImportedDatasetRecord,
  index: number,
): ConvertedDatasetRecord => {
  const id = `10000000-0000-4000-8000-${String(index).padStart(12, '0')}`;
  return {
    id,
    name: `Converted fixture ${index}`,
    sourceDatasetId: source.id,
    sourceDatasetName: source.name,
    sourceVersion: source.fifaVersion,
    fifaVersion: 22,
    createdAt: new Date(index).toISOString(),
    status: 'available',
    tableNames: ['players'],
    tableCount: 1,
    rowCount: 2,
    tableSummaries: [],
    warnings: [],
    snapshotDirectory: library.convertedFinalDirectory(id),
  };
};

const seedLibrary = async (
  root: string,
  importedDatasets: ImportedDatasetRecord[],
  convertedDatasets: ConvertedDatasetRecord[],
): Promise<DatasetLibrary> => {
  await Promise.all(
    [...importedDatasets, ...convertedDatasets].map((record) =>
      mkdir(record.snapshotDirectory, { recursive: true }),
    ),
  );
  await writeFile(
    join(root, 'registry.json'),
    JSON.stringify({
      schemaVersion: 2,
      importedDatasets,
      convertedDatasets,
      preferences: {},
    }),
  );
  return new DatasetLibrary(root);
};

describe('dataset library remove all', () => {
  it('removes more than 100 imported snapshots while preserving converted datasets', async () => {
    const root = mkdtempSync(join(tmpdir(), 'qdb-library-'));
    const paths = new DatasetLibrary(root);
    const importedRecords = Array.from({ length: 101 }, (_, index) =>
      importedRecordFor(paths, index),
    );
    const convertedRecord = convertedRecordFor(paths, importedRecords[0]!, 0);
    const library = await seedLibrary(root, importedRecords, [convertedRecord]);

    expect(library.removeAll(['imported'])).toEqual({ imported: 101, converted: 0 });
    expect(library.listImportedDatasets()).toEqual([]);
    expect(
      importedRecords.every((record) => !existsSync(library.importedFinalDirectory(record.id))),
    ).toBe(true);
    expect(library.listConvertedDatasets()).toEqual([
      expect.objectContaining({ id: convertedRecord.id }),
    ]);
    expect(existsSync(library.convertedFinalDirectory(convertedRecord.id))).toBe(true);
  });

  it('removes more than 100 snapshots from both selected categories', async () => {
    const root = mkdtempSync(join(tmpdir(), 'qdb-library-'));
    const paths = new DatasetLibrary(root);
    const importedRecords = Array.from({ length: 101 }, (_, index) =>
      importedRecordFor(paths, index),
    );
    const convertedRecords = Array.from({ length: 101 }, (_, index) =>
      convertedRecordFor(paths, importedRecords[0]!, index),
    );
    const library = await seedLibrary(root, importedRecords, convertedRecords);

    expect(library.removeAll(['imported', 'converted'])).toEqual({
      imported: 101,
      converted: 101,
    });
    expect(library.listImportedDatasets()).toEqual([]);
    expect(library.listConvertedDatasets()).toEqual([]);
    expect(
      importedRecords.every((record) => !existsSync(library.importedFinalDirectory(record.id))),
    ).toBe(true);
    expect(
      convertedRecords.every((record) => !existsSync(library.convertedFinalDirectory(record.id))),
    ).toBe(true);
  });
});
