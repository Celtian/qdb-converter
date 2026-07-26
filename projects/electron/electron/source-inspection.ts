import { readFile, readdir } from 'node:fs/promises';
import { basename, dirname, extname, join } from 'node:path';
import { openFifaDatabase, type FifaDatabase } from 'fifa-t3db';
import type { DatasetImportCandidate } from '../shared/contracts';
import { fieldsFor, SUPPORTED_FIFA_VERSIONS, SUPPORTED_TABLES } from '../shared/table-config';
import { parseTextTable } from '../shared/text-format';

const sameFields = (actual: readonly string[], expected: readonly string[]): boolean => {
  if (actual.length !== expected.length) return false;
  const expectedSet = new Set(expected);
  return actual.every((field) => expectedSet.has(field));
};

const matchingVersionsFor = (tables: Map<string, string[]>): number[] =>
  SUPPORTED_FIFA_VERSIONS.filter((version) =>
    [...tables].every(([table, headers]) =>
      sameFields(
        headers,
        fieldsFor(version, table).map((field) => field.name),
      ),
    ),
  );

export interface InspectedSource {
  suggestedName: string;
  sourceKind: DatasetImportCandidate['sourceKind'];
  originalPaths: string[];
  detectedVersion?: number;
  matchingVersions: number[];
  tableNames: string[];
  warnings: string[];
}

export const inspectTextSource = async (path: string): Promise<InspectedSource> => {
  const files = (await readdir(path, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && extname(entry.name).toLocaleLowerCase('en') === '.txt')
    .map((entry) => entry.name);
  if (!files.length) throw new Error('The selected folder contains no .txt table files.');

  const supported = new Map<string, string[]>();
  for (const file of files) {
    const table = file.slice(0, -4).toLocaleLowerCase('en');
    const parsed = parseTextTable(await readFile(join(path, file)));
    if (!SUPPORTED_TABLES.includes(table as (typeof SUPPORTED_TABLES)[number])) continue;
    supported.set(table, parsed.headers);
  }
  if (!supported.size) throw new Error('The folder contains no supported FIFA table files.');

  const matchingVersions = matchingVersionsFor(supported);
  if (!matchingVersions.length)
    throw new Error('The table headers do not match any supported FIFA 11–23 schema.');
  const warnings =
    files.length === supported.size
      ? []
      : [
          `${files.length - supported.size} unsupported text tables will be preserved but not converted.`,
        ];
  return {
    suggestedName: basename(path),
    sourceKind: 'text-folder',
    originalPaths: [path],
    detectedVersion: matchingVersions.length === 1 ? matchingVersions[0] : undefined,
    matchingVersions,
    tableNames: [...supported.keys()].sort(),
    warnings,
  };
};

const t3dbTables = (database: FifaDatabase): Map<string, string[]> => {
  const result = new Map<string, string[]>();
  for (const table of database.schema.tables) {
    const name = table.name.toLocaleLowerCase('en');
    if (!SUPPORTED_TABLES.includes(name as (typeof SUPPORTED_TABLES)[number])) continue;
    result.set(
      name,
      table.fields.map((field) => field.name.toLocaleLowerCase('en')),
    );
  }
  return result;
};

export const inspectT3dbSource = async (
  databasePath: string,
  metadataPath: string,
): Promise<InspectedSource> => {
  const [databaseBytes, metadataXml] = await Promise.all([
    readFile(databasePath),
    readFile(metadataPath, 'utf8'),
  ]);
  const database = openFifaDatabase({ database: databaseBytes, metadataXml });
  const tables = t3dbTables(database);
  if (!tables.size) throw new Error('The database contains no supported FIFA tables.');
  const matchingVersions = matchingVersionsFor(tables);
  if (!matchingVersions.length)
    throw new Error('The t3db schema does not match any supported FIFA 11–23 schema.');
  return {
    suggestedName: basename(databasePath, extname(databasePath)),
    sourceKind: 't3db',
    originalPaths: [databasePath, metadataPath],
    detectedVersion: matchingVersions.length === 1 ? matchingVersions[0] : undefined,
    matchingVersions,
    tableNames: [...tables.keys()].sort(),
    warnings: [],
  };
};

export const defaultMetadataPath = (databasePath: string): string =>
  join(dirname(databasePath), 'fifa_ng_db-meta.xml');
