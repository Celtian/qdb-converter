import { existsSync, readFileSync, renameSync } from 'node:fs';
import { isAbsolute } from 'node:path';

import type { ConvertedDatasetDescriptor, ImportedDatasetDescriptor } from '../shared/contracts';

export interface ImportedDatasetRecord extends ImportedDatasetDescriptor {
  snapshotDirectory: string;
}

export interface ConvertedDatasetRecord extends ConvertedDatasetDescriptor {
  snapshotDirectory: string;
}

export interface RegistryPreferences {
  lastImportDirectory?: string;
}

export interface RegistryFile {
  schemaVersion: 4;
  importedDatasets: ImportedDatasetRecord[];
  convertedDatasets: ConvertedDatasetRecord[];
  preferences: RegistryPreferences;
}

type Version3ImportedDatasetRecord = Omit<
  ImportedDatasetRecord,
  'managedFormat' | 'updatedAt' | 'playernameSummary'
>;
type Version3ConvertedDatasetRecord = Omit<ConvertedDatasetRecord, 'updatedAt'>;

interface Version3RegistryFile {
  schemaVersion: 3;
  importedDatasets: Version3ImportedDatasetRecord[];
  convertedDatasets: Version3ConvertedDatasetRecord[];
  preferences?: RegistryPreferences;
}

type Version2ConvertedDatasetRecord = Omit<
  Version3ConvertedDatasetRecord,
  'resultKind' | 'sourceDatasetKind' | 'playernameSummary'
>;

interface Version2RegistryFile {
  schemaVersion: 2;
  importedDatasets: Version3ImportedDatasetRecord[];
  convertedDatasets: Version2ConvertedDatasetRecord[];
  preferences?: RegistryPreferences;
}

interface LegacyRegistryFile {
  schemaVersion: 1;
  datasets: Version3ImportedDatasetRecord[];
  preferences?: RegistryPreferences;
}

export interface RegistryReadResult {
  registry: RegistryFile;
  migrated: boolean;
  cleanupOrphans: boolean;
}

export const emptyRegistry = (): RegistryFile => ({
  schemaVersion: 4,
  importedDatasets: [],
  convertedDatasets: [],
  preferences: {},
});

const validPreferences = (preferences: RegistryPreferences | undefined): RegistryPreferences =>
  typeof preferences?.lastImportDirectory === 'string' &&
  isAbsolute(preferences.lastImportDirectory)
    ? { lastImportDirectory: preferences.lastImportDirectory }
    : {};

const migrateImported = (record: Version3ImportedDatasetRecord): ImportedDatasetRecord => ({
  ...record,
  managedFormat: record.source.kind,
  updatedAt: record.source.importedAt,
});

export const readDatasetRegistry = (registryPath: string): RegistryReadResult => {
  if (!existsSync(registryPath))
    return { registry: emptyRegistry(), migrated: false, cleanupOrphans: false };
  try {
    const parsed = JSON.parse(readFileSync(registryPath, 'utf8')) as
      | Partial<RegistryFile>
      | Partial<Version3RegistryFile>
      | Partial<Version2RegistryFile>
      | Partial<LegacyRegistryFile>;
    if (parsed.schemaVersion === 4 && 'importedDatasets' in parsed) {
      if (!Array.isArray(parsed.importedDatasets) || !Array.isArray(parsed.convertedDatasets))
        throw new Error('Unsupported registry format.');
      return {
        registry: {
          schemaVersion: 4,
          importedDatasets: parsed.importedDatasets,
          convertedDatasets: parsed.convertedDatasets,
          preferences: validPreferences(parsed.preferences),
        },
        migrated: false,
        cleanupOrphans: true,
      };
    }
    if (parsed.schemaVersion === 3 && 'importedDatasets' in parsed) {
      if (!Array.isArray(parsed.importedDatasets) || !Array.isArray(parsed.convertedDatasets))
        throw new Error('Unsupported registry format.');
      return {
        registry: {
          schemaVersion: 4,
          importedDatasets: parsed.importedDatasets.map(migrateImported),
          convertedDatasets: parsed.convertedDatasets.map((record) => ({
            ...record,
            updatedAt: record.createdAt,
          })),
          preferences: validPreferences(parsed.preferences),
        },
        migrated: true,
        cleanupOrphans: true,
      };
    }
    if (parsed.schemaVersion === 2 && 'importedDatasets' in parsed) {
      if (!Array.isArray(parsed.importedDatasets) || !Array.isArray(parsed.convertedDatasets))
        throw new Error('Unsupported registry format.');
      return {
        registry: {
          schemaVersion: 4,
          importedDatasets: parsed.importedDatasets.map(migrateImported),
          convertedDatasets: parsed.convertedDatasets.map((record) => ({
            ...record,
            resultKind: 'conversion',
            sourceDatasetKind: 'imported',
            updatedAt: record.createdAt,
          })),
          preferences: validPreferences(parsed.preferences),
        },
        migrated: true,
        cleanupOrphans: true,
      };
    }
    if (parsed.schemaVersion === 1 && 'datasets' in parsed && Array.isArray(parsed.datasets)) {
      return {
        registry: {
          schemaVersion: 4,
          importedDatasets: parsed.datasets.map(migrateImported),
          convertedDatasets: [],
          preferences: validPreferences(parsed.preferences),
        },
        migrated: true,
        cleanupOrphans: true,
      };
    }
    throw new Error('Unsupported registry format.');
  } catch {
    renameSync(registryPath, `${registryPath}.corrupt-${Date.now()}`);
    return { registry: emptyRegistry(), migrated: false, cleanupOrphans: false };
  }
};
