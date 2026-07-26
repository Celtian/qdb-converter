import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { openFifaDatabase } from 'fifa-t3db';
import { Datatype, type Field } from 'fifatables';
import type {
  DatasetImportValidationResult,
  DatasetValidationIssue,
  DatasetValidationReport,
  DatasetValidationResult,
  DatasetValidationSample,
} from '../shared/contracts';
import { fieldsFor, isSupportedTable } from '../shared/table-config';
import { parseTextTable, type TableRow, type TableValue } from '../shared/text-format';
import type { DatasetRecord } from './dataset-library';
import type { SelectedSource } from './source-selections';

const MAX_SAMPLES_PER_ISSUE = 25;

type IssueSeverity = 'error' | 'warning';

interface MutableIssue extends DatasetValidationIssue {
  samples: DatasetValidationSample[];
}

interface ValidationState {
  readonly errors: Map<string, MutableIssue>;
  readonly warnings: Map<string, MutableIssue>;
  tablesChecked: number;
  rowsChecked: number;
}

const issueKey = (table: string, field: string | undefined, message: string): string =>
  `${table}\u0000${field ?? ''}\u0000${message}`;

const displayValue = (value: TableValue | undefined): string | number => {
  if (typeof value === 'number') return value;
  if (value === undefined) return '(missing)';
  if (value === '') return '(empty)';
  return value.length > 120 ? `${value.slice(0, 117)}…` : value;
};

const addIssue = (
  state: ValidationState,
  severity: IssueSeverity,
  table: string,
  field: string | undefined,
  message: string,
  row: number,
  value: TableValue | undefined,
): void => {
  const issues = severity === 'error' ? state.errors : state.warnings;
  const key = issueKey(table, field, message);
  const existing = issues.get(key);
  if (existing) {
    existing.occurrences += 1;
    if (existing.samples.length < MAX_SAMPLES_PER_ISSUE)
      existing.samples.push({ row, value: displayValue(value) });
    return;
  }
  issues.set(key, {
    table,
    field,
    message,
    occurrences: 1,
    samples: [{ row, value: displayValue(value) }],
  });
};

const numericValue = (value: TableValue): number =>
  typeof value === 'number' ? value : Number(value.replace(',', '.').trim());

const validateRows = (
  state: ValidationState,
  table: string,
  rows: readonly TableRow[],
  fields: readonly Field[],
): void => {
  const uniqueValues = new Map<string, Set<string | number>>();
  state.tablesChecked += 1;
  state.rowsChecked += rows.length;

  for (const [rowIndex, row] of rows.entries()) {
    const rowNumber = rowIndex + 1;
    for (const field of fields) {
      const value = row[field.name];
      if (value === undefined || value === '') {
        if (field.type !== Datatype.String)
          addIssue(
            state,
            'error',
            table,
            field.name,
            field.type === Datatype.Int
              ? 'Value is not a valid integer.'
              : 'Value is not a valid number.',
            rowNumber,
            value,
          );
        continue;
      }

      if (field.unique) {
        const values = uniqueValues.get(field.name) ?? new Set<string | number>();
        if (values.has(value))
          addIssue(state, 'error', table, field.name, 'Value must be unique.', rowNumber, value);
        else values.add(value);
        uniqueValues.set(field.name, values);
      }

      if (field.type === Datatype.String) continue;
      const number = numericValue(value);
      if (!Number.isFinite(number)) {
        addIssue(
          state,
          'error',
          table,
          field.name,
          field.type === Datatype.Int
            ? 'Value is not a valid integer.'
            : 'Value is not a valid number.',
          rowNumber,
          value,
        );
        continue;
      }
      if (field.type === Datatype.Int && !Number.isInteger(number)) {
        addIssue(
          state,
          'error',
          table,
          field.name,
          'Value is not a valid integer.',
          rowNumber,
          value,
        );
        continue;
      }
      if (field.range && (number < field.range.min || number > field.range.max))
        addIssue(
          state,
          'warning',
          table,
          field.name,
          `Value is outside the published range ${field.range.min}–${field.range.max}.`,
          rowNumber,
          value,
        );
    }
  }
};

const validateTextSource = async (
  directory: string,
  fifaVersion: number,
  tableNames: readonly string[],
  missingTableMessage: string,
  state: ValidationState,
): Promise<void> => {
  const files = new Map(
    (await readdir(directory))
      .filter((file) => file.toLocaleLowerCase('en').endsWith('.txt'))
      .map((file) => [file.slice(0, -4).toLocaleLowerCase('en'), file]),
  );

  for (const table of tableNames.filter(isSupportedTable)) {
    const file = files.get(table);
    if (!file) {
      addIssue(state, 'error', table, undefined, missingTableMessage, 0, undefined);
      continue;
    }
    try {
      const parsed = parseTextTable(await readFile(join(directory, file)));
      const fields = fieldsFor(fifaVersion, table);
      const headers = new Set(parsed.headers);
      for (const field of fields)
        if (!headers.has(field.name))
          addIssue(
            state,
            'error',
            table,
            field.name,
            'Required field is missing from the table.',
            0,
            undefined,
          );
      validateRows(state, table, parsed.rows, fields);
    } catch (error) {
      addIssue(
        state,
        'error',
        table,
        undefined,
        error instanceof Error ? error.message : String(error),
        0,
        undefined,
      );
    }
  }
};

