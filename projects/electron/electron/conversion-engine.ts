import { type FifaDatabase, openFifaDatabase } from 'fifa-t3db';
import { registerFifaDatePrototype } from 'fifadate';
import {
  Attribute,
  CalculateUtils,
  type FifaRatingAttributes,
  Position,
  Fifa as RatingFifa,
} from 'fifarating';
import { Datatype, type Field } from 'fifatables';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { TableConversionSummary } from '../shared/contracts';
import { fieldsFor, isSupportedTable } from '../shared/table-config';
import {
  type TableRow,
  type TableValue,
  encodeFifaText,
  parseTextTable,
} from '../shared/text-format';
import type { ImportedDatasetRecord } from './dataset-library';

registerFifaDatePrototype();

export interface DatasetConversionOutput {
  tables: TableConversionSummary[];
  warnings: string[];
}

interface TableSource {
  available: Set<string>;
  read(table: string): Promise<TableRow[]>;
}

const textSource = async (directory: string): Promise<TableSource> => {
  const files = await readdir(directory);
  const byTable = new Map(
    files
      .filter((file) => file.toLocaleLowerCase('en').endsWith('.txt'))
      .map((file) => [file.slice(0, -4).toLocaleLowerCase('en'), join(directory, file)]),
  );
  return {
    available: new Set(byTable.keys()),
    async read(table) {
      const path = byTable.get(table);
      if (!path) throw new Error(`Source table ${table} was not found.`);
      return parseTextTable(await readFile(path)).rows;
    },
  };
};

const t3dbSource = async (directory: string): Promise<TableSource> => {
  const database: FifaDatabase = openFifaDatabase({
    database: await readFile(join(directory, 'database.db')),
    metadataXml: await readFile(join(directory, 'metadata.xml'), 'utf8'),
  });
  const available = new Set(
    database.listTables().map((table) => table.name.toLocaleLowerCase('en')),
  );
  return {
    available,
    async read(table) {
      return database.readTable(table).rows.map((row) => ({ ...row }));
    },
  };
};

const targetDefault = (field: Field): TableValue =>
  typeof field.default === 'number' ? field.default : String(field.default ?? '');

const normalizedValue = (
  field: Field,
  source: TableValue | undefined,
): { value: TableValue; substituted: boolean } => {
  if (source === undefined || source === '')
    return { value: targetDefault(field), substituted: true };
  if (field.type === Datatype.String) return { value: String(source), substituted: false };
  const number =
    typeof source === 'number' ? source : Number(String(source).replace(',', '.').trim());
  if (!Number.isFinite(number)) return { value: targetDefault(field), substituted: true };
  if (field.range && (number < field.range.min || number > field.range.max))
    return { value: targetDefault(field), substituted: true };
  if (
    ['birthdate', 'playerjointeamdate', 'managerjointeamdate', 'loandateend'].includes(field.name)
  ) {
    try {
      const date = Date.fromFifaDate(number);
      if (Number.isNaN(date.getTime())) return { value: targetDefault(field), substituted: true };
    } catch {
      return { value: targetDefault(field), substituted: true };
    }
  }
  return {
    value: field.type === Datatype.Int ? Math.trunc(number) : number,
    substituted: false,
  };
};

const positionValues = Object.values(Position);
const ratingFifa = (version: number): RatingFifa | undefined =>
  Object.values(RatingFifa).find((candidate) => Number(candidate.slice(4)) === version);

const hasRatingDifference = (row: TableRow, targetVersion: number): boolean => {
  const fifa = ratingFifa(targetVersion);
  const stored = Number(row['overallrating']);
  const position = positionValues[Number(row['preferredposition1'])];
  if (!fifa || !position || !Number.isFinite(stored)) return false;
  const attributes = Object.fromEntries(
    Object.values(Attribute).map((attribute) => [attribute, Number(row[attribute]) || 0]),
  ) as FifaRatingAttributes;
  const calculated = CalculateUtils.rawOverall(attributes, fifa, position);
  return Number.isFinite(calculated) && Math.round(calculated) !== Math.round(stored);
};

export const createConvertedDatasetSnapshot = async (
  dataset: ImportedDatasetRecord,
  targetVersion: number,
  outputDirectory: string,
  progress?: (message: string) => void,
  cancelled: () => boolean = () => false,
): Promise<DatasetConversionOutput> => {
  const source =
    (dataset.managedFormat ?? dataset.source.kind) === 'text-folder'
      ? await textSource(join(dataset.snapshotDirectory, 'text'))
      : await t3dbSource(dataset.snapshotDirectory);
  await mkdir(outputDirectory, { recursive: true });
  const summaries: TableConversionSummary[] = [];
  const warnings: string[] = [];

  try {
    const selected = dataset.tableNames.filter(
      (table) => isSupportedTable(table) && fieldsFor(targetVersion, table).length > 0,
    );
    if (!selected.length)
      throw new Error('The imported dataset has no tables compatible with the target FIFA.');
    for (const [tableIndex, table] of selected.entries()) {
      if (cancelled()) throw new Error('CONVERSION_CANCELLED');
      if (!source.available.has(table)) {
        warnings.push(`${table}: not present in ${dataset.name}; skipped.`);
        continue;
      }
      progress?.(`Converting ${table} (${tableIndex + 1}/${selected.length})…`);
      const fields = fieldsFor(targetVersion, table);
      const rows = await source.read(table);
      let defaultSubstitutions = 0;
      let ratingDifferences = 0;
      const converted = rows.map((row, rowIndex) => {
        if (rowIndex % 1_000 === 0 && cancelled()) throw new Error('CONVERSION_CANCELLED');
        const output: TableRow = {};
        for (const field of fields) {
          const normalized = normalizedValue(field, row[field.name]);
          if (normalized.substituted) defaultSubstitutions += 1;
          output[field.name] = normalized.value;
        }
        if (table === 'players' && hasRatingDifference(output, targetVersion))
          ratingDifferences += 1;
        return output;
      });
      await writeFile(
        join(outputDirectory, `${table}.txt`),
        encodeFifaText(
          fields.map((field) => field.name),
          converted,
        ),
      );
      summaries.push({
        table,
        rows: converted.length,
        defaultSubstitutions,
        ratingDifferences,
        warnings: [],
      });
    }
    return { tables: summaries, warnings };
  } catch (error) {
    await rm(outputDirectory, { recursive: true, force: true });
    throw error;
  }
};
