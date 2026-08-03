import { type Field, Fifa, Table, fifaTableConfig, sortByOrder } from 'fifatables';

export const SUPPORTED_FIFA_VERSIONS = Array.from({ length: 13 }, (_, index) => index + 11);
export const SUPPORTED_TABLES = Object.values(Table);

export const fifaForVersion = (version: number): Fifa => {
  const fifa = Object.values(Fifa).find((candidate) => Number(candidate.slice(4)) === version);
  if (!fifa) throw new Error('Unsupported FIFA version. Choose FIFA 11–23.');
  return fifa;
};

export const tableForName = (name: string): Table => {
  const table = SUPPORTED_TABLES.find((candidate) => candidate === name.toLocaleLowerCase('en'));
  if (!table) throw new Error(`Unsupported table: ${name}`);
  return table;
};

export const fieldsFor = (version: number, tableName: string): Field[] =>
  [...fifaTableConfig(fifaForVersion(version), tableForName(tableName))].sort(sortByOrder);

export const isSupportedVersion = (version: number): boolean =>
  SUPPORTED_FIFA_VERSIONS.includes(version);

export const isSupportedTable = (table: string): boolean =>
  SUPPORTED_TABLES.includes(table as Table);
