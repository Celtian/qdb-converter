import { BrowserWindow, type IpcMainInvokeEvent, type OpenDialogOptions, dialog } from 'electron';
import { randomUUID } from 'node:crypto';
import { basename, dirname, join } from 'node:path';
import { Worker } from 'node:worker_threads';

import type {
  DatasetImportCandidate,
  DatasetImportRequest,
  DatasetImportResult,
  DatasetImportValidationRequest,
  DatasetImportValidationResult,
  DatasetSourceFileSelection,
  DatasetValidationRequest,
  DatasetValidationResult,
  T3dbSourcePreparationRequest,
  ValidationError,
} from '../shared/contracts';
import { isSupportedVersion } from '../shared/table-config';
import type {
  ConvertedDatasetRecord,
  DatasetLibrary,
  ImportedDatasetRecord,
} from './dataset-library';
import type { InspectedSource } from './source-inspection';
import {
  type SelectedSource,
  type SelectedT3dbFileKind,
  SourceSelections,
} from './source-selections';

const rendererUrl = process.env['QDB_RENDERER_URL'];
const uuidPattern = /^[0-9a-f-]{36}$/i;
const selections = new SourceSelections();
let library: DatasetLibrary;
let getMainWindow: () => BrowserWindow | undefined;
let activeImportWorker: Worker | undefined;
let importCancelled = false;

export const configureDatasetImportHandlers = (
  datasetLibrary: DatasetLibrary,
  mainWindow: () => BrowserWindow | undefined,
): void => {
  library = datasetLibrary;
  getMainWindow = mainWindow;
};

export const clearDatasetImportSelections = (): void => selections.clear();

export const cancelDatasetImport = (event: IpcMainInvokeEvent): boolean => {
  trustedSender(event);
  importCancelled = true;
  void activeImportWorker?.terminate();
  return activeImportWorker !== undefined;
};

const trustedSender = (event: IpcMainInvokeEvent): void => {
  const url = event.senderFrame?.url ?? '';
  const trusted =
    url.startsWith('file://') ||
    (rendererUrl !== undefined && url.startsWith('http://127.0.0.1:4200'));
  if (!trusted) throw new Error('Untrusted IPC sender.');
};

const windowFor = (event: IpcMainInvokeEvent): BrowserWindow | undefined =>
  BrowserWindow.fromWebContents(event.sender) ?? getMainWindow();

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

const validateId = (id: string): void => {
  if (!uuidPattern.test(id)) throw new Error('Invalid identifier.');
};

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

export const validateDataset = async (
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

export const validateImportSource = async (
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

export const selectTextSources = async (
  event: IpcMainInvokeEvent,
): Promise<DatasetImportCandidate[]> => {
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

export const selectT3dbFile = async (
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

export const prepareT3dbSource = async (
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

export const importDatasets = async (
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
