import { Datatype, type Field } from 'fifatables';
import { mkdtempSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fieldsFor } from '../shared/table-config';
import { type TableRow, encodeFifaText } from '../shared/text-format';
import {
  type ConvertedDatasetRecord,
  type ImportedDatasetRecord,
  sourceProvenance,
} from './dataset-library';
import { validateDatasetSnapshot, validateSelectedSource } from './dataset-validator';
import type { SelectedSource } from './source-selections';

const { openFifaDatabase } = vi.hoisted(() => ({ openFifaDatabase: vi.fn() }));
vi.mock('fifa-t3db', () => ({ openFifaDatabase }));

const datasetId = '11111111-1111-4111-8111-111111111111';

const validValue = (field: Field, rowIndex: number): string | number => {
  if (field.type === Datatype.String) return `value-${rowIndex}`;
  if (!field.range) return rowIndex;
  return Math.min(field.range.min + rowIndex, field.range.max);
};

const validRow = (fields: readonly Field[], rowIndex: number): TableRow =>
  Object.fromEntries(fields.map((field) => [field.name, validValue(field, rowIndex)]));

const textDataset = async (): Promise<{
  dataset: ImportedDatasetRecord;
  directory: string;
  fields: Field[];
}> => {
  const root = mkdtempSync(join(tmpdir(), 'qdb-validation-'));
  const directory = join(root, 'text');
  await mkdir(directory);
  return {
    dataset: {
      id: datasetId,
      name: 'Fixture',
      fifaVersion: 23,
      source: sourceProvenance('text-folder', ['/fixture'], {}),
      status: 'available',
      tableNames: ['leagues'],
      tableCount: 1,
      rowCount: 1,
      warnings: [],
      snapshotDirectory: root,
    },
    directory,
    fields: fieldsFor(23, 'leagues'),
  };
};

