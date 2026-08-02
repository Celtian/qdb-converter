import {
  BrowserWindow,
  type IpcMainInvokeEvent,
  Menu,
  type OpenDialogOptions,
  app,
  dialog,
  ipcMain,
  shell,
} from 'electron';
import { randomUUID } from 'node:crypto';
import { basename, dirname, isAbsolute, join, resolve } from 'node:path';
import { Worker } from 'node:worker_threads';
import { updateElectronApp } from 'update-electron-app';

import type {
  CreateConvertedDatasetRequest,
  CreateConvertedDatasetResult,
  DatasetImportCandidate,
  DatasetImportRequest,
  DatasetImportResult,
  DatasetImportValidationRequest,
  DatasetImportValidationResult,
  DatasetSourceFileSelection,
  DatasetValidationRequest,
  DatasetValidationResult,
  ExportDatasetRequest,
  ExportDatasetResult,
  T3dbSourcePreparationRequest,
  TableConversionSummary,
  ValidationError,
} from '../../shared/contracts';
import { isSupportedVersion } from '../../shared/table-config';
import { parseDatasetKinds } from '../dataset-cleanup';
import { exportDatasetSnapshot } from '../dataset-exporter';
import {
  type ConvertedDatasetRecord,
  DatasetLibrary,
  type ImportedDatasetRecord,
} from '../dataset-library';
import type { InspectedSource } from '../source-inspection';
import {
  type SelectedSource,
  type SelectedT3dbFileKind,
  SourceSelections,
} from '../source-selections';

let mainWindow: BrowserWindow | undefined;
let library: DatasetLibrary;
const selections = new SourceSelections();
const exportSelections = new Set<string>();
const revealedExports = new Set<string>();
let activeImportWorker: Worker | undefined;
let importCancelled = false;
let activeConversionWorker: Worker | undefined;
const cancelledConversions = new Set<string>();
const uuidPattern = /^[0-9a-f-]{36}$/i;

app.setName('QDB Converter');

const rendererUrl = process.env['QDB_RENDERER_URL'];
const applicationIcon = app.isPackaged
  ? join(app.getAppPath(), 'dist', 'electron', 'browser', 'qdb-converter-icon.png')
  : resolve(__dirname, '../../../../projects/electron/public/qdb-converter-icon.png');
const trustedSender = (event: IpcMainInvokeEvent): void => {
  const url = event.senderFrame?.url ?? '';
  const trusted =
    url.startsWith('file://') ||
    (rendererUrl !== undefined && url.startsWith('http://127.0.0.1:4200'));
  if (!trusted) throw new Error('Untrusted IPC sender.');
};

const windowFor = (event: IpcMainInvokeEvent): BrowserWindow | undefined =>
  BrowserWindow.fromWebContents(event.sender) ?? mainWindow;

const openDialog = async (
  event: IpcMainInvokeEvent,
  options: OpenDialogOptions,
): Promise<string[]> => {
  trustedSender(event);
  const window = windowFor(event);
  const result = window
    ? await dialog.showOpenDialog(window, options)
    : await dialog.showOpenDialog(options);
  return result.canceled ? [] : result.filePaths;
};

const openImportDialog = async (
  event: IpcMainInvokeEvent,
  options: OpenDialogOptions,
  selectionKind: 'directory' | 'file',
): Promise<string[]> => {
  const defaultPath = library.lastImportDirectory();
  const paths = await openDialog(event, defaultPath ? { ...options, defaultPath } : options);
  const selectedPath = paths[0];
  if (selectedPath)
    library.rememberImportDirectory(
      selectionKind === 'directory' ? selectedPath : dirname(selectedPath),
    );
  return paths;
};

const validationError = (
  code: ValidationError['code'],
  message: string,
  details?: string[],
): ValidationError => ({ code, message, details });

