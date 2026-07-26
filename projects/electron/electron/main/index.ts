import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  shell,
  type IpcMainInvokeEvent,
  type OpenDialogOptions,
} from 'electron';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { Worker } from 'node:worker_threads';
import { updateElectronApp } from 'update-electron-app';
import type {
  ConversionRecord,
  ConversionRequest,
  ConversionResult,
  DatasetImportCandidate,
  DatasetImportRequest,
  DatasetImportResult,
  ValidationError,
} from '../../shared/contracts';
import { isSupportedTable, isSupportedVersion } from '../../shared/table-config';
import { DatasetLibrary, type DatasetRecord } from '../dataset-library';
import type { InspectedSource } from '../source-inspection';
import { defaultMetadataPath } from '../source-inspection';
import { SourceSelections } from '../source-selections';

let mainWindow: BrowserWindow | undefined;
let library: DatasetLibrary;
const selections = new SourceSelections();
const outputSelections = new Set<string>();
let activeImportWorker: Worker | undefined;
let importCancelled = false;
let activeConversionWorker: Worker | undefined;
const cancelledConversions = new Set<string>();
const uuidPattern = /^[0-9a-f-]{36}$/i;

app.setName('QDB Converter');

const rendererUrl = process.env['QDB_RENDERER_URL'];
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

const validateId = (id: string): void => {
  if (!uuidPattern.test(id)) throw new Error('Invalid identifier.');
};

const selectTextSources = async (event: IpcMainInvokeEvent): Promise<DatasetImportCandidate[]> => {
  const paths = await openDialog(event, {
    title: 'Select FIFA text dataset folders',
    properties: ['openDirectory', 'multiSelections'],
  });
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

const selectT3dbSource = async (
  event: IpcMainInvokeEvent,
): Promise<DatasetImportCandidate | undefined> => {
  const [databasePath] = await openDialog(event, {
    title: 'Select FIFA t3db database',
    properties: ['openFile'],
    filters: [{ name: 'FIFA t3db database', extensions: ['db'] }],
  });
  if (!databasePath) return undefined;
  const automaticMetadata = defaultMetadataPath(databasePath);
  let metadataPath = existsSync(automaticMetadata) ? automaticMetadata : undefined;
  if (!metadataPath) {
    [metadataPath] = await openDialog(event, {
      title: 'Select matching FIFA metadata XML',
      properties: ['openFile'],
      filters: [{ name: 'FIFA metadata XML', extensions: ['xml'] }],
    });
  }
  if (!metadataPath) return undefined;
  return selections.add(await inspectSource({ kind: 't3db', paths: [databasePath, metadataPath] }));
};

interface ImportWorkerResult {
  status: 'completed' | 'failed' | 'cancelled';
  record?: DatasetRecord;
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
    worker.on('message', (message: { type?: string; message?: string; record?: DatasetRecord }) => {
      if (message.type === 'progress' && message.message) {
        event.sender.send('qdb:datasets:import-progress', message.message);
      } else if (message.type === 'completed' && message.record) {
        finish({ status: 'completed', record: message.record });
      } else if (message.type === 'failed') {
        finish({ status: 'failed', message: message.message });
      }
    });
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
      const name = library.ensureUniqueName(request.name);
      const workerResult = await runImportWorker(event, {
        id,
        name,
        fifaVersion: request.fifaVersion,
        source,
        temporaryDirectory: library.temporaryDirectory(id),
      });
      if (workerResult.status === 'cancelled') {
        library.discardTemporary(id);
        results.push({ selectionId: request.selectionId, status: 'cancelled' });
      } else if (workerResult.status === 'failed' || !workerResult.record) {
        library.discardTemporary(id);
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
          dataset: library.install(workerResult.record),
        });
        selections.delete(request.selectionId);
      }
    } catch (error) {
      library.discardTemporary(id);
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
  outputPath: string;
  tables: ConversionResult['tables'];
  warnings: string[];
}

