import { Service } from '@angular/core';
import type {
  ConversionRequest,
  DatasetImportRequest,
  DatasetImportValidationRequest,
  QdbConverterApi,
  T3dbSourcePreparationRequest,
} from '../../../shared/contracts';

@Service()
export class DesktopApi {
  private get api(): QdbConverterApi {
    if (!window.qdbConverter)
      throw new Error('QDB Converter desktop services are unavailable in this browser.');
    return window.qdbConverter;
  }

  listDatasets() {
    return this.api.listDatasets();
  }
  validateDataset(id: string) {
    return this.api.validateDataset(id);
  }
  validateImportSource(request: DatasetImportValidationRequest) {
    return this.api.validateImportSource(request);
  }
  selectTextSources() {
    return this.api.selectTextSources();
  }
  selectT3dbDatabaseFile() {
    return this.api.selectT3dbDatabaseFile();
  }
  selectT3dbMetadataFile() {
    return this.api.selectT3dbMetadataFile();
  }
  prepareT3dbSource(request: T3dbSourcePreparationRequest) {
    return this.api.prepareT3dbSource(request);
  }
  importDatasets(requests: DatasetImportRequest[]) {
    return this.api.importDatasets(requests);
  }
  cancelImport() {
    return this.api.cancelImport();
  }
  renameDataset(id: string, name: string) {
    return this.api.renameDataset(id, name);
  }
  removeDataset(id: string) {
    return this.api.removeDataset(id);
  }
  removeDatasets(ids: string[]) {
    return this.api.removeDatasets(ids);
  }
  selectOutputDirectory() {
    return this.api.selectOutputDirectory();
  }
  runConversion(request: ConversionRequest) {
    return this.api.runConversion(request);
  }
  cancelConversion(requestId: string) {
    return this.api.cancelConversion(requestId);
  }
  listConversions() {
    return this.api.listConversions();
  }
  removeConversion(id: string) {
    return this.api.removeConversion(id);
  }
  revealOutput(path: string) {
    return this.api.revealOutput(path);
  }
  onImportProgress(listener: (message: string) => void) {
    return window.qdbConverter?.onImportProgress(listener) ?? (() => undefined);
  }
  onConversionProgress(listener: Parameters<QdbConverterApi['onConversionProgress']>[0]) {
    return window.qdbConverter?.onConversionProgress(listener) ?? (() => undefined);
  }
}
