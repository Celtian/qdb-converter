import { parentPort, workerData } from 'node:worker_threads';

import {
  type PlayernameDatasetRecord,
  PlayernameInspectionError,
  analyzePlayernameDataset,
} from './playername-analysis';

interface PlayernameAnalysisWorkerData {
  dataset: PlayernameDatasetRecord;
}

const run = async (): Promise<void> => {
  const data = workerData as PlayernameAnalysisWorkerData;
  try {
    const tables = await analyzePlayernameDataset(data.dataset, (message) =>
      parentPort?.postMessage({ type: 'progress', message }),
    );
    parentPort?.postMessage({ type: 'completed', tables });
  } catch (error) {
    parentPort?.postMessage({
      type: 'failed',
      message: error instanceof Error ? error.message : String(error),
      tables: error instanceof PlayernameInspectionError ? error.tables : undefined,
    });
  }
};

void run();
