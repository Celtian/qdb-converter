import { openFifaDatabase } from 'fifa-t3db';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

import type { PlayernameIdProfile, PlayernameTableAnalysis } from '../shared/contracts';
import { fieldsFor } from '../shared/table-config';
import { type TableRow, type TableValue, parseTextTable } from '../shared/text-format';
import { createDatasetIdProfile } from './dataset-id-analysis';
import type { ConvertedDatasetRecord, ImportedDatasetRecord } from './dataset-library';

export const PLAYERNAME_TABLES = ['playernames', 'dcplayernames'] as const;
export const PLAYERNAME_REFERENCE_FIELDS = [
  'firstnameid',
  'lastnameid',
  'playerjerseynameid',
  'commonnameid',
] as const;

export type PlayernameTable = (typeof PLAYERNAME_TABLES)[number];
export type PlayernameDatasetRecord = ImportedDatasetRecord | ConvertedDatasetRecord;

interface SourceTable {
  headers: string[];
  rows: TableRow[];
}

export interface InspectedNameTable extends SourceTable {
  name: PlayernameTable;
  ids: number[];
  range: { min: number; max: number };
  profile: PlayernameIdProfile;
}

export interface PlayernameInspection {
  tables: InspectedNameTable[];
  players: SourceTable;
  references: number[];
}

export class PlayernameInspectionError extends Error {
  constructor(
    message: string,
    readonly tables: PlayernameTableAnalysis[],
  ) {
    super(message);
    this.name = 'PlayernameInspectionError';
  }
}

const cancelledError = (): Error => new Error('PLAYERNAMES_CANCELLED');

export const checkPlayernameCancelled = (cancelled: () => boolean): void => {
  if (cancelled()) throw cancelledError();
};

export const playernameInteger = (value: TableValue | undefined, label: string): number => {
  const text = typeof value === 'string' ? value.trim() : undefined;
  const number = typeof value === 'number' ? value : text ? Number(text) : Number.NaN;
  if (!Number.isInteger(number)) throw new Error(`${label} is not a valid integer.`);
  return number;
};

const tableRange = (
  fifaVersion: number,
  table: PlayernameTable,
): { min: number; max: number } | undefined =>
  fieldsFor(fifaVersion, table).find((field) => field.name === 'nameid')?.range;

export const createPlayernameIdProfile = (
  ids: readonly number[],
  range: { min: number; max: number },
): PlayernameIdProfile => createDatasetIdProfile(ids, range);

const playerReferences = (rows: readonly TableRow[]): number[] => {
  const references: number[] = [];
  for (const [rowIndex, row] of rows.entries())
    for (const field of PLAYERNAME_REFERENCE_FIELDS)
      references.push(playernameInteger(row[field], `players row ${rowIndex + 1} ${field}`));
  return references;
};

const validateNameIds = (tables: readonly InspectedNameTable[]): Map<number, PlayernameTable> => {
  const ids = new Map<number, PlayernameTable>();
  for (const table of tables)
    for (const id of table.ids) {
      const existing = ids.get(id);
      if (existing)
        throw new Error(`Name ID ${id} is duplicated in ${existing} and ${table.name}.`);
      ids.set(id, table.name);
    }
  return ids;
};

const ensureReferencesExist = (
  references: readonly number[],
  nameIds: ReadonlyMap<number, PlayernameTable>,
): void => {
  const missing = [...new Set(references.filter((id) => !nameIds.has(id)))].sort(
    (left, right) => left - right,
  );
  if (missing.length)
    throw new Error(
      `Players reference missing name IDs: ${missing.slice(0, 25).join(', ')}${missing.length > 25 ? '…' : ''}`,
    );
};

