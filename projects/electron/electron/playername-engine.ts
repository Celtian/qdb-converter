import { openFifaDatabase } from 'fifa-t3db';
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import type {
  PlayernameOperations,
  PlayernameSummary,
  PlayernameTableSummary,
} from '../shared/contracts';
import { type TableRow, encodeFifaText } from '../shared/text-format';
import type { ConvertedDatasetRecord, ImportedDatasetRecord } from './dataset-library';
import {
  type InspectedNameTable,
  PLAYERNAME_REFERENCE_FIELDS,
  type PlayernameTable,
  checkPlayernameCancelled,
  createPlayernameIdProfile,
  inspectPlayernameTextDirectory,
  playernameInteger,
} from './playername-analysis';

type DatasetRecord = ImportedDatasetRecord | ConvertedDatasetRecord;
type LoadedTable = InspectedNameTable & { path: string };

const tableFiles = async (directory: string): Promise<Map<string, string>> =>
  new Map(
    (await readdir(directory))
      .filter((file) => file.toLocaleLowerCase('en').endsWith('.txt'))
      .map((file) => [file.slice(0, -4).toLocaleLowerCase('en'), join(directory, file)]),
  );

const materializeT3db = async (
  dataset: ImportedDatasetRecord,
  outputDirectory: string,
  progress: (message: string) => void,
  cancelled: () => boolean,
): Promise<void> => {
  const database = openFifaDatabase({
    database: await readFile(join(dataset.snapshotDirectory, 'database.db')),
    metadataXml: await readFile(join(dataset.snapshotDirectory, 'metadata.xml'), 'utf8'),
  });
  await mkdir(outputDirectory, { recursive: true });
  const tables = database.listTables();
  for (const [index, table] of tables.entries()) {
    checkPlayernameCancelled(cancelled);
    progress(`Extracting ${table.name} (${index + 1}/${tables.length})…`);
    const schema = database.schema.tables.find(
      (candidate) => candidate.name.toLocaleLowerCase('en') === table.name.toLocaleLowerCase('en'),
    );
    if (!schema) throw new Error(`Metadata for ${table.name} was not found.`);
    const headers = schema.fields.map((field) => field.name.toLocaleLowerCase('en'));
    const rows = database
      .readTable(table.name)
      .rows.map((row) =>
        Object.fromEntries(
          Object.entries(row).map(([field, value]) => [field.toLocaleLowerCase('en'), value]),
        ),
      );
    await writeFile(
      join(outputDirectory, `${table.name.toLocaleLowerCase('en')}.txt`),
      encodeFifaText(headers, rows),
    );
  }
};

const materializeTextSnapshot = async (
  dataset: DatasetRecord,
  outputDirectory: string,
  progress: (message: string) => void,
  cancelled: () => boolean,
): Promise<void> => {
  checkPlayernameCancelled(cancelled);
  if ('source' in dataset && (dataset.managedFormat ?? dataset.source.kind) === 't3db') {
    await materializeT3db(dataset, outputDirectory, progress, cancelled);
    return;
  }
  progress('Copying the complete source dataset…');
  await cp(
    'source' in dataset ? join(dataset.snapshotDirectory, 'text') : dataset.snapshotDirectory,
    outputDirectory,
    { recursive: true, errorOnExist: true, force: false },
  );
};

const minMax = (values: readonly number[]): { min?: number; max?: number } =>
  values.length ? { min: Math.min(...values), max: Math.max(...values) } : {};

const summaryFor = (table: LoadedTable, afterRows: readonly TableRow[]): PlayernameTableSummary => {
  const afterIds = afterRows.map((row, index) =>
    playernameInteger(row['nameid'], `${table.name} output row ${index + 1} nameid`),
  );
  const beforeRange = minMax(table.ids);
  const afterRange = minMax(afterIds);
  return {
    table: table.name,
    beforeRows: table.rows.length,
    afterRows: afterRows.length,
    removedRows: table.rows.length - afterRows.length,
    minBefore: beforeRange.min,
    maxBefore: beforeRange.max,
    minAfter: afterRange.min,
    maxAfter: afterRange.max,
    beforeIdProfile: table.profile,
    afterIdProfile: createPlayernameIdProfile(afterIds, table.range),
  };
};

