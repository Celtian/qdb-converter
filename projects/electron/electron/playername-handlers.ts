import type { IpcMainInvokeEvent } from 'electron';
import { randomUUID } from 'node:crypto';
import { mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { Worker } from 'node:worker_threads';

import type {
  PlayernameAnalysisRequest,
  PlayernameAnalysisResult,
  PlayernameRunRequest,
  PlayernameRunResult,
  PlayernameSummary,
  PlayernameTableAnalysis,
  ValidationError,
} from '../shared/contracts';
import type {
  ConvertedDatasetRecord,
  DatasetLibrary,
  ImportedDatasetRecord,
} from './dataset-library';

const rendererUrl = process.env['QDB_RENDERER_URL'];
const uuidPattern = /^[0-9a-f-]{36}$/i;
const cancelledRequests = new Set<string>();
let library: DatasetLibrary;
let activeWorker: Worker | undefined;
let activeRequestId = '';
let activeAnalysisWorker: Worker | undefined;
let activeAnalysisRequestId = '';
const cancelledAnalysisRequests = new Set<string>();

export const configurePlayernameHandlers = (datasetLibrary: DatasetLibrary): void => {
  library = datasetLibrary;
};

const trustedSender = (event: IpcMainInvokeEvent): void => {
  const url = event.senderFrame?.url ?? '';
  const trusted =
    url.startsWith('file://') ||
    (rendererUrl !== undefined && url.startsWith('http://127.0.0.1:4200'));
  if (!trusted) throw new Error('Untrusted IPC sender.');
};

const validateId = (id: string): void => {
  if (!uuidPattern.test(id)) throw new Error('Invalid identifier.');
};

const validationError = (
  code: ValidationError['code'],
  message: string,
  details?: string[],
): ValidationError => ({ code, message, details });

const resultKind = (
  operations: PlayernameRunRequest['operations'],
): ConvertedDatasetRecord['resultKind'] =>
  operations.minimize && operations.removeUnused
    ? 'playernames-combined'
    : operations.minimize
      ? 'playernames-minimize'
      : 'playernames-remove-unused';

interface WorkerResult {
  status: PlayernameRunResult['status'];
  summary?: PlayernameSummary;
  message?: string;
}

const runWorker = (
  event: IpcMainInvokeEvent,
  dataset: ImportedDatasetRecord | ConvertedDatasetRecord,
  request: PlayernameRunRequest,
  outputDirectory: string,
): Promise<WorkerResult> =>
  new Promise((workerResolved) => {
    const worker = new Worker(join(__dirname, 'playername-worker.js'), {
      workerData: { dataset, operations: request.operations, outputDirectory },
    });
    activeWorker = worker;
    activeRequestId = request.requestId;
    let settled = false;
    const finish = (result: WorkerResult): void => {
      if (settled) return;
      settled = true;
      activeWorker = undefined;
      activeRequestId = '';
      workerResolved(result);
    };
    worker.on(
      'message',
      (message: { type?: string; message?: string; summary?: PlayernameSummary }) => {
        if (message.type === 'progress' && message.message)
          event.sender.send('qdb:playernames:progress', {
            requestId: request.requestId,
            datasetId: dataset.id,
            message: message.message,
          });
        else if (message.type === 'completed' && message.summary)
          finish({ status: 'completed', summary: message.summary });
        else if (message.type === 'failed') finish({ status: 'failed', message: message.message });
      },
    );
    worker.on('error', (error) => finish({ status: 'failed', message: error.message }));
    worker.on('exit', (code) => {
      if (!settled)
        finish(
          cancelledRequests.has(request.requestId)
            ? { status: 'cancelled' }
            : { status: 'failed', message: `Playernames worker exited with code ${code}.` },
        );
    });
  });

const validateRequest = (request: PlayernameRunRequest): void => {
  if (!request || typeof request !== 'object') throw new Error('Invalid Playernames request.');
  validateId(request.requestId);
  validateId(request.datasetId);
  if (request.datasetKind !== 'imported' && request.datasetKind !== 'converted')
    throw new Error('Choose a dataset type.');
  if (
    !request.operations ||
    typeof request.operations.minimize !== 'boolean' ||
    typeof request.operations.removeUnused !== 'boolean' ||
    (!request.operations.minimize && !request.operations.removeUnused)
  )
    throw new Error('Choose at least one Playernames operation.');
  if (
    !request.output ||
    (request.output.kind !== 'overwrite' && request.output.kind !== 'new-converted')
  )
    throw new Error('Choose an output destination.');
};

const validateAnalysisRequest = (request: PlayernameAnalysisRequest): void => {
  if (!request || typeof request !== 'object')
    throw new Error('Invalid Playernames analysis request.');
  validateId(request.requestId);
  validateId(request.datasetId);
  if (request.datasetKind !== 'imported' && request.datasetKind !== 'converted')
    throw new Error('Choose a dataset type.');
};

export const analyzePlayernames = async (
  event: IpcMainInvokeEvent,
  request: PlayernameAnalysisRequest,
): Promise<PlayernameAnalysisResult> => {
  trustedSender(event);
  validateAnalysisRequest(request);
  if (activeAnalysisWorker) throw new Error('Another Playernames analysis is already running.');
  const dataset =
    request.datasetKind === 'imported'
      ? library.importedDataset(request.datasetId)
      : library.convertedDataset(request.datasetId);
  cancelledAnalysisRequests.delete(request.requestId);

  const result = await new Promise<{
    status: PlayernameAnalysisResult['status'];
    tables?: PlayernameTableAnalysis[];
    message?: string;
  }>((resolved) => {
    const worker = new Worker(join(__dirname, 'playername-analysis-worker.js'), {
      workerData: { dataset },
    });
    activeAnalysisWorker = worker;
    activeAnalysisRequestId = request.requestId;
    let settled = false;
    const finish = (value: {
      status: PlayernameAnalysisResult['status'];
      tables?: PlayernameTableAnalysis[];
      message?: string;
    }): void => {
      if (settled) return;
      settled = true;
      activeAnalysisWorker = undefined;
      activeAnalysisRequestId = '';
      resolved(value);
    };
    worker.on(
      'message',
      (message: { type?: string; message?: string; tables?: PlayernameTableAnalysis[] }) => {
        if (message.type === 'progress' && message.message)
          event.sender.send('qdb:playernames:analysis-progress', {
            requestId: request.requestId,
            datasetId: dataset.id,
            message: message.message,
          });
        else if (message.type === 'completed' && message.tables)
          finish({ status: 'completed', tables: message.tables });
        else if (message.type === 'failed') finish({ status: 'failed', message: message.message });
      },
    );
    worker.on('error', (error) => finish({ status: 'failed', message: error.message }));
    worker.on('exit', (code) => {
      if (!settled)
        finish(
          cancelledAnalysisRequests.has(request.requestId)
            ? { status: 'cancelled' }
            : {
                status: 'failed',
                message: `Playernames analysis worker exited with code ${code}.`,
              },
        );
    });
  });

  cancelledAnalysisRequests.delete(request.requestId);
  return {
    requestId: request.requestId,
    datasetId: dataset.id,
    status: result.status,
    tables: result.tables ?? [],
    error:
      result.status === 'completed'
        ? undefined
        : result.status === 'cancelled'
          ? validationError('cancelled', 'Playernames analysis was cancelled.')
          : validationError(
              'playername-failed',
              'The selected dataset could not be analyzed for Playernames.',
              [result.message ?? 'The analysis worker failed without further details.'],
            ),
  };
};

export const cancelPlayernameAnalysis = async (
  event: IpcMainInvokeEvent,
  requestId: string,
): Promise<boolean> => {
  trustedSender(event);
  validateId(requestId);
  if (!activeAnalysisWorker || activeAnalysisRequestId !== requestId) return false;
  cancelledAnalysisRequests.add(requestId);
  await activeAnalysisWorker.terminate();
  return true;
};

export const runPlayername = async (
  event: IpcMainInvokeEvent,
  request: PlayernameRunRequest,
): Promise<PlayernameRunResult> => {
  trustedSender(event);
  validateRequest(request);
  if (activeWorker) throw new Error('Another Playernames operation is already running.');
  const dataset =
    request.datasetKind === 'imported'
      ? library.importedDataset(request.datasetId)
      : library.convertedDataset(request.datasetId);
  const overwrite = request.output.kind === 'overwrite';
  let managedName = '';
  const id = randomUUID();
  const replacementId = randomUUID();
  let stagingDirectory: string;
  let outputDirectory: string;

  if (request.output.kind === 'new-converted') {
    managedName = library.ensureUniqueConvertedName(request.output.name);
    stagingDirectory = library.convertedTemporaryDirectory(id);
    outputDirectory = stagingDirectory;
  } else {
    stagingDirectory = library.replacementTemporaryDirectory(
      request.datasetKind,
      dataset.id,
      replacementId,
    );
    outputDirectory =
      request.datasetKind === 'imported' ? join(stagingDirectory, 'text') : stagingDirectory;
    await mkdir(stagingDirectory, { recursive: true });
  }

  cancelledRequests.delete(request.requestId);
  try {
    const workerResult = await runWorker(event, dataset, request, outputDirectory);
    if (workerResult.status !== 'completed' || !workerResult.summary) {
      await rm(stagingDirectory, { recursive: true, force: true });
      return {
        sourceDatasetId: dataset.id,
        status: workerResult.status,
        error:
          workerResult.status === 'cancelled'
            ? validationError('cancelled', 'Playernames operation was cancelled.')
            : validationError(
                'playername-failed',
                'The Playernames operation could not create a result.',
                [
                  workerResult.message ?? 'The Playernames worker failed without further details.',
                  'The source dataset was not modified and no partial output was kept.',
                ],
              ),
      };
    }

    const removedRows = workerResult.summary.totalRowsBefore - workerResult.summary.totalRowsAfter;
    const updatedAt = new Date().toISOString();
    if (overwrite) {
      const installed =
        request.datasetKind === 'imported'
          ? library.replaceImported(
              {
                ...(dataset as ImportedDatasetRecord),
                managedFormat: 'text-folder',
                updatedAt,
                rowCount: Math.max(0, dataset.rowCount - removedRows),
                playernameSummary: workerResult.summary,
                snapshotDirectory: stagingDirectory,
              },
              replacementId,
            )
          : library.replaceConverted(
              {
                ...(dataset as ConvertedDatasetRecord),
                resultKind: resultKind(request.operations),
                updatedAt,
                rowCount: Math.max(0, dataset.rowCount - removedRows),
                playernameSummary: workerResult.summary,
                snapshotDirectory: stagingDirectory,
              },
              replacementId,
            );
      return {
        sourceDatasetId: dataset.id,
        status: 'completed',
        dataset: installed,
        summary: workerResult.summary,
      };
    }

    const record: ConvertedDatasetRecord = {
      id,
      name: managedName,
      resultKind: resultKind(request.operations),
      sourceDatasetKind: request.datasetKind,
      sourceDatasetId: dataset.id,
      sourceDatasetName: dataset.name,
      sourceVersion: dataset.fifaVersion,
      fifaVersion: dataset.fifaVersion,
      createdAt: updatedAt,
      updatedAt,
      status: 'available',
      tableNames: [...dataset.tableNames],
      tableCount: dataset.tableCount,
      rowCount: Math.max(0, dataset.rowCount - removedRows),
      tableSummaries: [],
      playernameSummary: workerResult.summary,
      warnings: [],
      snapshotDirectory: outputDirectory,
    };
    const installed = library.installConverted(record);
    return {
      sourceDatasetId: dataset.id,
      status: 'completed',
      dataset: installed,
      summary: workerResult.summary,
    };
  } catch (error) {
    await rm(stagingDirectory, { recursive: true, force: true });
    return {
      sourceDatasetId: dataset.id,
      status: 'failed',
      error: validationError(
        'playername-failed',
        'The Playernames operation could not create a result.',
        [
          error instanceof Error ? error.message : String(error),
          'The source dataset was not modified and no partial output was kept.',
        ],
      ),
    };
  } finally {
    cancelledRequests.delete(request.requestId);
  }
};

export const cancelPlayername = (event: IpcMainInvokeEvent, requestId: string): boolean => {
  trustedSender(event);
  validateId(requestId);
  if (!activeWorker || activeRequestId !== requestId) return false;
  cancelledRequests.add(requestId);
  void activeWorker.terminate();
  return true;
};
