import { computed, inject, Service, signal } from '@angular/core';
import type {
  ConvertedDatasetDescriptor,
  CreateConvertedDatasetRequest,
  DatasetImportRequest,
  DatasetKind,
  ExportDatasetRequest,
  ImportedDatasetDescriptor,
} from '../../../shared/contracts';
import { DesktopApi } from './desktop-api';

@Service()
export class AppStore {
  private readonly desktop = inject(DesktopApi);
  private readonly importedDatasetState = signal<ImportedDatasetDescriptor[]>([]);
  private readonly convertedDatasetState = signal<ConvertedDatasetDescriptor[]>([]);

  readonly importedDatasets = this.importedDatasetState.asReadonly();
  readonly convertedDatasets = this.convertedDatasetState.asReadonly();
  readonly availableImportedDatasets = computed(() =>
    this.importedDatasetState().filter((dataset) => dataset.status === 'available'),
  );
  readonly availableConvertedDatasets = computed(() =>
    this.convertedDatasetState().filter((dataset) => dataset.status === 'available'),
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
      const [importedDatasets, convertedDatasets] = await Promise.all([
        this.desktop.listImportedDatasets(),
        this.desktop.listConvertedDatasets(),
      ]);
      this.importedDatasetState.set(importedDatasets);
      this.convertedDatasetState.set(convertedDatasets);
    } catch (error) {
      this.error.set(this.errorMessage(error));
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

  async renameImportedDataset(id: string, name: string): Promise<void> {
    await this.desktop.renameImportedDataset(id, name);
    await this.refresh();
  }

  async removeImportedDataset(id: string): Promise<boolean> {
    return this.removeImportedDatasets([id]);
  }

  async removeImportedDatasets(ids: string[]): Promise<boolean> {
    return this.runDeletion(async () => this.desktop.removeImportedDatasets(ids));
  }

  async removeAllDatasets(kinds: DatasetKind[]): Promise<boolean> {
    return this.runDeletion(async () => this.desktop.removeAllDatasets(kinds));
  }

  async createConvertedDataset(request: CreateConvertedDatasetRequest) {
    this.loading.set(true);
    this.error.set('');
    try {
      const result = await this.desktop.createConvertedDataset(request);
      if (result.error) this.error.set(result.error.message);
      if (result.status === 'completed') await this.refresh();
      return result;
    } catch (error) {
      this.error.set(this.errorMessage(error));
      throw error;
    } finally {
      this.loading.set(false);
      this.conversionProgress.set('');
    }
  }

  async renameConvertedDataset(id: string, name: string): Promise<void> {
    await this.desktop.renameConvertedDataset(id, name);
    await this.refresh();
  }

  async removeConvertedDataset(id: string): Promise<boolean> {
    return this.removeConvertedDatasets([id]);
  }

  async removeConvertedDatasets(ids: string[]): Promise<boolean> {
    return this.runDeletion(async () => this.desktop.removeConvertedDatasets(ids));
  }

  selectExportDirectory() {
    return this.desktop.selectExportDirectory();
  }

  async exportDataset(request: ExportDatasetRequest) {
    this.loading.set(true);
    this.error.set('');
    try {
      return await this.desktop.exportDataset(request);
    } catch (error) {
      this.error.set(this.errorMessage(error));
      throw error;
    } finally {
      this.loading.set(false);
    }
  }

  revealExport(path: string): void {
    void this.desktop.revealExport(path);
  }

  cancelConversion(requestId: string): void {
    void this.desktop.cancelConversion(requestId);
  }

  private async runDeletion(operation: () => Promise<unknown>): Promise<boolean> {
    this.loading.set(true);
    this.error.set('');
    try {
      await operation();
      await this.refresh();
      return true;
    } catch (error) {
      this.error.set(this.errorMessage(error));
      return false;
    } finally {
      this.loading.set(false);
    }
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
