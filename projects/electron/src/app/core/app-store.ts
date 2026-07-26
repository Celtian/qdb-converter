import { computed, inject, Service, signal } from '@angular/core';
import type {
  ConversionRecord,
  ConversionRequest,
  DatasetDescriptor,
  DatasetImportRequest,
} from '../../../shared/contracts';
import { DesktopApi } from './desktop-api';

@Service()
export class AppStore {
  private readonly desktop = inject(DesktopApi);
  private readonly datasetState = signal<DatasetDescriptor[]>([]);
  private readonly conversionState = signal<ConversionRecord[]>([]);

  readonly datasets = this.datasetState.asReadonly();
  readonly conversions = this.conversionState.asReadonly();
  readonly availableDatasets = computed(() =>
    this.datasetState().filter((dataset) => dataset.status === 'available'),
  );
  readonly loading = signal(false);
  readonly error = signal('');
  readonly importProgress = signal('');
  readonly conversionProgress = signal('');

  constructor() {
    this.desktop.onImportProgress((message) => this.importProgress.set(message));
    this.desktop.onConversionProgress((progress) => this.conversionProgress.set(progress.message));
  }

  async refresh(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      const [datasets, conversions] = await Promise.all([
        this.desktop.listDatasets(),
        this.desktop.listConversions(),
      ]);
      this.datasetState.set(datasets);
      this.conversionState.set(conversions);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : String(error));
    } finally {
      this.loading.set(false);
    }
  }

  async importDatasets(requests: DatasetImportRequest[]) {
    this.loading.set(true);
    this.error.set('');
    try {
      const results = await this.desktop.importDatasets(requests);
      await this.refresh();
      return results;
    } finally {
      this.loading.set(false);
      this.importProgress.set('');
    }
  }

  async renameDataset(id: string, name: string): Promise<void> {
    await this.desktop.renameDataset(id, name);
    await this.refresh();
  }

  async removeDataset(id: string): Promise<void> {
    await this.desktop.removeDataset(id);
    await this.refresh();
  }

  async runConversion(request: ConversionRequest) {
    this.loading.set(true);
    this.error.set('');
    try {
      const result = await this.desktop.runConversion(request);
      await this.refresh();
      return result;
    } finally {
      this.loading.set(false);
      this.conversionProgress.set('');
    }
  }

  async removeConversion(id: string): Promise<void> {
    await this.desktop.removeConversion(id);
    await this.refresh();
  }
}