const inspectSource = (
  data: { kind: 'text-folder'; paths: [string] } | { kind: 't3db'; paths: [string, string] },
): Promise<InspectedSource> =>
  new Promise((resolveInspection, rejectInspection) => {
    const worker = new Worker(join(__dirname, '..', 'inspection-worker.js'), { workerData: data });
    worker.once(
      'message',
      (message: { type?: string; inspection?: InspectedSource; message?: string }) => {
        if (message.type === 'completed' && message.inspection)
          resolveInspection(message.inspection);
        else rejectInspection(new Error(message.message ?? 'Source validation failed.'));
      },
    );
    worker.once('error', rejectInspection);
    worker.once('exit', (code) => {
      if (code !== 0) rejectInspection(new Error(`Validation worker exited with code ${code}.`));
    });
  });

type ValidationWorkerData =
  | { kind: 'dataset'; dataset: ImportedDatasetRecord | ConvertedDatasetRecord }
  | { kind: 'import-source'; source: SelectedSource; fifaVersion: number };

type ValidationWorkerResult = DatasetValidationResult | DatasetImportValidationResult;

const runValidationWorker = (data: ValidationWorkerData): Promise<ValidationWorkerResult> =>
  new Promise((resolveValidation, rejectValidation) => {
    const worker = new Worker(join(__dirname, '..', 'validation-worker.js'), {
      workerData: data,
    });
    let settled = false;
    const finish = (callback: () => void): void => {
      if (settled) return;
      settled = true;
      callback();
    };
    worker.once(
      'message',
      (message: { type?: string; result?: ValidationWorkerResult; message?: string }) => {
        const result = message.result;
        if (message.type === 'completed' && result) finish(() => resolveValidation(result));
        else
          finish(() =>
            rejectValidation(new Error(message.message ?? 'Dataset validation failed.')),
          );
      },
    );
    worker.once('error', (error) => finish(() => rejectValidation(error)));
    worker.once('exit', (code) => {
      if (settled) return;
      const message =
        code === 0
          ? 'Validation worker exited before returning a result.'
          : `Validation worker exited with code ${code}.`;
      finish(() => rejectValidation(new Error(message)));
    });
  });

const validateDataset = async (
  event: IpcMainInvokeEvent,
  request: DatasetValidationRequest,
): Promise<DatasetValidationResult> => {
  trustedSender(event);
  if (
    !request ||
    typeof request !== 'object' ||
    (request.datasetKind !== 'imported' && request.datasetKind !== 'converted')
  )
    throw new Error('Choose a dataset type.');
  validateId(request.datasetId);
  const result = await runValidationWorker({
    kind: 'dataset',
    dataset:
      request.datasetKind === 'imported'
        ? library.importedDataset(request.datasetId)
        : library.convertedDataset(request.datasetId),
  });
  if (!('datasetId' in result)) throw new Error('Dataset validation returned an invalid result.');
  return result;
};

const validateImportSource = async (
  event: IpcMainInvokeEvent,
  request: DatasetImportValidationRequest,
): Promise<DatasetImportValidationResult> => {
  trustedSender(event);
  if (
    !request ||
    typeof request.selectionId !== 'string' ||
    !isSupportedVersion(request.fifaVersion)
  )
    throw new Error('Invalid source validation request.');
  const source = selections.get(request.selectionId);
  if (!source) throw new Error('Select this source again before validating.');
  if (!source.inspection.matchingVersions.includes(request.fifaVersion))
    throw new Error('The selected FIFA version does not match the source schema.');
  const result = await runValidationWorker({
    kind: 'import-source',
    source,
    fifaVersion: request.fifaVersion,
  });
  if (!('selectionId' in result)) throw new Error('Source validation returned an invalid result.');
  selections.recordValidation(result.selectionId, request.fifaVersion, result.errorCount);
  return result;
};

const validateId = (id: string): void => {
  if (!uuidPattern.test(id)) throw new Error('Invalid identifier.');
};

