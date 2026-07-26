import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import type {
  ConversionRecord,
  DatasetDescriptor,
  DatasetStatus,
  SourceProvenance,
} from '../shared/contracts';

export interface DatasetRecord extends DatasetDescriptor {
  snapshotDirectory: string;
}

interface RegistryFile {
  schemaVersion: 1;
  datasets: DatasetRecord[];
  conversions: ConversionRecord[];
}

const EMPTY_REGISTRY: RegistryFile = { schemaVersion: 1, datasets: [], conversions: [] };
const uuidPattern = /^[0-9a-f-]{36}$/i;

export class DatasetLibrary {
  readonly datasetDirectory: string;
  private readonly registryPath: string;
  private registry: RegistryFile;

  constructor(readonly userDataPath: string) {
    this.datasetDirectory = join(userDataPath, 'datasets');
    this.registryPath = join(userDataPath, 'registry.json');
    mkdirSync(this.datasetDirectory, { recursive: true });
    this.cleanupTemporaryDirectories();
    this.registry = this.readRegistry();
  }

  listDatasets(): DatasetDescriptor[] {
    return this.registry.datasets
      .map((record) => this.describe(record))
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  dataset(id: string): DatasetRecord {
    if (!uuidPattern.test(id)) throw new Error('Invalid dataset identifier.');
    const record = this.registry.datasets.find((candidate) => candidate.id === id);
    if (!record) throw new Error('Dataset was not found.');
    return record;
  }

  temporaryDirectory(id: string): string {
    if (!uuidPattern.test(id)) throw new Error('Invalid dataset identifier.');
    return join(this.datasetDirectory, `${id}.importing`);
  }

  finalDirectory(id: string): string {
    if (!uuidPattern.test(id)) throw new Error('Invalid dataset identifier.');
    return join(this.datasetDirectory, id);
  }

  ensureUniqueName(name: string, exceptId?: string): string {
    const trimmed = name.trim();
    if (trimmed.length < 1 || trimmed.length > 80)
      throw new Error('Dataset name must contain between 1 and 80 characters.');
    const normalized = trimmed.toLocaleLowerCase('en');
    if (
      this.registry.datasets.some(
        (dataset) => dataset.id !== exceptId && dataset.name.toLocaleLowerCase('en') === normalized,
      )
    )
      throw new Error('A dataset with this name already exists.');
    return trimmed;
  }

  install(record: DatasetRecord): DatasetDescriptor {
    this.ensureUniqueName(record.name);
    const temporary = this.temporaryDirectory(record.id);
    const destination = this.finalDirectory(record.id);
    if (!existsSync(temporary)) throw new Error('Imported snapshot is missing.');
    renameSync(temporary, destination);
    const installed = { ...record, snapshotDirectory: destination };
    this.registry.datasets.push(installed);
    this.persist();
    return this.describe(installed);
  }

  rename(id: string, name: string): DatasetDescriptor {
    const record = this.dataset(id);
    record.name = this.ensureUniqueName(name, id);
    this.persist();
    return this.describe(record);
  }

  remove(id: string): boolean {
    const index = this.registry.datasets.findIndex((dataset) => dataset.id === id);
    if (index < 0) return false;
    const [record] = this.registry.datasets.splice(index, 1);
    this.persist();
    if (record) rmSync(record.snapshotDirectory, { recursive: true, force: true });
    return true;
  }

  listConversions(): ConversionRecord[] {
    return [...this.registry.conversions].sort((left, right) =>
      right.completedAt.localeCompare(left.completedAt),
    );
  }

  addConversion(record: ConversionRecord): void {
    this.registry.conversions.push(record);
    this.persist();
  }

  removeConversion(id: string): boolean {
    const before = this.registry.conversions.length;
    this.registry.conversions = this.registry.conversions.filter((record) => record.id !== id);
    if (before === this.registry.conversions.length) return false;
    this.persist();
    return true;
  }

  discardTemporary(id: string): void {
    rmSync(this.temporaryDirectory(id), { recursive: true, force: true });
  }

  private describe(record: DatasetRecord): DatasetDescriptor {
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
      error: status === 'corrupt' ? 'The managed source snapshot is missing.' : undefined,
    };
  }

  private readRegistry(): RegistryFile {
    if (!existsSync(this.registryPath)) return structuredClone(EMPTY_REGISTRY);
    try {
      const parsed = JSON.parse(readFileSync(this.registryPath, 'utf8')) as Partial<RegistryFile>;
      if (parsed.schemaVersion !== 1 || !Array.isArray(parsed.datasets))
        throw new Error('Unsupported registry format.');
      return {
        schemaVersion: 1,
        datasets: parsed.datasets,
        conversions: Array.isArray(parsed.conversions) ? parsed.conversions : [],
      };
    } catch {
      const backup = `${this.registryPath}.corrupt-${Date.now()}`;
      renameSync(this.registryPath, backup);
      return structuredClone(EMPTY_REGISTRY);
    }
  }

  private persist(): void {
    mkdirSync(this.userDataPath, { recursive: true });
    const temporary = `${this.registryPath}.tmp`;
    writeFileSync(temporary, `${JSON.stringify(this.registry, undefined, 2)}\n`, 'utf8');
    renameSync(temporary, this.registryPath);
  }

  private cleanupTemporaryDirectories(): void {
    for (const entry of readdirSync(this.datasetDirectory, { withFileTypes: true }))
      if (entry.isDirectory() && entry.name.endsWith('.importing'))
        rmSync(join(this.datasetDirectory, entry.name), { recursive: true, force: true });
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
