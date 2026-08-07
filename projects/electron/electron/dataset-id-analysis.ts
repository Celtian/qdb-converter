import { openFifaDatabase } from 'fifa-t3db';
import { Datatype, type Field } from 'fifatables';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

import type {
  DatasetIdOverflow,
  DatasetIdProfile,
  DatasetIdValueSample,
  DatasetTableIdAnalysis,
} from '../shared/contracts';
import { fieldsFor, isSupportedTable } from '../shared/table-config';
import { type TableRow, type TableValue, parseTextTable } from '../shared/text-format';
import type { ConvertedDatasetRecord, ImportedDatasetRecord } from './dataset-library';

const PROFILE_BUCKET_COUNT = 256;
const MAX_SAMPLES = 20;

export type DatasetIdAnalysisRecord = ImportedDatasetRecord | ConvertedDatasetRecord;

interface SourceTable {
  headers: string[];
  rows: TableRow[];
}

const canonicalIdFields: Readonly<Record<string, string>> = {
  competition: 'competitionid',
  dcplayernames: 'nameid',
  formations: 'formationid',
  leagues: 'leagueid',
  leagueteamlinks: 'artificialkey',
  manager: 'managerid',
  nations: 'nationid',
  playernames: 'nameid',
  players: 'playerid',
  referee: 'refereeid',
  shoecolors: 'colorid',
  stadiums: 'stadiumid',
  teamballs: 'ballid',
  teamkits: 'teamkitid',
  teamplayerlinks: 'artificialkey',
  teams: 'teamid',
};

const overflowFor = (values: readonly number[]): DatasetIdOverflow => {
  const sorted = [...new Set(values)].sort((left, right) => left - right);
  return {
    count: sorted.length,
    min: sorted[0],
    max: sorted.at(-1),
    samples: sorted.slice(0, MAX_SAMPLES),
  };
};

export const createDatasetIdProfile = (
  values: readonly number[],
  range: { min: number; max: number },
): DatasetIdProfile => {
  const occupiedIds = [...new Set(values)].sort((left, right) => left - right);
  const occupied = new Set(occupiedIds.filter((value) => value >= range.min && value <= range.max));
  let activeMax: number | undefined;
  for (const value of occupied) if (activeMax === undefined || value > activeMax) activeMax = value;
  const belowRange = overflowFor(values.filter((value) => value < range.min));
  const aboveRange = overflowFor(values.filter((value) => value > range.max));
  const rangeSize = range.max - range.min + 1;
  const occupiedByBucket = Array<number>(PROFILE_BUCKET_COUNT).fill(0);

  for (const value of occupied) {
    const index = Math.min(
      PROFILE_BUCKET_COUNT - 1,
      Math.ceil(((value - range.min + 1) * PROFILE_BUCKET_COUNT) / rangeSize) - 1,
    );
    occupiedByBucket[index] = (occupiedByBucket[index] ?? 0) + 1;
  }

  const buckets = Array.from({ length: PROFILE_BUCKET_COUNT }, (_, index) => {
    const start = range.min + Math.floor((index * rangeSize) / PROFILE_BUCKET_COUNT);
    const end = range.min + Math.floor(((index + 1) * rangeSize) / PROFILE_BUCKET_COUNT) - 1;
    const occupiedCount = occupiedByBucket[index] ?? 0;
    const bucketSize = Math.max(0, end - start + 1);
    const activeSize =
      activeMax === undefined || start > activeMax
        ? 0
        : Math.max(0, Math.min(end, activeMax) - start + 1);
    const holes = Math.max(0, activeSize - occupiedCount);
    return {
      start,
      end,
      occupied: occupiedCount,
      holes,
      capacity: Math.max(0, bucketSize - occupiedCount - holes),
    };
  });
  const holeCount = buckets.reduce((total, bucket) => total + bucket.holes, 0);
  const capacityCount = buckets.reduce((total, bucket) => total + bucket.capacity, 0);

  return {
    rangeMin: range.min,
    rangeMax: range.max,
    activeMax,
    occupiedIds,
    occupiedCount: occupied.size,
    holeCount,
    capacityCount,
    outOfRangeCount: belowRange.count + aboveRange.count,
    belowRange,
    aboveRange,
    buckets,
  };
};

export const canonicalIdField = (fifaVersion: number, table: string): Field | undefined => {
  if (!isSupportedTable(table)) return undefined;
  const fields = fieldsFor(fifaVersion, table);
  const configured = canonicalIdFields[table];
  const configuredField = configured
    ? fields.find((field) => field.name === configured)
    : undefined;
  if (configuredField?.type === Datatype.Int && configuredField.range) return configuredField;
  return fields.find((field) => field.type === Datatype.Int && field.unique && field.range);
};

const displayValue = (value: TableValue | undefined): string | number => {
  if (value === undefined || value === '') return '(missing)';
  return value;
};

const integerValue = (value: TableValue | undefined): number | undefined => {
  if (typeof value === 'number') return Number.isInteger(value) ? value : undefined;
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const number = Number(value.trim());
  return Number.isInteger(number) ? number : undefined;
};

