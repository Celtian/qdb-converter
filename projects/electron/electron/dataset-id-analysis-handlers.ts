import type { IpcMainInvokeEvent } from 'electron';
import { join } from 'node:path';
import { Worker } from 'node:worker_threads';

import type {
  DatasetIdAnalysisRequest,
  DatasetIdAnalysisResult,
  DatasetTableIdAnalysis,
  ValidationError,
} from '../shared/contracts';
import type { DatasetLibrary } from './dataset-library';

const rendererUrl = process.env['QDB_RENDERER_URL'];
const uuidPattern = /^[0-9a-f-]{36}$/i;
const cancelledRequests = new Set<string>();
let library: DatasetLibrary;
let activeWorker: Worker | undefined;
let activeRequestId = '';

export const configureDatasetIdAnalysisHandlers = (datasetLibrary: DatasetLibrary): void => {
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

export const validateDatasetIdAnalysisRequest = (request: DatasetIdAnalysisRequest): void => {
  if (!request || typeof request !== 'object')
    throw new Error('Invalid dataset ID analysis request.');
  validateId(request.requestId);
  validateId(request.datasetId);
  if (request.datasetKind !== 'imported' && request.datasetKind !== 'converted')
    throw new Error('Choose a dataset type.');
};

const validationError = (
  code: ValidationError['code'],
  message: string,
  details?: string[],
): ValidationError => ({ code, message, details });

export const analyzeDatasetIds = async (
  event: IpcMainInvokeEvent,
  request: DatasetIdAnalysisRequest,
): Promise<DatasetIdAnalysisResult> => {
  trustedSender(event);
  validateDatasetIdAnalysisRequest(request);
  if (activeWorker) throw new Error('Another dataset ID analysis is already running.');
  const dataset =
    request.datasetKind === 'imported'
      ? library.importedDataset(request.datasetId)
      : library.convertedDataset(request.datasetId);
  cancelledRequests.delete(request.requestId);

  const result = await new Promise<{
    status: DatasetIdAnalysisResult['status'];
    tables?: DatasetTableIdAnalysis[];
    message?: string;
  }>((resolved) => {
    const worker = new Worker(join(__dirname, 'dataset-id-analysis-worker.js'), {
      workerData: { dataset },
    });
    activeWorker = worker;
    activeRequestId = request.requestId;
    let settled = false;
    const finish = (value: {
      status: DatasetIdAnalysisResult['status'];
      tables?: DatasetTableIdAnalysis[];
      message?: string;
    }): void => {
      if (settled) return;
      settled = true;
      activeWorker = undefined;
      activeRequestId = '';
      resolved(value);
    };
    worker.on(
      'message',
      (message: { type?: string; message?: string; tables?: DatasetTableIdAnalysis[] }) => {
        if (message.type === 'progress' && message.message)
          event.sender.send('qdb:dataset-ids:analysis-progress', {
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
          cancelledRequests.has(request.requestId)
            ? { status: 'cancelled' }
            : { status: 'failed', message: `Dataset ID analysis worker exited with code ${code}.` },
        );
    });
  });

  cancelledRequests.delete(request.requestId);
  return {
    requestId: request.requestId,
    datasetId: dataset.id,
    status: result.status,
    tables: result.tables ?? [],
    error:
      result.status === 'completed'
        ? undefined
        : result.status === 'cancelled'
          ? validationError('cancelled', 'Dataset ID analysis was cancelled.')
          : validationError(
              'dataset-id-analysis-failed',
              'The managed dataset could not be analyzed for ID holes.',
              [result.message ?? 'The analysis worker failed without further details.'],
            ),
  };
};

export const cancelDatasetIdAnalysis = async (
  event: IpcMainInvokeEvent,
  requestId: string,
): Promise<boolean> => {
  trustedSender(event);
  validateId(requestId);
  if (!activeWorker || activeRequestId !== requestId) return false;
  cancelledRequests.add(requestId);
  await activeWorker.terminate();
  return true;
};
