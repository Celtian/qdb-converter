import { parentPort, workerData } from 'node:worker_threads';
import type { CreateConvertedDatasetRequest } from '../shared/contracts';
import { createConvertedDatasetSnapshot } from './conversion-engine';
import type { ImportedDatasetRecord } from './dataset-library';

interface ConversionWorkerData {
  dataset: ImportedDatasetRecord;
  request: CreateConvertedDatasetRequest;
  outputDirectory: string;
}

const run = async (): Promise<void> => {
  const data = workerData as ConversionWorkerData;
  try {
    const output = await createConvertedDatasetSnapshot(
      data.dataset,
      data.request.targetVersion,
      data.outputDirectory,
      (message) => parentPort?.postMessage({ type: 'progress', message }),
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
