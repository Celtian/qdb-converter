import { parentPort, workerData } from 'node:worker_threads';

import { inspectT3dbSource, inspectTextSource } from './source-inspection';

type InspectionWorkerData =
  { kind: 'text-folder'; paths: [string] } | { kind: 't3db'; paths: [string, string] };

const run = async (): Promise<void> => {
  try {
    const data = workerData as InspectionWorkerData;
    const inspection =
      data.kind === 'text-folder'
        ? await inspectTextSource(data.paths[0])
        : await inspectT3dbSource(data.paths[0], data.paths[1]);
    parentPort?.postMessage({ type: 'completed', inspection });
  } catch (error) {
    parentPort?.postMessage({
      type: 'failed',
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

void run();
