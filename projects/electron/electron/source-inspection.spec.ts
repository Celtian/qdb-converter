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

const writeTable = async (folder: string): Promise<void> => {
  const fields = fieldsFor(23, 'playernames').map((field) => field.name);
  await writeFile(join(folder, 'playernames.txt'), encodeFifaText(fields, []));
};

describe('source inspection and snapshots', () => {
  it('detects compatible text schemas and imports a hashed managed copy', async () => {
    const root = mkdtempSync(join(tmpdir(), 'qdb-source-'));
    const source = join(root, 'source');
    const snapshot = join(root, 'snapshot.importing');
    await mkdir(source);
    await writeTable(source);
    await writeFile(join(source, 'notes.txt'), encodeFifaText(['note'], [{ note: 'ignored' }]));

    const inspection = await inspectTextSource(source);
    expect(inspection.matchingVersions).toContain(23);
    expect(inspection.warnings).toHaveLength(1);

    const selections = new SourceSelections();
    const candidate = selections.add(inspection);
    const selected = selections.get(candidate.selectionId);
    expect(selected).toBeDefined();
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
    expect(record.tableNames).toEqual(['playernames']);
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
});
