import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { isAbsolute, join } from 'node:path';

import type {
  ConvertedDatasetDescriptor,
  DatasetCleanupResult,
  DatasetKind,
  DatasetStatus,
  ImportedDatasetDescriptor,
  SourceProvenance,
} from '../shared/contracts';

export interface ImportedDatasetRecord extends ImportedDatasetDescriptor {
  snapshotDirectory: string;
}

export interface ConvertedDatasetRecord extends ConvertedDatasetDescriptor {
  snapshotDirectory: string;
}

interface RegistryPreferences {
  lastImportDirectory?: string;
}

interface RegistryFile {
  schemaVersion: 2;
  importedDatasets: ImportedDatasetRecord[];
  convertedDatasets: ConvertedDatasetRecord[];
  preferences: RegistryPreferences;
}

interface LegacyRegistryFile {
  schemaVersion: 1;
  datasets: ImportedDatasetRecord[];
  preferences?: RegistryPreferences;
}

interface RegistryReadResult {
  registry: RegistryFile;
  migrated: boolean;
}

const EMPTY_REGISTRY: RegistryFile = {
  schemaVersion: 2,
  importedDatasets: [],
  convertedDatasets: [],
  preferences: {},
};
const uuidPattern = /^[0-9a-f-]{36}$/i;

export class DatasetLibrary {
  readonly importedDatasetDirectory: string;
  readonly convertedDatasetDirectory: string;
  private readonly registryPath: string;
  private registry: RegistryFile;

  constructor(readonly userDataPath: string) {
    this.importedDatasetDirectory = join(userDataPath, 'datasets');
    this.convertedDatasetDirectory = join(userDataPath, 'converted-datasets');
    this.registryPath = join(userDataPath, 'registry.json');
    mkdirSync(this.importedDatasetDirectory, { recursive: true });
    mkdirSync(this.convertedDatasetDirectory, { recursive: true });
    this.cleanupTemporaryDirectories();
    const result = this.readRegistry();
    this.registry = result.registry;
    if (result.migrated) this.persist();
  }

