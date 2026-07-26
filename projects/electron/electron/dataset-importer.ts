import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, readdir } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import { openFifaDatabase } from 'fifa-t3db';
import type { DatasetRecord } from './dataset-library';
import { sourceProvenance } from './dataset-library';
import type { SelectedSource } from './source-selections';
import { SUPPORTED_TABLES } from '../shared/table-config';
import { parseTextTable } from '../shared/text-format';

const hashFile = async (path: string): Promise<string> =>
  createHash('sha256')
    .update(await readFile(path))
    .digest('hex');

export const importDatasetSnapshot = async (
  id: string,
  name: string,
  fifaVersion: number,
  source: SelectedSource,
  temporaryDirectory: string,
  progress?: (message: string) => void,
): Promise<DatasetRecord> => {
  await mkdir(temporaryDirectory, { recursive: true });
  const hashes: Record<string, string> = {};
  let rowCount = 0;
  const tableNames = source.inspection.tables.map((table) => table.table);

  if (source.inspection.sourceKind === 'text-folder') {
    const sourcePath = source.inspection.originalPaths[0]!;
    const destination = join(temporaryDirectory, 'text');
    await mkdir(destination, { recursive: true });
    const files = (await readdir(sourcePath, { withFileTypes: true })).filter(
      (entry) => entry.isFile() && extname(entry.name).toLocaleLowerCase('en') === '.txt',
    );
    for (const [index, file] of files.entries()) {
      progress?.(`Copying ${file.name} (${index + 1}/${files.length})…`);
      const inputPath = join(sourcePath, file.name);
      await copyFile(inputPath, join(destination, file.name));
      hashes[file.name] = await hashFile(inputPath);
      const table = file.name.slice(0, -4).toLocaleLowerCase('en');
      if (!SUPPORTED_TABLES.includes(table as (typeof SUPPORTED_TABLES)[number])) continue;
      rowCount += parseTextTable(await readFile(inputPath)).rows.length;
    }
  } else {
    const [databasePath, metadataPath] = source.inspection.originalPaths;
    if (!databasePath || !metadataPath) throw new Error('Both t3db source files are required.');
    progress?.('Copying t3db database and metadata…');
    await Promise.all([
      copyFile(databasePath, join(temporaryDirectory, 'database.db')),
      copyFile(metadataPath, join(temporaryDirectory, 'metadata.xml')),
    ]);
    hashes[basename(databasePath)] = await hashFile(databasePath);
    hashes[basename(metadataPath)] = await hashFile(metadataPath);
    const database = openFifaDatabase({
      database: await readFile(databasePath),
      metadataXml: await readFile(metadataPath, 'utf8'),
    });
    rowCount = database
      .listTables()
      .filter((table) => tableNames.includes(table.name.toLocaleLowerCase('en')))
      .reduce((total, table) => total + table.validRecordCount, 0);
  }

  return {
    id,
    name,
    fifaVersion,
    source: sourceProvenance(source.inspection.sourceKind, source.inspection.originalPaths, hashes),
    status: 'available',
    tableNames,
    tableCount: tableNames.length,
    rowCount,
    warnings: source.inspection.warnings,
    snapshotDirectory: temporaryDirectory,
  };
};