const runConversionWorker = (
  event: IpcMainInvokeEvent,
  dataset: DatasetRecord,
  request: ConversionRequest,
  completedDatasets: number,
): Promise<{
  status: ConversionResult['status'];
  output?: WorkerConversionOutput;
  message?: string;
}> =>
  new Promise((resolve) => {
    const worker = new Worker(join(__dirname, '..', 'conversion-worker.js'), {
      workerData: { dataset, request },
    });
    activeConversionWorker = worker;
    let settled = false;
    const finish = (result: {
      status: ConversionResult['status'];
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
            datasetId: dataset.id,
            completedDatasets,
            totalDatasets: request.datasetIds.length,
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

const validateConversionRequest = (request: ConversionRequest): void => {
  validateId(request.requestId);
  if (!Array.isArray(request.datasetIds) || request.datasetIds.length < 1)
    throw new Error('Select at least one dataset.');
  request.datasetIds.forEach(validateId);
  if (!isSupportedVersion(request.targetVersion))
    throw new Error('Unsupported target FIFA version.');
  if (
    !Array.isArray(request.tables) ||
    !request.tables.length ||
    !request.tables.every(isSupportedTable)
  )
    throw new Error('Select at least one supported table.');
  if (
    typeof request.outputParentPath !== 'string' ||
    !request.outputParentPath.trim() ||
    !isAbsolute(request.outputParentPath)
  )
    throw new Error('Choose an output folder.');
  const outputPath = resolve(request.outputParentPath);
  const knownFromHistory = library
    .listConversions()
    .some((record) => record.outputPath && dirname(record.outputPath) === outputPath);
  if (!outputSelections.has(outputPath) && !knownFromHistory)
    throw new Error('Choose the output folder again before converting.');
  if (typeof request.extendContracts !== 'boolean') throw new Error('Invalid transform settings.');
};

const runConversion = async (
  event: IpcMainInvokeEvent,
  request: ConversionRequest,
): Promise<ConversionResult[]> => {
  trustedSender(event);
  if (activeConversionWorker) throw new Error('Another conversion is already running.');
  validateConversionRequest(request);
  cancelledConversions.delete(request.requestId);
  const results: ConversionResult[] = [];

  for (const datasetId of request.datasetIds) {
    const dataset = library.dataset(datasetId);
    const started = new Date();
    if (cancelledConversions.has(request.requestId)) {
      results.push({ datasetId, status: 'cancelled', tables: [], warnings: [] });
      continue;
    }
    const workerResult = await runConversionWorker(event, dataset, request, results.length);
    const completed = new Date();
    const error =
      workerResult.status === 'failed'
        ? validationError(
            'conversion-failed',
            workerResult.message ?? 'The dataset could not be converted.',
          )
        : workerResult.status === 'cancelled'
          ? validationError('cancelled', 'Conversion was cancelled.')
          : undefined;
    const result: ConversionResult = {
      datasetId,
      status: workerResult.status,
      outputPath: workerResult.output?.outputPath,
      tables: workerResult.output?.tables ?? [],
      warnings: workerResult.output?.warnings ?? [],
      error,
    };
    results.push(result);
    const record: ConversionRecord = {
      id: randomUUID(),
      requestId: request.requestId,
      datasetId,
      datasetName: dataset.name,
      sourceVersion: dataset.fifaVersion,
      targetVersion: request.targetVersion,
      source: structuredClone(dataset.source),
      status: result.status,
      outputPath: result.outputPath,
      selectedTables: [...request.tables],
      tableSummaries: result.tables,
      warnings: result.warnings,
      error: result.error,
      startedAt: started.toISOString(),
      completedAt: completed.toISOString(),
      durationMs: completed.getTime() - started.getTime(),
    };
    library.addConversion(record);
    event.sender.send('qdb:conversion:progress', {
      requestId: request.requestId,
      datasetId,
      completedDatasets: results.length,
      totalDatasets: request.datasetIds.length,
      message: `${dataset.name}: ${result.status}.`,
    });
  }
  cancelledConversions.delete(request.requestId);
  return results;
};

const registerIpc = (): void => {
  ipcMain.handle('qdb:datasets:list', (event) => {
    trustedSender(event);
    return library.listDatasets();
  });
  ipcMain.handle('qdb:datasets:select-text', selectTextSources);
  ipcMain.handle('qdb:datasets:select-t3db', selectT3dbSource);
  ipcMain.handle('qdb:datasets:import', importDatasets);
  ipcMain.handle('qdb:datasets:cancel-import', (event) => {
    trustedSender(event);
    importCancelled = true;
    void activeImportWorker?.terminate();
    return activeImportWorker !== undefined;
  });
  ipcMain.handle('qdb:datasets:rename', (event, id: string, name: string) => {
    trustedSender(event);
    validateId(id);
    if (typeof name !== 'string') throw new Error('Invalid dataset name.');
    return library.rename(id, name);
  });
  ipcMain.handle('qdb:datasets:remove', (event, id: string) => {
    trustedSender(event);
    validateId(id);
    return library.remove(id);
  });
  ipcMain.handle('qdb:conversion:select-output', async (event) => {
    const paths = await openDialog(event, {
      title: 'Select conversion output folder',
      properties: ['openDirectory', 'createDirectory'],
    });
    const path = paths[0] ? resolve(paths[0]) : undefined;
    if (path) outputSelections.add(path);
    return path;
  });
  ipcMain.handle('qdb:conversion:run', runConversion);
  ipcMain.handle('qdb:conversion:cancel', (event, requestId: string) => {
    trustedSender(event);
    validateId(requestId);
    cancelledConversions.add(requestId);
    void activeConversionWorker?.terminate();
    return activeConversionWorker !== undefined;
  });
  ipcMain.handle('qdb:conversion:list', (event) => {
    trustedSender(event);
    return library.listConversions();
  });
  ipcMain.handle('qdb:conversion:remove', (event, id: string) => {
    trustedSender(event);
    validateId(id);
    return library.removeConversion(id);
  });
  ipcMain.handle('qdb:conversion:reveal', (event, path: string) => {
    trustedSender(event);
    if (
      typeof path !== 'string' ||
      !library.listConversions().some((record) => record.outputPath === path)
    )
      throw new Error('Unknown conversion output path.');
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