const inspectTables = (
  sourceTables: ReadonlyMap<string, SourceTable>,
  fifaVersion: number,
): PlayernameInspection => {
  const players = sourceTables.get('players');
  const playernames = sourceTables.get('playernames');
  if (!players || !playernames)
    throw new Error('The dataset must contain players and playernames tables.');
  for (const field of PLAYERNAME_REFERENCE_FIELDS)
    if (!players.headers.includes(field)) throw new Error(`players.${field} is missing.`);

  const tables: InspectedNameTable[] = [];
  try {
    for (const table of PLAYERNAME_TABLES) {
      const source = sourceTables.get(table);
      if (!source) continue;
      const range = tableRange(fifaVersion, table);
      if (!range) continue;
      if (!source.headers.includes('nameid')) throw new Error(`${table}.nameid is missing.`);
      const ids = source.rows.map((row, index) =>
        playernameInteger(row['nameid'], `${table} row ${index + 1} nameid`),
      );
      tables.push({
        ...source,
        name: table,
        ids,
        range,
        profile: createPlayernameIdProfile(ids, range),
      });
    }
    if (!tables.some((table) => table.name === 'playernames'))
      throw new Error('The playernames table is not supported for this FIFA version.');

    const ids = validateNameIds(tables);
    const references = playerReferences(players.rows);
    ensureReferencesExist(references, ids);
    return { tables, players, references };
  } catch (error) {
    if (!tables.length || error instanceof PlayernameInspectionError) throw error;
    throw new PlayernameInspectionError(
      error instanceof Error ? error.message : String(error),
      tables.map((table) => ({ table: table.name, profile: table.profile })),
    );
  }
};

export const inspectPlayernameTextDirectory = async (
  directory: string,
  fifaVersion: number,
): Promise<PlayernameInspection> => {
  const files = new Map(
    (await readdir(directory))
      .filter((file) => file.toLocaleLowerCase('en').endsWith('.txt'))
      .map((file) => [file.slice(0, -4).toLocaleLowerCase('en'), join(directory, file)]),
  );
  const sourceTables = new Map<string, SourceTable>();
  for (const table of ['players', ...PLAYERNAME_TABLES]) {
    const path = files.get(table);
    if (!path) continue;
    sourceTables.set(table, parseTextTable(await readFile(path)));
  }
  return inspectTables(sourceTables, fifaVersion);
};

const normalizeRow = (row: Readonly<Record<string, string | number>>): TableRow =>
  Object.fromEntries(
    Object.entries(row).map(([field, value]) => [field.toLocaleLowerCase('en'), value]),
  );

const inspectT3dbDataset = async (
  dataset: ImportedDatasetRecord,
  progress: (message: string) => void,
  cancelled: () => boolean,
): Promise<PlayernameInspection> => {
  const database = openFifaDatabase({
    database: await readFile(join(dataset.snapshotDirectory, 'database.db')),
    metadataXml: await readFile(join(dataset.snapshotDirectory, 'metadata.xml'), 'utf8'),
  });
  const available = new Map(
    database.listTables().map((table) => [table.name.toLocaleLowerCase('en'), table.name] as const),
  );
  const sourceTables = new Map<string, SourceTable>();
  for (const table of ['players', ...PLAYERNAME_TABLES]) {
    checkPlayernameCancelled(cancelled);
    const databaseTable = available.get(table);
    if (!databaseTable) continue;
    progress(`Reading ${databaseTable}…`);
    const schema = database.schema.tables.find(
      (candidate) => candidate.name.toLocaleLowerCase('en') === table,
    );
    if (!schema) throw new Error(`Metadata for ${databaseTable} was not found.`);
    sourceTables.set(table, {
      headers: schema.fields.map((field) => field.name.toLocaleLowerCase('en')),
      rows: database.readTable(databaseTable).rows.map(normalizeRow),
    });
  }
  return inspectTables(sourceTables, dataset.fifaVersion);
};

export const analyzePlayernameDataset = async (
  dataset: PlayernameDatasetRecord,
  progress: (message: string) => void = () => undefined,
  cancelled: () => boolean = () => false,
): Promise<PlayernameTableAnalysis[]> => {
  checkPlayernameCancelled(cancelled);
  progress('Reading player-name tables…');
  const inspection =
    'source' in dataset && (dataset.managedFormat ?? dataset.source.kind) === 't3db'
      ? await inspectT3dbDataset(dataset, progress, cancelled)
      : await inspectPlayernameTextDirectory(
          'source' in dataset ? join(dataset.snapshotDirectory, 'text') : dataset.snapshotDirectory,
          dataset.fifaVersion,
        );
  checkPlayernameCancelled(cancelled);
  progress('Player-name ID analysis completed.');
  return inspection.tables.map((table) => ({ table: table.name, profile: table.profile }));
};
