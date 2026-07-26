import { parentPort, workerData } from 'node:worker_threads';
import type { ConversionRequest } from '../shared/contracts';
import { convertDataset } from './conversion-engine';
import type { DatasetRecord } from './dataset-library';

interface ConversionWorkerData {
  dataset: DatasetRecord;
  request: ConversionRequest;
}

const run = async (): Promise<void> => {
  const data = workerData as ConversionWorkerData;
  try {
    const output = await convertDataset(data.dataset, data.request, (message) =>
      parentPort?.postMessage({ type: 'progress', message }),
    );
    parentPort?.postMessage({ type: 'completed', output });
  } catch (error) {
    parentPort?.postMessage({
      type: 'failed',
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

void run();
