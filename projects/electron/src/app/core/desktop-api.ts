import { Service } from '@angular/core';

import type {
  CreateConvertedDatasetRequest,
  DatasetImportRequest,
  DatasetImportValidationRequest,
  DatasetKind,
  DatasetValidationRequest,
  ExportDatasetRequest,
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

  listImportedDatasets() {
    return this.api.listImportedDatasets();
  }
  validateDataset(request: DatasetValidationRequest) {
    return this.api.validateDataset(request);
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
  renameImportedDataset(id: string, name: string) {
    return this.api.renameImportedDataset(id, name);
  }
  removeImportedDataset(id: string) {
    return this.api.removeImportedDataset(id);
  }
  removeImportedDatasets(ids: string[]) {
    return this.api.removeImportedDatasets(ids);
  }
  removeAllDatasets(kinds: DatasetKind[]) {
    return this.api.removeAllDatasets(kinds);
  }
  listConvertedDatasets() {
    return this.api.listConvertedDatasets();
  }
  createConvertedDataset(request: CreateConvertedDatasetRequest) {
    return this.api.createConvertedDataset(request);
  }
  cancelConversion(requestId: string) {
    return this.api.cancelConversion(requestId);
  }
  renameConvertedDataset(id: string, name: string) {
    return this.api.renameConvertedDataset(id, name);
  }
  removeConvertedDataset(id: string) {
    return this.api.removeConvertedDataset(id);
  }
  removeConvertedDatasets(ids: string[]) {
    return this.api.removeConvertedDatasets(ids);
  }
  selectExportDirectory() {
    return this.api.selectExportDirectory();
  }
  exportDataset(request: ExportDatasetRequest) {
    return this.api.exportDataset(request);
  }
  revealExport(path: string) {
    return this.api.revealExport(path);
  }
  onImportProgress(listener: (message: string) => void) {
    return window.qdbConverter?.onImportProgress(listener) ?? (() => undefined);
  }
  onConversionProgress(listener: Parameters<QdbConverterApi['onConversionProgress']>[0]) {
    return window.qdbConverter?.onConversionProgress(listener) ?? (() => undefined);
  }
}