const normalizeRow = (row: Readonly<Record<string, string | number>>): TableRow =>
  Object.fromEntries(
    Object.entries(row).map(([field, value]) => [field.toLocaleLowerCase('en'), value]),
  );

const validateT3dbSource = async (
  databasePath: string,
  metadataPath: string,
  fifaVersion: number,
  tableNames: readonly string[],
  missingTableMessage: string,
  state: ValidationState,
): Promise<void> => {
  const database = openFifaDatabase({
    database: await readFile(databasePath),
    metadataXml: await readFile(metadataPath, 'utf8'),
  });
  const available = new Map(
    database.listTables().map((table) => [table.name.toLocaleLowerCase('en'), table.name] as const),
  );

  for (const table of tableNames.filter(isSupportedTable)) {
    const databaseTable = available.get(table);
    if (!databaseTable) {
      addIssue(state, 'error', table, undefined, missingTableMessage, 0, undefined);
      continue;
    }
    try {
      const rows = database.readTable(databaseTable).rows.map(normalizeRow);
      validateRows(state, table, rows, fieldsFor(fifaVersion, table));
    } catch (error) {
      addIssue(
        state,
        'error',
        table,
        undefined,
        error instanceof Error ? error.message : String(error),
        0,
        undefined,
      );
    }
  }
};

const issuesFrom = (issues: Map<string, MutableIssue>): DatasetValidationIssue[] =>
  [...issues.values()].sort(
    (left, right) =>
      left.table.localeCompare(right.table, 'en') ||
      (left.field ?? '').localeCompare(right.field ?? '', 'en'),
  );

const validationReport = async (
  rootLabel: 'Dataset' | 'Source',
  validate: (state: ValidationState) => Promise<void>,
): Promise<DatasetValidationReport> => {
  const state: ValidationState = {
    errors: new Map(),
    warnings: new Map(),
    tablesChecked: 0,
    rowsChecked: 0,
  };

  try {
    await validate(state);
  } catch (error) {
    addIssue(
      state,
      'error',
      rootLabel,
      undefined,
      error instanceof Error ? error.message : String(error),
      0,
      undefined,
    );
  }

  const errors = issuesFrom(state.errors);
  const warnings = issuesFrom(state.warnings);
  return {
    validatedAt: new Date().toISOString(),
    tablesChecked: state.tablesChecked,
    rowsChecked: state.rowsChecked,
    errorCount: errors.reduce((total, issue) => total + issue.occurrences, 0),
    warningCount: warnings.reduce((total, issue) => total + issue.occurrences, 0),
    errors,
    warnings,
  };
};

export const validateDatasetSnapshot = async (
  dataset: DatasetRecord,
): Promise<DatasetValidationResult> => {
  const report = await validationReport('Dataset', async (state) => {
    if (dataset.source.kind === 'text-folder')
      await validateTextSource(
        join(dataset.snapshotDirectory, 'text'),
        dataset.fifaVersion,
        dataset.tableNames,
        'Managed table file is missing.',
        state,
      );
    else
      await validateT3dbSource(
        join(dataset.snapshotDirectory, 'database.db'),
        join(dataset.snapshotDirectory, 'metadata.xml'),
        dataset.fifaVersion,
        dataset.tableNames,
        'Managed database table is missing.',
        state,
      );
  });
  return { datasetId: dataset.id, ...report };
};

export const validateSelectedSource = async (
  source: SelectedSource,
  fifaVersion: number,
): Promise<DatasetImportValidationResult> => {
  const report = await validationReport('Source', async (state) => {
    const tableNames = source.inspection.tables.map((table) => table.table);
    if (source.inspection.sourceKind === 'text-folder') {
      const directory = source.inspection.originalPaths[0];
      if (!directory) throw new Error('The selected text folder is unavailable.');
      await validateTextSource(
        directory,
        fifaVersion,
        tableNames,
        'Selected table file is missing.',
        state,
      );
      return;
    }
    const [databasePath, metadataPath] = source.inspection.originalPaths;
    if (!databasePath || !metadataPath)
      throw new Error('The selected t3db source files are unavailable.');
    await validateT3dbSource(
      databasePath,
      metadataPath,
      fifaVersion,
      tableNames,
      'Selected database table is missing.',
      state,
    );
  });
  return { selectionId: source.selectionId, ...report };
};
