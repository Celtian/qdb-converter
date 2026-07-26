import { randomUUID } from 'node:crypto';
import type { DatasetImportCandidate } from '../shared/contracts';
import type { InspectedSource } from './source-inspection';

export interface SelectedSource {
  selectionId: string;
  inspection: InspectedSource;
}

export class SourceSelections {
  private readonly sources = new Map<string, SelectedSource>();

  add(inspection: InspectedSource): DatasetImportCandidate {
    const selectionId = randomUUID();
    this.sources.set(selectionId, { selectionId, inspection });
    return { selectionId, ...inspection };
  }

  get(selectionId: string): SelectedSource | undefined {
    return this.sources.get(selectionId);
  }

  delete(selectionId: string): void {
    this.sources.delete(selectionId);
  }

  clear(): void {
    this.sources.clear();
  }
}
