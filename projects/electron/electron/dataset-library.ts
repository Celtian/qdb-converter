import {
  existsSync,
  mkdirSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';

import type {
  ConvertedDatasetDescriptor,
  DatasetCleanupResult,
  DatasetKind,
  DatasetStatus,
  ImportedDatasetDescriptor,
  SourceProvenance,
} from '../shared/contracts';
import {
  type ConvertedDatasetRecord,
  type ImportedDatasetRecord,
  type RegistryFile,
  readDatasetRegistry,
} from './dataset-registry';

export type { ConvertedDatasetRecord, ImportedDatasetRecord } from './dataset-registry';
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
    const result = readDatasetRegistry(this.registryPath);
    this.registry = result.registry;
    if (result.migrated) this.persist();
    this.cleanupManagedDirectories(result.cleanupOrphans);
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

  replacementTemporaryDirectory(kind: DatasetKind, id: string, replacementId: string): string {
    this.validateId(id);
    this.validateId(replacementId);
    const directory =
      kind === 'imported' ? this.importedDatasetDirectory : this.convertedDatasetDirectory;
    return join(directory, `${id}.${replacementId}.replacing`);
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
    try {
      this.persist();
    } catch (error) {
      this.registry.convertedDatasets.pop();
      renameSync(destination, temporary);
      throw error;
    }
    return this.describeConverted(installed);
  }

  replaceImported(record: ImportedDatasetRecord, replacementId: string): ImportedDatasetDescriptor {
    const current = this.importedDataset(record.id);
    const installed = this.replaceSnapshot(
      'imported',
      current,
      record,
      replacementId,
      this.registry.importedDatasets,
    );
    return this.describeImported(installed);
  }

  replaceConverted(
    record: ConvertedDatasetRecord,
    replacementId: string,
  ): ConvertedDatasetDescriptor {
    const current = this.convertedDataset(record.id);
    const installed = this.replaceSnapshot(
      'converted',
      current,
      record,
      replacementId,
      this.registry.convertedDatasets,
    );
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
      managedFormat: record.managedFormat,
      updatedAt: record.updatedAt,
      tableNames: record.tableNames,
      tableCount: record.tableCount,
      rowCount: record.rowCount,
      warnings: record.warnings,
      playernameSummary: record.playernameSummary,
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
      resultKind: record.resultKind,
      sourceDatasetKind: record.sourceDatasetKind,
      sourceVersion: record.sourceVersion,
      fifaVersion: record.fifaVersion,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      tableNames: record.tableNames,
      tableCount: record.tableCount,
      rowCount: record.rowCount,
      tableSummaries: record.tableSummaries,
      playernameSummary: record.playernameSummary,
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

  private persist(): void {
    mkdirSync(this.userDataPath, { recursive: true });
    const temporary = `${this.registryPath}.tmp`;
    writeFileSync(temporary, `${JSON.stringify(this.registry, undefined, 2)}\n`, 'utf8');
    renameSync(temporary, this.registryPath);
  }

  private replaceSnapshot<T extends ImportedDatasetRecord | ConvertedDatasetRecord>(
    kind: DatasetKind,
    current: T,
    replacement: T,
    replacementId: string,
    records: T[],
  ): T {
    const temporary = this.replacementTemporaryDirectory(kind, current.id, replacementId);
    if (!existsSync(temporary)) throw new Error('Replacement snapshot is missing.');
    const destination = temporary.replace(/\.replacing$/, '');
    renameSync(temporary, destination);
    const index = records.findIndex((candidate) => candidate.id === current.id);
    const installed = { ...replacement, snapshotDirectory: destination };
    records[index] = installed;
    try {
      this.persist();
    } catch (error) {
      records[index] = current;
      rmSync(destination, { recursive: true, force: true });
      throw error;
    }
    try {
      rmSync(current.snapshotDirectory, { recursive: true, force: true });
    } catch {
      // The registry already points at the replacement. Startup cleanup will retry this orphan.
    }
    return installed;
  }

  private cleanupManagedDirectories(cleanupOrphans: boolean): void {
    const referenced = new Set(
      [...this.registry.importedDatasets, ...this.registry.convertedDatasets].map((record) =>
        resolve(record.snapshotDirectory),
      ),
    );
    for (const directory of [this.importedDatasetDirectory, this.convertedDatasetDirectory])
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const path = join(directory, entry.name);
        const temporary = /\.(importing|creating|replacing)$/.test(entry.name);
        if (temporary || (cleanupOrphans && !referenced.has(resolve(path))))
          rmSync(path, { recursive: true, force: true });
      }
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