const selectTextSources = async (event: IpcMainInvokeEvent): Promise<DatasetImportCandidate[]> => {
  const paths = await openImportDialog(
    event,
    {
      title: 'Select FIFA text dataset folders',
      properties: ['openDirectory', 'multiSelections'],
    },
    'directory',
  );
  const candidates: DatasetImportCandidate[] = [];
  const errors: string[] = [];
  for (const path of paths) {
    try {
      candidates.push(selections.add(await inspectSource({ kind: 'text-folder', paths: [path] })));
    } catch (error) {
      errors.push(`${path}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  if (errors.length) {
    const window = windowFor(event);
    const options = {
      type: 'warning',
      title: 'Some sources were skipped',
      message: 'One or more folders could not be added.',
      detail: errors.join('\n'),
    } as const;
    if (window) await dialog.showMessageBox(window, options);
    else await dialog.showMessageBox(options);
  }
  return candidates;
};

const selectT3dbFile = async (
  event: IpcMainInvokeEvent,
  kind: SelectedT3dbFileKind,
): Promise<DatasetSourceFileSelection | undefined> => {
  const [path] = await openImportDialog(
    event,
    {
      title:
        kind === 'database' ? 'Select FIFA t3db database' : 'Select matching FIFA metadata XML',
      properties: ['openFile'],
      filters:
        kind === 'database'
          ? [{ name: 'FIFA t3db database', extensions: ['db'] }]
          : [{ name: 'FIFA metadata XML', extensions: ['xml'] }],
    },
    'file',
  );
  if (!path) return undefined;
  return { id: selections.addT3dbFile(kind, path), displayPath: path, fileName: basename(path) };
};

const prepareT3dbSource = async (
  event: IpcMainInvokeEvent,
  request: T3dbSourcePreparationRequest,
): Promise<DatasetImportCandidate> => {
  trustedSender(event);
  if (
    !request ||
    typeof request.databaseFileId !== 'string' ||
    typeof request.metadataFileId !== 'string'
  )
    throw new Error('Invalid t3db source selection.');
  const pair = selections.resolveT3dbPair(request.databaseFileId, request.metadataFileId);
  if (!pair) throw new Error('Select the t3db database and metadata XML again.');
  const inspection = await inspectSource({
    kind: 't3db',
    paths: [pair.databasePath, pair.metadataPath],
  });
  return selections.addT3dbSource(inspection, request.databaseFileId, request.metadataFileId);
};

interface ImportWorkerResult {
  status: 'completed' | 'failed' | 'cancelled';
  record?: ImportedDatasetRecord;
  message?: string;
}

const runImportWorker = (
  event: IpcMainInvokeEvent,
  data: {
    id: string;
    name: string;
    fifaVersion: number;
    source: NonNullable<ReturnType<SourceSelections['get']>>;
    temporaryDirectory: string;
  },
): Promise<ImportWorkerResult> =>
  new Promise((resolve) => {
    const worker = new Worker(join(__dirname, '..', 'import-worker.js'), { workerData: data });
    activeImportWorker = worker;
    let settled = false;
    const finish = (result: ImportWorkerResult): void => {
      if (settled) return;
      settled = true;
      activeImportWorker = undefined;
      resolve(result);
    };
    worker.on(
      'message',
      (message: { type?: string; message?: string; record?: ImportedDatasetRecord }) => {
        if (message.type === 'progress' && message.message) {
          event.sender.send('qdb:imported-datasets:import-progress', message.message);
        } else if (message.type === 'completed' && message.record) {
          finish({ status: 'completed', record: message.record });
        } else if (message.type === 'failed') {
          finish({ status: 'failed', message: message.message });
        }
      },
    );
    worker.on('error', (error) => finish({ status: 'failed', message: error.message }));
    worker.on('exit', (code) => {
      if (!settled)
        finish(
          importCancelled
            ? { status: 'cancelled' }
            : { status: 'failed', message: `Import worker exited with code ${code}.` },
        );
    });
  });

const importDatasets = async (
  event: IpcMainInvokeEvent,
  requests: DatasetImportRequest[],
): Promise<DatasetImportResult[]> => {
  trustedSender(event);
  if (activeImportWorker) throw new Error('A dataset import is already running.');
  if (!Array.isArray(requests) || requests.length < 1 || requests.length > 100)
    throw new Error('Choose between 1 and 100 datasets to import.');
  importCancelled = false;
  const results: DatasetImportResult[] = [];

  for (const request of requests) {
    if (importCancelled) {
      results.push({ selectionId: request.selectionId, status: 'cancelled' });
      continue;
    }
    const source = selections.get(request.selectionId);
    if (!source) {
      results.push({
        selectionId: request.selectionId,
        status: 'failed',
        error: validationError('invalid-request', 'Select this source again before importing.'),
      });
      continue;
    }
    const id = randomUUID();
    try {
      if (
        !isSupportedVersion(request.fifaVersion) ||
        !source.inspection.matchingVersions.includes(request.fifaVersion)
      )
        throw new Error('The selected FIFA version does not match the source schema.');
      if (!selections.canImport(request.selectionId, request.fifaVersion))
        throw new Error('Run validations successfully for this source before importing.');
      const name = library.ensureUniqueImportedName(request.name);
      const workerResult = await runImportWorker(event, {
        id,
        name,
        fifaVersion: request.fifaVersion,
        source,
        temporaryDirectory: library.importedTemporaryDirectory(id),
      });
      if (workerResult.status === 'cancelled') {
        library.discardImportedTemporary(id);
        results.push({ selectionId: request.selectionId, status: 'cancelled' });
      } else if (workerResult.status === 'failed' || !workerResult.record) {
        library.discardImportedTemporary(id);
        results.push({
          selectionId: request.selectionId,
          status: 'failed',
          error: validationError(
            'invalid-source',
            workerResult.message ?? 'The dataset could not be imported.',
          ),
        });
      } else {
        results.push({
          selectionId: request.selectionId,
          status: 'completed',
          dataset: library.installImported(workerResult.record),
        });
        selections.delete(request.selectionId);
      }
    } catch (error) {
      library.discardImportedTemporary(id);
      results.push({
        selectionId: request.selectionId,
        status: 'failed',
        error: validationError(
          /already exists/i.test(String(error)) ? 'duplicate-name' : 'invalid-request',
          error instanceof Error ? error.message : String(error),
        ),
      });
    }
  }
  return results;
};

interface WorkerConversionOutput {
  tables: TableConversionSummary[];
  warnings: string[];
}

const runConversionWorker = (
  event: IpcMainInvokeEvent,
  dataset: ImportedDatasetRecord,
  request: CreateConvertedDatasetRequest,
  outputDirectory: string,
): Promise<{
  status: CreateConvertedDatasetResult['status'];
  output?: WorkerConversionOutput;
  message?: string;
}> =>
  new Promise((resolve) => {
    const worker = new Worker(join(__dirname, '..', 'conversion-worker.js'), {
      workerData: { dataset, request, outputDirectory },
    });
    activeConversionWorker = worker;
    let settled = false;
    const finish = (result: {
      status: CreateConvertedDatasetResult['status'];
      output?: WorkerConversionOutput;
      message?: string;
    }): void => {
      if (settled) return;
      settled = true;
      activeConversionWorker = undefined;
      resolve(result);
    };
    worker.on(
      'message',
      (message: { type?: string; message?: string; output?: WorkerConversionOutput }) => {
        if (message.type === 'progress' && message.message) {
          event.sender.send('qdb:conversion:progress', {
            requestId: request.requestId,
            sourceDatasetId: dataset.id,
            message: message.message,
          });
        } else if (message.type === 'completed' && message.output) {
          finish({ status: 'completed', output: message.output });
        } else if (message.type === 'failed') {
          finish({ status: 'failed', message: message.message });
        }
      },
    );
    worker.on('error', (error) => finish({ status: 'failed', message: error.message }));
    worker.on('exit', (code) => {
      if (!settled)
        finish(
          cancelledConversions.has(request.requestId)
            ? { status: 'cancelled' }
            : { status: 'failed', message: `Conversion worker exited with code ${code}.` },
        );
    });
  });

const validateConversionRequest = (request: CreateConvertedDatasetRequest): string => {
  if (!request || typeof request !== 'object') throw new Error('Invalid conversion request.');
  validateId(request.requestId);
  validateId(request.sourceDatasetId);
  if (!isSupportedVersion(request.targetVersion))
    throw new Error('Unsupported target FIFA version.');
  if (typeof request.name !== 'string') throw new Error('Invalid converted dataset name.');
  return library.ensureUniqueConvertedName(request.name);
};

const runConversion = async (
  event: IpcMainInvokeEvent,
  request: CreateConvertedDatasetRequest,
): Promise<CreateConvertedDatasetResult> => {
  trustedSender(event);
  if (activeConversionWorker) throw new Error('Another conversion is already running.');
  const name = validateConversionRequest(request);
  cancelledConversions.delete(request.requestId);
  const source = library.importedDataset(request.sourceDatasetId);
  const id = randomUUID();
  const temporaryDirectory = library.convertedTemporaryDirectory(id);
  try {
    const workerResult = await runConversionWorker(event, source, request, temporaryDirectory);
    const tables = workerResult.output?.tables ?? [];
    const warnings = workerResult.output?.warnings ?? [];
    if (workerResult.status !== 'completed' || !workerResult.output) {
      library.discardConvertedTemporary(id);
      const error =
        workerResult.status === 'cancelled'
          ? validationError('cancelled', 'Conversion was cancelled.')
          : validationError(
              'conversion-failed',
              workerResult.message ?? 'The dataset could not be converted.',
            );
      return {
        sourceDatasetId: source.id,
        status: workerResult.status,
        tables,
        warnings,
        error,
      };
    }
    const record: ConvertedDatasetRecord = {
      id,
      name,
      sourceDatasetId: source.id,
      sourceDatasetName: source.name,
      sourceVersion: source.fifaVersion,
      fifaVersion: request.targetVersion,
      createdAt: new Date().toISOString(),
      status: 'available',
      tableNames: tables.map((table) => table.table),
      tableCount: tables.length,
      rowCount: tables.reduce((total, table) => total + table.rows, 0),
      tableSummaries: tables,
      warnings,
      snapshotDirectory: temporaryDirectory,
    };
    const dataset = library.installConverted(record);
    event.sender.send('qdb:conversion:progress', {
      requestId: request.requestId,
      sourceDatasetId: source.id,
      message: `${dataset.name} created.`,
    });
    return {
      sourceDatasetId: source.id,
      status: 'completed',
      dataset,
      tables,
      warnings,
    };
  } catch (error) {
    library.discardConvertedTemporary(id);
    return {
      sourceDatasetId: source.id,
      status: 'failed',
      tables: [],
      warnings: [],
      error: validationError(
        /already exists/i.test(String(error)) ? 'duplicate-name' : 'conversion-failed',
        error instanceof Error ? error.message : String(error),
      ),
    };
  } finally {
    cancelledConversions.delete(request.requestId);
  }
};

const registerIpc = (): void => {
  ipcMain.handle('qdb:imported-datasets:list', (event) => {
    trustedSender(event);
    return library.listImportedDatasets();
  });
  ipcMain.handle('qdb:datasets:validate', validateDataset);
  ipcMain.handle('qdb:imported-datasets:validate-source', validateImportSource);
  ipcMain.handle('qdb:imported-datasets:select-text', selectTextSources);
  ipcMain.handle('qdb:imported-datasets:select-t3db-database', (event) =>
    selectT3dbFile(event, 'database'),
  );
  ipcMain.handle('qdb:imported-datasets:select-t3db-metadata', (event) =>
    selectT3dbFile(event, 'metadata'),
  );
  ipcMain.handle('qdb:imported-datasets:prepare-t3db', prepareT3dbSource);
  ipcMain.handle('qdb:imported-datasets:import', importDatasets);
  ipcMain.handle('qdb:imported-datasets:cancel-import', (event) => {
    trustedSender(event);
    importCancelled = true;
    void activeImportWorker?.terminate();
    return activeImportWorker !== undefined;
  });
  ipcMain.handle('qdb:imported-datasets:rename', (event, id: string, name: string) => {
    trustedSender(event);
    validateId(id);
    if (typeof name !== 'string') throw new Error('Invalid dataset name.');
    return library.renameImported(id, name);
  });
  ipcMain.handle('qdb:imported-datasets:remove', (event, id: string) => {
    trustedSender(event);
    validateId(id);
    return library.removeImported(id);
  });
  ipcMain.handle('qdb:imported-datasets:remove-many', (event, ids: unknown) => {
    trustedSender(event);
    if (
      !Array.isArray(ids) ||
      ids.length < 1 ||
      ids.length > 100 ||
      !ids.every((id): id is string => typeof id === 'string')
    )
      throw new Error('Invalid dataset identifiers.');
    ids.forEach(validateId);
    return library.removeImportedMany(ids);
  });
  ipcMain.handle('qdb:converted-datasets:list', (event) => {
    trustedSender(event);
    return library.listConvertedDatasets();
  });
  ipcMain.handle('qdb:converted-datasets:create', runConversion);
  ipcMain.handle('qdb:converted-datasets:rename', (event, id: string, name: string) => {
    trustedSender(event);
    validateId(id);
    if (typeof name !== 'string') throw new Error('Invalid dataset name.');
    return library.renameConverted(id, name);
  });
  ipcMain.handle('qdb:converted-datasets:remove', (event, id: string) => {
    trustedSender(event);
    validateId(id);
    return library.removeConverted(id);
  });
  ipcMain.handle('qdb:converted-datasets:remove-many', (event, ids: unknown) => {
    trustedSender(event);
    if (
      !Array.isArray(ids) ||
      ids.length < 1 ||
      ids.length > 100 ||
      !ids.every((id): id is string => typeof id === 'string')
    )
      throw new Error('Invalid dataset identifiers.');
    ids.forEach(validateId);
    return library.removeConvertedMany(ids);
  });
  ipcMain.handle('qdb:datasets:remove-all', (event, kinds: unknown) => {
    trustedSender(event);
    return library.removeAll(parseDatasetKinds(kinds));
  });
  ipcMain.handle('qdb:conversion:cancel', (event, requestId: string) => {
    trustedSender(event);
    validateId(requestId);
    cancelledConversions.add(requestId);
    void activeConversionWorker?.terminate();
    return activeConversionWorker !== undefined;
  });
  ipcMain.handle('qdb:export:select-directory', async (event) => {
    const paths = await openDialog(event, {
      title: 'Select dataset export folder',
      properties: ['openDirectory', 'createDirectory'],
    });
    const path = paths[0] ? resolve(paths[0]) : undefined;
    if (path) exportSelections.add(path);
    return path;
  });
  ipcMain.handle(
    'qdb:export:run',
    async (event, request: ExportDatasetRequest): Promise<ExportDatasetResult> => {
      trustedSender(event);
      if (!request || typeof request !== 'object') throw new Error('Invalid export request.');
      if (request.datasetKind !== 'imported' && request.datasetKind !== 'converted')
        throw new Error('Choose a dataset type.');
      validateId(request.datasetId);
      if (
        typeof request.targetParentPath !== 'string' ||
        !request.targetParentPath.trim() ||
        !isAbsolute(request.targetParentPath)
      )
        throw new Error('Choose an export folder.');
      const targetParentPath = resolve(request.targetParentPath);
      if (!exportSelections.has(targetParentPath))
        throw new Error('Choose the export folder again before exporting.');
      const dataset =
        request.datasetKind === 'imported'
          ? library.importedDataset(request.datasetId)
          : library.convertedDataset(request.datasetId);
      const outputPath = await exportDatasetSnapshot(dataset, targetParentPath);
      revealedExports.add(outputPath);
      return { datasetId: dataset.id, outputPath };
    },
  );
  ipcMain.handle('qdb:export:reveal', (event, path: string) => {
    trustedSender(event);
    if (typeof path !== 'string' || !revealedExports.has(path))
      throw new Error('Unknown export path.');
    shell.showItemInFolder(path);
    return true;
  });
};

const createWindow = async (): Promise<void> => {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 600,
    minHeight: 620,
    show: false,
    backgroundColor: '#f7f9ff',
    icon: applicationIcon,
    webPreferences: {
      preload: join(__dirname, '..', 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) void shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.session.setPermissionRequestHandler(
    (_webContents, _permission, callback) => callback(false),
  );
  mainWindow.once('ready-to-show', () => mainWindow?.show());
  if (rendererUrl) await mainWindow.loadURL(rendererUrl);
  else
    await mainWindow.loadFile(join(app.getAppPath(), 'dist', 'electron', 'browser', 'index.html'));
};

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);
  library = new DatasetLibrary(app.getPath('userData'));
  registerIpc();
  if (app.isPackaged) updateElectronApp();
  await createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) void createWindow();
  });
});

app.on('window-all-closed', () => {
  selections.clear();
  if (process.platform !== 'darwin') app.quit();
});
