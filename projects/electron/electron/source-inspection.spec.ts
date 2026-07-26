import { mkdir, writeFile } from 'node:fs/promises';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { fieldsFor } from '../shared/table-config';
import { encodeFifaText } from '../shared/text-format';
import { importDatasetSnapshot } from './dataset-importer';
import { inspectTextSource } from './source-inspection';
import { SourceSelections } from './source-selections';

const writeTable = async (
  folder: string,
  table: 'playernames' | 'teams',
  rowCount: number,
): Promise<void> => {
  const fields = fieldsFor(23, table).map((field) => field.name);
  const rows = Array.from({ length: rowCount }, (_, index) => ({ [fields[0]!]: index + 1 }));
  await writeFile(join(folder, `${table}.txt`), encodeFifaText(fields, rows));
};

describe('source inspection and snapshots', () => {
  it('detects compatible text schemas and imports a hashed managed copy', async () => {
    const root = mkdtempSync(join(tmpdir(), 'qdb-source-'));
    const source = join(root, 'source');
    const snapshot = join(root, 'snapshot.importing');
    await mkdir(source);
    await writeTable(source, 'playernames', 2);
    await writeTable(source, 'teams', 0);
    await writeFile(join(source, 'notes.txt'), encodeFifaText(['note'], [{ note: 'ignored' }]));

    const inspection = await inspectTextSource(source);
    expect(inspection.matchingVersions).toContain(23);
    expect(inspection.tables).toEqual([
      { table: 'playernames', rows: 2 },
      { table: 'teams', rows: 0 },
    ]);
    expect(inspection.warnings).toHaveLength(1);

    const selections = new SourceSelections();
    const candidate = selections.add(inspection);
    const selected = selections.get(candidate.selectionId);
    expect(selected).toBeDefined();
    expect(selections.canImport(candidate.selectionId, 23)).toBe(false);
    selections.recordValidation(candidate.selectionId, 23, 1);
    expect(selections.canImport(candidate.selectionId, 23)).toBe(false);
    selections.recordValidation(candidate.selectionId, 23, 0);
    expect(selections.canImport(candidate.selectionId, 23)).toBe(true);
    expect(selections.canImport(candidate.selectionId, 22)).toBe(false);
    expect(() => selections.recordValidation('missing', 23, 0)).toThrow(/Select this source/);
    const progress: string[] = [];
    const record = await importDatasetSnapshot(
      '11111111-1111-4111-8111-111111111111',
      'Text fixture',
      23,
      selected!,
      snapshot,
      (message) => progress.push(message),
    );
    expect(record.source.hashes['playernames.txt']).toMatch(/^[a-f0-9]{64}$/);
    expect(record.tableNames).toEqual(['playernames', 'teams']);
    expect(record.rowCount).toBe(2);
    expect(progress[0]).toMatch(/Copying/);
    selections.delete(candidate.selectionId);
    expect(selections.get(candidate.selectionId)).toBeUndefined();
    selections.clear();
  });

  it('rejects empty and incompatible folders', async () => {
    const root = mkdtempSync(join(tmpdir(), 'qdb-source-'));
    await expect(inspectTextSource(root)).rejects.toThrow(/no .txt/);
    await writeFile(join(root, 'unknown.txt'), encodeFifaText(['field'], []));
    await expect(inspectTextSource(root)).rejects.toThrow(/no supported/);
  });

  it('rejects supported tables with fields that match no FIFA schema', async () => {
    const root = mkdtempSync(join(tmpdir(), 'qdb-source-'));
    await writeFile(join(root, 'players.txt'), encodeFifaText(['notafield'], []));
    await expect(inspectTextSource(root)).rejects.toThrow(/do not match/);
  });

  it('stages t3db files by kind and consumes them after creating a source', () => {
    const ids = ['database-file', 'metadata-file', 'wrong-database', 'wrong-metadata', 'source'];
    const selections = new SourceSelections(() => ids.shift()!);
    const databaseFileId = selections.addT3dbFile('database', '/source/database.db');
    const metadataFileId = selections.addT3dbFile('metadata', '/source/metadata.xml');
    const wrongDatabaseId = selections.addT3dbFile('metadata', '/source/wrong.xml');
    const wrongMetadataId = selections.addT3dbFile('database', '/source/wrong.db');

    expect(selections.resolveT3dbPair(databaseFileId, metadataFileId)).toEqual({
      databasePath: '/source/database.db',
      metadataPath: '/source/metadata.xml',
    });
    expect(selections.resolveT3dbPair(wrongDatabaseId, wrongMetadataId)).toBeUndefined();
    expect(selections.resolveT3dbPair('missing', metadataFileId)).toBeUndefined();

    const candidate = selections.addT3dbSource(
      {
        suggestedName: 'Database',
        sourceKind: 't3db',
        originalPaths: ['/source/database.db', '/source/metadata.xml'],
        detectedVersion: 23,
        matchingVersions: [23],
        tables: [{ table: 'players', rows: 10 }],
        warnings: [],
      },
      databaseFileId,
      metadataFileId,
    );
    expect(candidate.selectionId).toBe('source');
    expect(selections.get(candidate.selectionId)).toBeDefined();
    expect(selections.resolveT3dbPair(databaseFileId, metadataFileId)).toBeUndefined();
    selections.clear();
    expect(selections.get(candidate.selectionId)).toBeUndefined();
  });
});
