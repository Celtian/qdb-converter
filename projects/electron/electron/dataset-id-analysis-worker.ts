import { parentPort, workerData } from 'node:worker_threads';

import type { DatasetIdAnalysisRecord } from './dataset-id-analysis';
import { analyzeDatasetIds } from './dataset-id-analysis';

interface DatasetIdAnalysisWorkerData {
  dataset: DatasetIdAnalysisRecord;
}

const run = async (): Promise<void> => {
  const data = workerData as DatasetIdAnalysisWorkerData;
  try {
    const tables = await analyzeDatasetIds(data.dataset, (message) =>
      parentPort?.postMessage({ type: 'progress', message }),
    );
    parentPort?.postMessage({ type: 'completed', tables });
  } catch (error) {
    parentPort?.postMessage({
      type: 'failed',
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

void run();