const minimize = (
  tables: readonly LoadedTable[],
  players: readonly TableRow[],
): { rows: Map<PlayernameTable, TableRow[]>; players: TableRow[]; referencesUpdated: number } => {
  const reindex = new Map<number, number>();
  const output = new Map<PlayernameTable, TableRow[]>();
  let previousRange: LoadedTable['range'] | undefined;
  let previousEnd: number | undefined;

  for (const table of tables) {
    const overlapsPrevious =
      previousRange !== undefined &&
      table.range.min <= previousRange.max &&
      table.range.max >= previousRange.min;
    const start =
      overlapsPrevious && previousEnd !== undefined
        ? Math.max(table.range.min, previousEnd + 1)
        : table.range.min;
    const end = start + table.rows.length - 1;
    if (table.rows.length && end > table.range.max)
      throw new Error(`${table.name} cannot fit inside its published ID range.`);
    const rows = table.rows.map((row, index) => {
      const id = start + index;
      reindex.set(table.ids[index]!, id);
      return { ...row, nameid: id };
    });
    output.set(table.name, rows);
    previousRange = table.range;
    previousEnd = table.rows.length ? end : previousEnd;
  }

  let referencesUpdated = 0;
  const updatedPlayers = players.map((row) => {
    const updated = { ...row };
    for (const field of PLAYERNAME_REFERENCE_FIELDS) {
      const before = playernameInteger(row[field], `players ${field}`);
      const after = reindex.get(before);
      if (after === undefined) throw new Error(`Name ID ${before} could not be reindexed.`);
      if (after !== before) referencesUpdated += 1;
      updated[field] = after;
    }
    return updated;
  });
  return { rows: output, players: updatedPlayers, referencesUpdated };
};

const removeUnused = (
  tables: readonly LoadedTable[],
  players: readonly TableRow[],
  references: readonly number[],
): { rows: Map<PlayernameTable, TableRow[]>; players: TableRow[]; referencesUpdated: number } => {
  const used = new Set(references);
  return {
    rows: new Map(
      tables.map((table) => [
        table.name,
        table.rows.filter((_row, index) => used.has(table.ids[index]!)),
      ]),
    ),
    players: [...players],
    referencesUpdated: 0,
  };
};

const withRows = (tables: readonly LoadedTable[], rows: ReadonlyMap<PlayernameTable, TableRow[]>) =>
  tables.map((table) => {
    const updatedRows = rows.get(table.name) ?? [];
    return {
      ...table,
      rows: updatedRows,
      ids: updatedRows.map((row, index) =>
        playernameInteger(row['nameid'], `${table.name} row ${index + 1} nameid`),
      ),
    };
  });

export const createPlayernameDatasetSnapshot = async (
  dataset: DatasetRecord,
  operations: PlayernameOperations,
  outputDirectory: string,
  progress: (message: string) => void = () => undefined,
  cancelled: () => boolean = () => false,
): Promise<PlayernameSummary> => {
  try {
    if (!operations.minimize && !operations.removeUnused)
      throw new Error('Select at least one Playernames operation.');
    await materializeTextSnapshot(dataset, outputDirectory, progress, cancelled);
    checkPlayernameCancelled(cancelled);
    const files = await tableFiles(outputDirectory);
    const playersPath = files.get('players');
    progress('Checking player-name references…');
    const inspection = await inspectPlayernameTextDirectory(outputDirectory, dataset.fifaVersion);
    if (!playersPath) throw new Error('The dataset must contain players and playernames tables.');
    const tables: LoadedTable[] = inspection.tables.map((table) => ({
      ...table,
      path: files.get(table.name)!,
    }));
    const outOfRange = tables.find((table) => table.profile.outOfRangeCount > 0);
    if (outOfRange && !operations.minimize)
      throw new Error(
        `${outOfRange.name} contains ${outOfRange.profile.outOfRangeCount} name IDs outside the FIFA ${dataset.fifaVersion} range ${outOfRange.range.min}–${outOfRange.range.max}. Select Minimize ID holes to repair them.`,
      );
    checkPlayernameCancelled(cancelled);

    let transformedRows = new Map(tables.map((table) => [table.name, table.rows]));
    let transformedPlayers = inspection.players.rows;
    let workingTables = tables;
    let referencesUpdated = 0;
    if (operations.removeUnused) {
      progress('Removing unused player names…');
      const removed = removeUnused(workingTables, transformedPlayers, inspection.references);
      transformedRows = removed.rows;
      workingTables = withRows(workingTables, transformedRows);
      checkPlayernameCancelled(cancelled);
    }
    if (operations.minimize) {
      progress('Closing player-name ID holes…');
      const minimized = minimize(workingTables, transformedPlayers);
      transformedRows = minimized.rows;
      transformedPlayers = minimized.players;
      referencesUpdated = minimized.referencesUpdated;
      checkPlayernameCancelled(cancelled);
    }

    for (const table of tables) {
      checkPlayernameCancelled(cancelled);
      await writeFile(
        table.path,
        encodeFifaText(table.headers, transformedRows.get(table.name) ?? []),
      );
    }
    await writeFile(playersPath, encodeFifaText(inspection.players.headers, transformedPlayers));

    const summaries = tables.map((table) =>
      summaryFor(table, transformedRows.get(table.name) ?? []),
    );
    return {
      operations,
      tables: summaries,
      referencesUpdated,
      totalRowsBefore: summaries.reduce((total, table) => total + table.beforeRows, 0),
      totalRowsAfter: summaries.reduce((total, table) => total + table.afterRows, 0),
    };
  } catch (error) {
    await rm(outputDirectory, { recursive: true, force: true });
    throw error;
  }
};