  listImportedDatasets(): ImportedDatasetDescriptor[] {
    return this.registry.importedDatasets
      .map((record) => this.describeImported(record))
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  listConvertedDatasets(): ConvertedDatasetDescriptor[] {
    return this.registry.convertedDatasets
      .map((record) => this.describeConverted(record))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  lastImportDirectory(): string | undefined {
    const directory = this.registry.preferences.lastImportDirectory;
    if (!directory) return undefined;
    try {
      return statSync(directory).isDirectory() ? directory : undefined;
    } catch {
      return undefined;
    }
  }

  rememberImportDirectory(directory: string): void {
    if (!isAbsolute(directory)) throw new Error('Import directory must be an absolute path.');
    if (this.registry.preferences.lastImportDirectory === directory) return;
    this.registry.preferences.lastImportDirectory = directory;
    this.persist();
  }

  importedDataset(id: string): ImportedDatasetRecord {
    this.validateId(id);
    const record = this.registry.importedDatasets.find((candidate) => candidate.id === id);
    if (!record) throw new Error('Imported dataset was not found.');
    return record;
  }

  convertedDataset(id: string): ConvertedDatasetRecord {
    this.validateId(id);
    const record = this.registry.convertedDatasets.find((candidate) => candidate.id === id);
    if (!record) throw new Error('Converted dataset was not found.');
    return record;
  }

  importedTemporaryDirectory(id: string): string {
    this.validateId(id);
    return join(this.importedDatasetDirectory, `${id}.importing`);
  }

  importedFinalDirectory(id: string): string {
    this.validateId(id);
    return join(this.importedDatasetDirectory, id);
  }

  convertedTemporaryDirectory(id: string): string {
    this.validateId(id);
    return join(this.convertedDatasetDirectory, `${id}.creating`);
  }

  convertedFinalDirectory(id: string): string {
    this.validateId(id);
    return join(this.convertedDatasetDirectory, id);
  }

  ensureUniqueImportedName(name: string, exceptId?: string): string {
    return this.ensureUniqueName(name, this.registry.importedDatasets, exceptId);
  }

  ensureUniqueConvertedName(name: string, exceptId?: string): string {
    return this.ensureUniqueName(name, this.registry.convertedDatasets, exceptId);
  }

  installImported(record: ImportedDatasetRecord): ImportedDatasetDescriptor {
    this.ensureUniqueImportedName(record.name);
    const temporary = this.importedTemporaryDirectory(record.id);
    const destination = this.importedFinalDirectory(record.id);
    if (!existsSync(temporary)) throw new Error('Imported snapshot is missing.');
    renameSync(temporary, destination);
    const installed = { ...record, snapshotDirectory: destination };
    this.registry.importedDatasets.push(installed);
    this.persist();
    return this.describeImported(installed);
  }

  installConverted(record: ConvertedDatasetRecord): ConvertedDatasetDescriptor {
    this.ensureUniqueConvertedName(record.name);
    const temporary = this.convertedTemporaryDirectory(record.id);
    const destination = this.convertedFinalDirectory(record.id);
    if (!existsSync(temporary)) throw new Error('Converted snapshot is missing.');
    renameSync(temporary, destination);
    const installed = { ...record, snapshotDirectory: destination };
    this.registry.convertedDatasets.push(installed);
    this.persist();
    return this.describeConverted(installed);
  }

  renameImported(id: string, name: string): ImportedDatasetDescriptor {
    const record = this.importedDataset(id);
    record.name = this.ensureUniqueImportedName(name, id);
    this.persist();
    return this.describeImported(record);
  }

  renameConverted(id: string, name: string): ConvertedDatasetDescriptor {
    const record = this.convertedDataset(id);
    record.name = this.ensureUniqueConvertedName(name, id);
    this.persist();
    return this.describeConverted(record);
  }

  removeImported(id: string): boolean {
    return this.removeImportedMany([id]) === 1;
  }

  removeImportedMany(ids: readonly string[]): number {
    const selectedIds = new Set(ids);
    const removed = this.registry.importedDatasets.filter((dataset) => selectedIds.has(dataset.id));
    if (!removed.length) return 0;
    this.registry.importedDatasets = this.registry.importedDatasets.filter(
      (dataset) => !selectedIds.has(dataset.id),
    );
    this.persist();
    for (const record of removed)
      rmSync(record.snapshotDirectory, { recursive: true, force: true });
    return removed.length;
  }

  removeConverted(id: string): boolean {
    return this.removeConvertedMany([id]) === 1;
  }

  removeConvertedMany(ids: readonly string[]): number {
    const selectedIds = new Set(ids);
    const removed = this.registry.convertedDatasets.filter((dataset) =>
      selectedIds.has(dataset.id),
    );
    if (!removed.length) return 0;
    this.registry.convertedDatasets = this.registry.convertedDatasets.filter(
      (dataset) => !selectedIds.has(dataset.id),
    );
    this.persist();
    for (const record of removed)
      rmSync(record.snapshotDirectory, { recursive: true, force: true });
    return removed.length;
  }

  removeAll(kinds: readonly DatasetKind[]): DatasetCleanupResult {
    const selectedKinds = new Set(kinds);
    const imported = selectedKinds.has('imported') ? this.registry.importedDatasets : [];
    const converted = selectedKinds.has('converted') ? this.registry.convertedDatasets : [];
    const result = { imported: imported.length, converted: converted.length };
    if (!result.imported && !result.converted) return result;

    if (selectedKinds.has('imported')) this.registry.importedDatasets = [];
    if (selectedKinds.has('converted')) this.registry.convertedDatasets = [];
    this.persist();

    for (const record of [...imported, ...converted])
      rmSync(record.snapshotDirectory, { recursive: true, force: true });
    return result;
  }

  discardImportedTemporary(id: string): void {
    rmSync(this.importedTemporaryDirectory(id), { recursive: true, force: true });
  }

  discardConvertedTemporary(id: string): void {
    rmSync(this.convertedTemporaryDirectory(id), { recursive: true, force: true });
  }

  private describeImported(record: ImportedDatasetRecord): ImportedDatasetDescriptor {
    const status: DatasetStatus = existsSync(record.snapshotDirectory) ? 'available' : 'corrupt';
    return {
      id: record.id,
      name: record.name,
      fifaVersion: record.fifaVersion,
      source: record.source,
      tableNames: record.tableNames,
      tableCount: record.tableCount,
      rowCount: record.rowCount,
      warnings: record.warnings,
      status,
      error: status === 'corrupt' ? 'The managed imported snapshot is missing.' : undefined,
    };
  }

  private describeConverted(record: ConvertedDatasetRecord): ConvertedDatasetDescriptor {
    const status: DatasetStatus = existsSync(record.snapshotDirectory) ? 'available' : 'corrupt';
    return {
      id: record.id,
      name: record.name,
      sourceDatasetId: record.sourceDatasetId,
      sourceDatasetName: record.sourceDatasetName,
      sourceVersion: record.sourceVersion,
      fifaVersion: record.fifaVersion,
      createdAt: record.createdAt,
      tableNames: record.tableNames,
      tableCount: record.tableCount,
      rowCount: record.rowCount,
      tableSummaries: record.tableSummaries,
      warnings: record.warnings,
      status,
      error: status === 'corrupt' ? 'The managed converted snapshot is missing.' : undefined,
    };
  }

  private ensureUniqueName(
    name: string,
    datasets: readonly { id: string; name: string }[],
    exceptId?: string,
  ): string {
    const trimmed = name.trim();
    if (trimmed.length < 1 || trimmed.length > 80)
      throw new Error('Dataset name must contain between 1 and 80 characters.');
    const normalized = trimmed.toLocaleLowerCase('en');
    if (
      datasets.some(
        (dataset) => dataset.id !== exceptId && dataset.name.toLocaleLowerCase('en') === normalized,
      )
    )
      throw new Error('A dataset with this name already exists.');
    return trimmed;
  }

  private readRegistry(): RegistryReadResult {
    if (!existsSync(this.registryPath))
      return { registry: structuredClone(EMPTY_REGISTRY), migrated: false };
    try {
      const parsed = JSON.parse(readFileSync(this.registryPath, 'utf8')) as
        Partial<RegistryFile> | Partial<LegacyRegistryFile>;
      if (parsed.schemaVersion === 2 && 'importedDatasets' in parsed) {
        if (!Array.isArray(parsed.importedDatasets) || !Array.isArray(parsed.convertedDatasets))
          throw new Error('Unsupported registry format.');
        return {
          registry: {
            schemaVersion: 2,
            importedDatasets: parsed.importedDatasets,
            convertedDatasets: parsed.convertedDatasets,
            preferences: this.validPreferences(parsed.preferences),
          },
          migrated: false,
        };
      }
      if (parsed.schemaVersion === 1 && 'datasets' in parsed && Array.isArray(parsed.datasets)) {
        return {
          registry: {
            schemaVersion: 2,
            importedDatasets: parsed.datasets,
            convertedDatasets: [],
            preferences: this.validPreferences(parsed.preferences),
          },
          migrated: true,
        };
      }
      throw new Error('Unsupported registry format.');
    } catch {
      const backup = `${this.registryPath}.corrupt-${Date.now()}`;
      renameSync(this.registryPath, backup);
      return { registry: structuredClone(EMPTY_REGISTRY), migrated: false };
    }
  }

  private validPreferences(preferences: RegistryPreferences | undefined): RegistryPreferences {
    return typeof preferences?.lastImportDirectory === 'string' &&
      isAbsolute(preferences.lastImportDirectory)
      ? { lastImportDirectory: preferences.lastImportDirectory }
      : {};
  }

  private persist(): void {
    mkdirSync(this.userDataPath, { recursive: true });
    const temporary = `${this.registryPath}.tmp`;
    writeFileSync(temporary, `${JSON.stringify(this.registry, undefined, 2)}\n`, 'utf8');
    renameSync(temporary, this.registryPath);
  }

  private cleanupTemporaryDirectories(): void {
    for (const entry of readdirSync(this.importedDatasetDirectory, { withFileTypes: true }))
      if (entry.isDirectory() && entry.name.endsWith('.importing'))
        rmSync(join(this.importedDatasetDirectory, entry.name), { recursive: true, force: true });
    for (const entry of readdirSync(this.convertedDatasetDirectory, { withFileTypes: true }))
      if (entry.isDirectory() && entry.name.endsWith('.creating'))
        rmSync(join(this.convertedDatasetDirectory, entry.name), {
          recursive: true,
          force: true,
        });
  }

  private validateId(id: string): void {
    if (!uuidPattern.test(id)) throw new Error('Invalid dataset identifier.');
  }
}

export const sourceProvenance = (
  kind: SourceProvenance['kind'],
  originalPaths: string[],
  hashes: Record<string, string>,
): SourceProvenance => ({
  kind,
  originalPaths,
  hashes,
  importedAt: new Date().toISOString(),
});