describe('dataset validator', () => {
  beforeEach(() => openFifaDatabase.mockReset());

  it('groups blocking type errors and published-range warnings with row samples', async () => {
    const { dataset, directory, fields } = await textDataset();
    const row = validRow(fields, 0);
    const rangeField = fields.find((field) => field.range)!;
    const invalidField = fields.find(
      (field) => field.type === Datatype.Int && field.name !== rangeField.name,
    )!;
    row[rangeField.name] = rangeField.range!.max + 1;
    row[invalidField.name] = 'not-a-number';
    await writeFile(
      join(directory, 'leagues.txt'),
      encodeFifaText(
        fields.map((field) => field.name),
        [row],
      ),
    );

    const result = await validateDatasetSnapshot(dataset);
    const sourceResult = await validateSelectedSource(
      {
        selectionId: 'selection',
        inspection: {
          suggestedName: 'Fixture',
          sourceKind: 'text-folder',
          originalPaths: [directory],
          matchingVersions: [23],
          tables: [{ table: 'leagues', rows: 1 }],
          warnings: [],
        },
      },
      23,
    );

    expect(result).toMatchObject({
      datasetId,
      tablesChecked: 1,
      rowsChecked: 1,
      errorCount: 1,
      warningCount: 1,
    });
    expect(sourceResult).toMatchObject({
      selectionId: 'selection',
      tablesChecked: result.tablesChecked,
      rowsChecked: result.rowsChecked,
      errorCount: result.errorCount,
      warningCount: result.warningCount,
    });
    expect(result.errors[0]).toMatchObject({
      table: 'leagues',
      field: invalidField.name,
      occurrences: 1,
      samples: [{ row: 1, value: 'not-a-number' }],
    });
    expect(result.warnings[0]).toMatchObject({
      table: 'leagues',
      field: rangeField.name,
      occurrences: 1,
      samples: [{ row: 1, value: String(rangeField.range!.max + 1) }],
    });
  });

  it('reports duplicate published unique values as blocking errors', async () => {
    const { dataset, directory, fields } = await textDataset();
    const uniqueField = fields.find((field) => field.unique)!;
    const rows = [validRow(fields, 0), validRow(fields, 1)];
    rows[1]![uniqueField.name] = rows[0]![uniqueField.name]!;
    await writeFile(
      join(directory, 'leagues.txt'),
      encodeFifaText(
        fields.map((field) => field.name),
        rows,
      ),
    );

    const result = await validateDatasetSnapshot(dataset);

    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: uniqueField.name,
        message: 'Value must be unique.',
        occurrences: 1,
      }),
    );
  });

  it('returns a blocking result when a managed table is missing', async () => {
    const { dataset } = await textDataset();

    const result = await validateDatasetSnapshot(dataset);

    expect(result).toMatchObject({ tablesChecked: 0, rowsChecked: 0, errorCount: 1 });
    expect(result.errors[0]?.message).toBe('Managed table file is missing.');
  });

  it('validates converted text tables from the snapshot root', async () => {
    const root = mkdtempSync(join(tmpdir(), 'qdb-validation-converted-'));
    const fields = fieldsFor(22, 'leagues');
    const invalidField = fields.find((field) => field.type === Datatype.Int)!;
    const row = validRow(fields, 0);
    row[invalidField.name] = 'not-a-number';
    await writeFile(
      join(root, 'leagues.txt'),
      encodeFifaText(
        fields.map((field) => field.name),
        [row],
      ),
    );
    const converted: ConvertedDatasetRecord = {
      id: '33333333-3333-4333-8333-333333333333',
      name: 'Converted fixture',
      sourceDatasetId: datasetId,
      sourceDatasetName: 'Fixture',
      sourceVersion: 23,
      fifaVersion: 22,
      createdAt: new Date(1).toISOString(),
      status: 'available',
      tableNames: ['leagues'],
      tableCount: 1,
      rowCount: 1,
      tableSummaries: [],
      warnings: [],
      snapshotDirectory: root,
    };

    const result = await validateDatasetSnapshot(converted);

    expect(result).toMatchObject({
      datasetId: converted.id,
      tablesChecked: 1,
      rowsChecked: 1,
      errorCount: 1,
    });
    expect(result.errors[0]).toMatchObject({
      table: 'leagues',
      field: invalidField.name,
      samples: [{ row: 1, value: 'not-a-number' }],
    });
  });

  it('reports missing converted text tables as blocking errors', async () => {
    const root = mkdtempSync(join(tmpdir(), 'qdb-validation-converted-'));
    const converted: ConvertedDatasetRecord = {
      id: '33333333-3333-4333-8333-333333333333',
      name: 'Converted fixture',
      sourceDatasetId: datasetId,
      sourceDatasetName: 'Fixture',
      sourceVersion: 23,
      fifaVersion: 22,
      createdAt: new Date(1).toISOString(),
      status: 'available',
      tableNames: ['leagues'],
      tableCount: 1,
      rowCount: 0,
      tableSummaries: [],
      warnings: [],
      snapshotDirectory: root,
    };

    const result = await validateDatasetSnapshot(converted);

    expect(result).toMatchObject({ tablesChecked: 0, rowsChecked: 0, errorCount: 1 });
    expect(result.errors[0]?.message).toBe('Managed table file is missing.');
  });

  it('validates managed t3db rows against the same published ranges', async () => {
    const root = mkdtempSync(join(tmpdir(), 'qdb-validation-'));
    const fields = fieldsFor(23, 'leagues');
    const rangeField = fields.find((field) => field.range)!;
    const row = validRow(fields, 0);
    row[rangeField.name] = rangeField.range!.max + 1;
    await Promise.all([
      writeFile(join(root, 'database.db'), 'database'),
      writeFile(join(root, 'metadata.xml'), '<metadata />'),
    ]);
    openFifaDatabase.mockReturnValue({
      listTables: () => [{ name: 'leagues' }],
      readTable: () => ({ rows: [row] }),
    });
    const dataset: ImportedDatasetRecord = {
      id: datasetId,
      name: 't3db fixture',
      fifaVersion: 23,
      source: sourceProvenance('t3db', ['/fixture.db', '/fixture.xml'], {}),
      status: 'available',
      tableNames: ['leagues'],
      tableCount: 1,
      rowCount: 1,
      warnings: [],
      snapshotDirectory: root,
    };

    const result = await validateDatasetSnapshot(dataset);
    const source: SelectedSource = {
      selectionId: 't3db-selection',
      inspection: {
        suggestedName: 'Fixture',
        sourceKind: 't3db',
        originalPaths: [join(root, 'database.db'), join(root, 'metadata.xml')],
        matchingVersions: [23],
        tables: [{ table: 'leagues', rows: 1 }],
        warnings: [],
      },
    };
    const sourceResult = await validateSelectedSource(source, 23);

    expect(openFifaDatabase).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({ errorCount: 0, warningCount: 1 });
    expect(sourceResult).toMatchObject({
      selectionId: source.selectionId,
      errorCount: 0,
      warningCount: 1,
    });
    expect(result.warnings[0]).toMatchObject({
      table: 'leagues',
      field: rangeField.name,
      samples: [{ row: 1, value: rangeField.range!.max + 1 }],
    });
  });
});
