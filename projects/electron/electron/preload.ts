import { contextBridge, ipcRenderer } from 'electron';
import type {
  ConversionProgress,
  ConversionRequest,
  DatasetImportRequest,
  QdbConverterApi,
} from '../shared/contracts';

const api: QdbConverterApi = {
  listDatasets: () => ipcRenderer.invoke('qdb:datasets:list'),
  selectTextSources: () => ipcRenderer.invoke('qdb:datasets:select-text'),
  selectT3dbSource: () => ipcRenderer.invoke('qdb:datasets:select-t3db'),
  importDatasets: (requests: DatasetImportRequest[]) =>
    ipcRenderer.invoke('qdb:datasets:import', requests),
  cancelImport: () => ipcRenderer.invoke('qdb:datasets:cancel-import'),
  renameDataset: (id, name) => ipcRenderer.invoke('qdb:datasets:rename', id, name),
  removeDataset: (id) => ipcRenderer.invoke('qdb:datasets:remove', id),
  selectOutputDirectory: () => ipcRenderer.invoke('qdb:conversion:select-output'),
  runConversion: (request: ConversionRequest) => ipcRenderer.invoke('qdb:conversion:run', request),
  cancelConversion: (requestId) => ipcRenderer.invoke('qdb:conversion:cancel', requestId),
  listConversions: () => ipcRenderer.invoke('qdb:conversion:list'),
  removeConversion: (id) => ipcRenderer.invoke('qdb:conversion:remove', id),
  revealOutput: (path) => ipcRenderer.invoke('qdb:conversion:reveal', path),
  onImportProgress: (listener) => {
    const handler = (_event: Electron.IpcRendererEvent, message: unknown): void => {
      if (typeof message === 'string') listener(message);
    };
    ipcRenderer.on('qdb:datasets:import-progress', handler);
    return () => ipcRenderer.removeListener('qdb:datasets:import-progress', handler);
  },
  onConversionProgress: (listener) => {
    const handler = (_event: Electron.IpcRendererEvent, progress: ConversionProgress): void =>
      listener(progress);
    ipcRenderer.on('qdb:conversion:progress', handler);
    return () => ipcRenderer.removeListener('qdb:conversion:progress', handler);
  },
};

contextBridge.exposeInMainWorld('qdbConverter', api);
