import { randomUUID } from 'node:crypto';
import { cp, mkdir, readdir, rename, rm } from 'node:fs/promises';
import { basename, join } from 'node:path';

import type { ConvertedDatasetRecord, ImportedDatasetRecord } from './dataset-library';

const sanitizeName = (name: string): string =>
  name
    .normalize('NFKD')
    .replace(/[^\w.-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'dataset';

const timestamp = (date: Date): string =>
  date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z');

const uniqueOutputPath = async (
  parent: string,
  datasetName: string,
  fifaVersion: number,
): Promise<string> => {
  const base = `${sanitizeName(datasetName)}-fifa${fifaVersion}-${timestamp(new Date())}`;
  const existing = new Set(await readdir(parent));
  if (!existing.has(base)) return join(parent, base);
  let suffix = 2;
  while (existing.has(`${base}-${suffix}`)) suffix += 1;
  return join(parent, `${base}-${suffix}`);
};

export const exportDatasetSnapshot = async (
  dataset: ImportedDatasetRecord | ConvertedDatasetRecord,
  targetParentPath: string,
): Promise<string> => {
  await mkdir(targetParentPath, { recursive: true });
  const outputPath = await uniqueOutputPath(targetParentPath, dataset.name, dataset.fifaVersion);
  const temporaryPath = join(
    targetParentPath,
    `.${basename(outputPath)}.${randomUUID()}.exporting`,
  );
  try {
    await cp(dataset.snapshotDirectory, temporaryPath, {
      recursive: true,
      errorOnExist: true,
      force: false,
    });
    await rename(temporaryPath, outputPath);
    return outputPath;
  } catch (error) {
    await rm(temporaryPath, { recursive: true, force: true });
    throw error;
  }
};
