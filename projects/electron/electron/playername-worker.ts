import { parentPort, workerData } from 'node:worker_threads';

import type { PlayernameOperations } from '../shared/contracts';
import type { ConvertedDatasetRecord, ImportedDatasetRecord } from './dataset-library';
import { createPlayernameDatasetSnapshot } from './playername-engine';

interface PlayernameWorkerData {
  dataset: ImportedDatasetRecord | ConvertedDatasetRecord;
  operations: PlayernameOperations;
  outputDirectory: string;
}

const run = async (): Promise<void> => {
  const data = workerData as PlayernameWorkerData;
  try {
    const summary = await createPlayernameDatasetSnapshot(
      data.dataset,
      data.operations,
      data.outputDirectory,
      (message) => parentPort?.postMessage({ type: 'progress', message }),
    );
    parentPort?.postMessage({ type: 'completed', summary });
  } catch (error) {
    parentPort?.postMessage({
      type: 'failed',
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

void run();
