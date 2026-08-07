import { contextBridge, ipcRenderer } from 'electron';

import type {
  ConversionProgress,
  CreateConvertedDatasetRequest,
  DatasetIdAnalysisProgress,
  DatasetIdAnalysisRequest,
  DatasetImportRequest,
  DatasetImportValidationRequest,
  DatasetValidationRequest,
  ExportDatasetRequest,
  PlayernameAnalysisProgress,
  PlayernameAnalysisRequest,
  PlayernameProgress,
  PlayernameRunRequest,
  QdbConverterApi,
  T3dbSourcePreparationRequest,
} from '../shared/contracts';

const api: QdbConverterApi = {
  listImportedDatasets: () => ipcRenderer.invoke('qdb:imported-datasets:list'),
  validateDataset: (request: DatasetValidationRequest) =>
    ipcRenderer.invoke('qdb:datasets:validate', request),
  validateImportSource: (request: DatasetImportValidationRequest) =>
    ipcRenderer.invoke('qdb:imported-datasets:validate-source', request),
  selectTextSources: () => ipcRenderer.invoke('qdb:imported-datasets:select-text'),
  selectT3dbDatabaseFile: () => ipcRenderer.invoke('qdb:imported-datasets:select-t3db-database'),
  selectT3dbMetadataFile: () => ipcRenderer.invoke('qdb:imported-datasets:select-t3db-metadata'),
  prepareT3dbSource: (request: T3dbSourcePreparationRequest) =>
    ipcRenderer.invoke('qdb:imported-datasets:prepare-t3db', request),
  importDatasets: (requests: DatasetImportRequest[]) =>
    ipcRenderer.invoke('qdb:imported-datasets:import', requests),
  cancelImport: () => ipcRenderer.invoke('qdb:imported-datasets:cancel-import'),
  renameImportedDataset: (id, name) => ipcRenderer.invoke('qdb:imported-datasets:rename', id, name),
  removeImportedDataset: (id) => ipcRenderer.invoke('qdb:imported-datasets:remove', id),
  removeImportedDatasets: (ids) => ipcRenderer.invoke('qdb:imported-datasets:remove-many', ids),
  removeAllDatasets: (kinds) => ipcRenderer.invoke('qdb:datasets:remove-all', kinds),
  listConvertedDatasets: () => ipcRenderer.invoke('qdb:converted-datasets:list'),
  createConvertedDataset: (request: CreateConvertedDatasetRequest) =>
    ipcRenderer.invoke('qdb:converted-datasets:create', request),
  cancelConversion: (requestId) => ipcRenderer.invoke('qdb:conversion:cancel', requestId),
  renameConvertedDataset: (id, name) =>
    ipcRenderer.invoke('qdb:converted-datasets:rename', id, name),
  removeConvertedDataset: (id) => ipcRenderer.invoke('qdb:converted-datasets:remove', id),
  removeConvertedDatasets: (ids) => ipcRenderer.invoke('qdb:converted-datasets:remove-many', ids),
  analyzeDatasetIds: (request: DatasetIdAnalysisRequest) =>
    ipcRenderer.invoke('qdb:dataset-ids:analyze', request),
  cancelDatasetIdAnalysis: (requestId) =>
    ipcRenderer.invoke('qdb:dataset-ids:cancel-analysis', requestId),
  analyzePlayernames: (request: PlayernameAnalysisRequest) =>
    ipcRenderer.invoke('qdb:playernames:analyze', request),
  cancelPlayernameAnalysis: (requestId) =>
    ipcRenderer.invoke('qdb:playernames:cancel-analysis', requestId),
  runPlayername: (request: PlayernameRunRequest) =>
    ipcRenderer.invoke('qdb:playernames:run', request),
  cancelPlayername: (requestId) => ipcRenderer.invoke('qdb:playernames:cancel', requestId),
  selectExportDirectory: () => ipcRenderer.invoke('qdb:export:select-directory'),
  exportDataset: (request: ExportDatasetRequest) => ipcRenderer.invoke('qdb:export:run', request),
  revealExport: (path) => ipcRenderer.invoke('qdb:export:reveal', path),
  onImportProgress: (listener) => {
    const handler = (_event: Electron.IpcRendererEvent, message: unknown): void => {
      if (typeof message === 'string') listener(message);
    };
    ipcRenderer.on('qdb:imported-datasets:import-progress', handler);
    return () => ipcRenderer.removeListener('qdb:imported-datasets:import-progress', handler);
  },
  onConversionProgress: (listener) => {
    const handler = (_event: Electron.IpcRendererEvent, progress: ConversionProgress): void =>
      listener(progress);
    ipcRenderer.on('qdb:conversion:progress', handler);
    return () => ipcRenderer.removeListener('qdb:conversion:progress', handler);
  },
  onDatasetIdAnalysisProgress: (listener) => {
    const handler = (
      _event: Electron.IpcRendererEvent,
      progress: DatasetIdAnalysisProgress,
    ): void => listener(progress);
    ipcRenderer.on('qdb:dataset-ids:analysis-progress', handler);
    return () => ipcRenderer.removeListener('qdb:dataset-ids:analysis-progress', handler);
  },
  onPlayernameAnalysisProgress: (listener) => {
    const handler = (
      _event: Electron.IpcRendererEvent,
      progress: PlayernameAnalysisProgress,
    ): void => listener(progress);
    ipcRenderer.on('qdb:playernames:analysis-progress', handler);
    return () => ipcRenderer.removeListener('qdb:playernames:analysis-progress', handler);
  },
  onPlayernameProgress: (listener) => {
    const handler = (_event: Electron.IpcRendererEvent, progress: PlayernameProgress): void =>
      listener(progress);
    ipcRenderer.on('qdb:playernames:progress', handler);
    return () => ipcRenderer.removeListener('qdb:playernames:progress', handler);
  },
};

contextBridge.exposeInMainWorld('qdbConverter', api);
