import { parentPort, workerData } from 'node:worker_threads';

import { importDatasetSnapshot } from './dataset-importer';
import type { ImportedDatasetRecord } from './dataset-library';
import type { SelectedSource } from './source-selections';

interface ImportWorkerData {
  id: string;
  name: string;
  fifaVersion: number;
  source: SelectedSource;
  temporaryDirectory: string;
}

const run = async (): Promise<void> => {
  const data = workerData as ImportWorkerData;
  try {
    const record = await importDatasetSnapshot(
      data.id,
      data.name,
      data.fifaVersion,
      data.source,
      data.temporaryDirectory,
      (message) => parentPort?.postMessage({ type: 'progress', message }),
    );
    parentPort?.postMessage({ type: 'completed', record } satisfies {
      type: 'completed';
      record: ImportedDatasetRecord;
    });
  } catch (error) {
    parentPort?.postMessage({
      type: 'failed',
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

void run();