export const analyzeDatasetIdTable = (
  fifaVersion: number,
  table: string,
  source: SourceTable,
): DatasetTableIdAnalysis => {
  const base = {
    table,
    rows: source.rows.length,
    duplicateCount: 0,
    duplicateSamples: [] as number[],
    invalidCount: 0,
    invalidSamples: [] as DatasetIdValueSample[],
  };
  const field = canonicalIdField(fifaVersion, table);
  if (!field)
    return {
      ...base,
      unavailableReason: 'No unique integer ID with a published range is defined for this table.',
    };
  if (!source.headers.includes(field.name))
    return { ...base, keyField: field.name, error: `${field.name} is missing from this table.` };

  const values: number[] = [];
  const seen = new Set<number>();
  const duplicateValues = new Set<number>();
  const invalidSamples: DatasetIdValueSample[] = [];
  let duplicateCount = 0;
  let invalidCount = 0;
  for (const [index, row] of source.rows.entries()) {
    const raw = row[field.name];
    const value = integerValue(raw);
    if (value === undefined) {
      invalidCount += 1;
      if (invalidSamples.length < MAX_SAMPLES)
        invalidSamples.push({ row: index + 1, value: displayValue(raw) });
      continue;
    }
    values.push(value);
    if (seen.has(value)) {
      duplicateCount += 1;
      duplicateValues.add(value);
    } else seen.add(value);
  }

  return {
    ...base,
    keyField: field.name,
    profile: createDatasetIdProfile(values, field.range!),
    duplicateCount,
    duplicateSamples: [...duplicateValues]
      .sort((left, right) => left - right)
      .slice(0, MAX_SAMPLES),
    invalidCount,
    invalidSamples,
  };
};

const normalizeRow = (row: Readonly<Record<string, string | number>>): TableRow =>
  Object.fromEntries(
    Object.entries(row).map(([field, value]) => [field.toLocaleLowerCase('en'), value]),
  );

const failedTable = (table: string, error: unknown): DatasetTableIdAnalysis => ({
  table,
  rows: 0,
  duplicateCount: 0,
  duplicateSamples: [],
  invalidCount: 0,
  invalidSamples: [],
  error: error instanceof Error ? error.message : String(error),
});

const analyzeTextDataset = async (
  dataset: DatasetIdAnalysisRecord,
  progress: (message: string) => void,
): Promise<DatasetTableIdAnalysis[]> => {
  const directory =
    'source' in dataset ? join(dataset.snapshotDirectory, 'text') : dataset.snapshotDirectory;
  const files = new Map(
    (await readdir(directory))
      .filter((file) => file.toLocaleLowerCase('en').endsWith('.txt'))
      .map((file) => [file.slice(0, -4).toLocaleLowerCase('en'), file]),
  );
  const tableNames = [...new Set([...dataset.tableNames, ...files.keys()])]
    .filter(isSupportedTable)
    .sort((left, right) => left.localeCompare(right, 'en'));
  const analyses: DatasetTableIdAnalysis[] = [];
  for (const table of tableNames) {
    progress(`Analyzing ${table} IDs…`);
    const file = files.get(table);
    if (!file) {
      analyses.push(failedTable(table, 'The managed table file is missing.'));
      continue;
    }
    try {
      analyses.push(
        analyzeDatasetIdTable(
          dataset.fifaVersion,
          table,
          parseTextTable(await readFile(join(directory, file))),
        ),
      );
    } catch (error) {
      analyses.push(failedTable(table, error));
    }
  }
  return analyses;
};

const analyzeT3dbDataset = async (
  dataset: ImportedDatasetRecord,
  progress: (message: string) => void,
): Promise<DatasetTableIdAnalysis[]> => {
  const database = openFifaDatabase({
    database: await readFile(join(dataset.snapshotDirectory, 'database.db')),
    metadataXml: await readFile(join(dataset.snapshotDirectory, 'metadata.xml'), 'utf8'),
  });
  const available = new Map(
    database.listTables().map((table) => [table.name.toLocaleLowerCase('en'), table.name] as const),
  );
  const tableNames = [...new Set([...dataset.tableNames, ...available.keys()])]
    .filter(isSupportedTable)
    .sort((left, right) => left.localeCompare(right, 'en'));
  return tableNames.map((table) => {
    progress(`Analyzing ${table} IDs…`);
    const databaseTable = available.get(table);
    if (!databaseTable) return failedTable(table, 'The managed database table is missing.');
    try {
      const schema = database.schema.tables.find(
        (candidate) => candidate.name.toLocaleLowerCase('en') === table,
      );
      if (!schema) return failedTable(table, 'Table metadata was not found.');
      return analyzeDatasetIdTable(dataset.fifaVersion, table, {
        headers: schema.fields.map((field) => field.name.toLocaleLowerCase('en')),
        rows: database.readTable(databaseTable).rows.map(normalizeRow),
      });
    } catch (error) {
      return failedTable(table, error);
    }
  });
};

export const analyzeDatasetIds = async (
  dataset: DatasetIdAnalysisRecord,
  progress: (message: string) => void = () => undefined,
): Promise<DatasetTableIdAnalysis[]> => {
  progress('Reading managed dataset tables…');
  const analyses =
    'source' in dataset && (dataset.managedFormat ?? dataset.source.kind) === 't3db'
      ? await analyzeT3dbDataset(dataset, progress)
      : await analyzeTextDataset(dataset, progress);
  progress('Dataset ID analysis completed.');
  return analyses;
};
