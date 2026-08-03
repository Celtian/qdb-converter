import { randomUUID } from 'node:crypto';

import type { DatasetImportCandidate } from '../shared/contracts';
import type { InspectedSource } from './source-inspection';

export interface SelectedSource {
  selectionId: string;
  inspection: InspectedSource;
  validation?: {
    fifaVersion: number;
    errorCount: number;
  };
}

export type SelectedT3dbFileKind = 'database' | 'metadata';

interface SelectedT3dbFile {
  kind: SelectedT3dbFileKind;
  path: string;
}

export class SourceSelections {
  private readonly sources = new Map<string, SelectedSource>();
  private readonly t3dbFiles = new Map<string, SelectedT3dbFile>();

  constructor(private readonly createId: () => string = randomUUID) {}

  add(inspection: InspectedSource): DatasetImportCandidate {
    const selectionId = this.createId();
    this.sources.set(selectionId, { selectionId, inspection });
    return { selectionId, ...inspection };
  }

  addT3dbFile(kind: SelectedT3dbFileKind, path: string): string {
    const id = this.createId();
    this.t3dbFiles.set(id, { kind, path });
    return id;
  }

  resolveT3dbPair(
    databaseFileId: string,
    metadataFileId: string,
  ): { databasePath: string; metadataPath: string } | undefined {
    const database = this.t3dbFiles.get(databaseFileId);
    const metadata = this.t3dbFiles.get(metadataFileId);
    if (database?.kind !== 'database' || metadata?.kind !== 'metadata') return undefined;
    return { databasePath: database.path, metadataPath: metadata.path };
  }

  addT3dbSource(
    inspection: InspectedSource,
    databaseFileId: string,
    metadataFileId: string,
  ): DatasetImportCandidate {
    const candidate = this.add(inspection);
    this.t3dbFiles.delete(databaseFileId);
    this.t3dbFiles.delete(metadataFileId);
    return candidate;
  }

  get(selectionId: string): SelectedSource | undefined {
    return this.sources.get(selectionId);
  }

  recordValidation(selectionId: string, fifaVersion: number, errorCount: number): void {
    const source = this.sources.get(selectionId);
    if (!source) throw new Error('Select this source again before validating.');
    source.validation = { fifaVersion, errorCount };
  }

  canImport(selectionId: string, fifaVersion: number): boolean {
    const validation = this.sources.get(selectionId)?.validation;
    return validation?.fifaVersion === fifaVersion && validation.errorCount === 0;
  }

  delete(selectionId: string): void {
    this.sources.delete(selectionId);
  }

  clear(): void {
    this.sources.clear();
    this.t3dbFiles.clear();
  }
}
