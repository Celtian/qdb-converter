import { parentPort, workerData } from 'node:worker_threads';

import type { ConvertedDatasetRecord, ImportedDatasetRecord } from './dataset-library';
import { validateDatasetSnapshot, validateSelectedSource } from './dataset-validator';
import type { SelectedSource } from './source-selections';

type ValidationWorkerData =
  | { kind: 'dataset'; dataset: ImportedDatasetRecord | ConvertedDatasetRecord }
  | { kind: 'import-source'; source: SelectedSource; fifaVersion: number };

const run = async (): Promise<void> => {
  try {
    const data = workerData as ValidationWorkerData;
    const result =
      data.kind === 'dataset'
        ? await validateDatasetSnapshot(data.dataset)
        : await validateSelectedSource(data.source, data.fifaVersion);
    parentPort?.postMessage({ type: 'completed', result });
  } catch (error) {
    parentPort?.postMessage({
      type: 'failed',
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

void run();
