import type { IpcMainInvokeEvent } from 'electron';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  clearDatasetImportSelections,
  configureDatasetImportHandlers,
  importDatasets,
  selectTextSources,
  validateImportSource,
} from './dataset-import-handlers';
import type { ImportedDatasetRecord } from './dataset-library';

interface WorkerOptions {
  workerData?: unknown;
}

interface WorkerMock {
  readonly filename: string;
  readonly options?: WorkerOptions;
  emit(event: string, value: unknown): void;
}

const electronMocks = vi.hoisted(() => ({
  showOpenDialog: vi.fn(),
  showMessageBox: vi.fn(),
}));

const workerMocks = vi.hoisted(() => ({
  instances: [] as WorkerMock[],
}));

vi.mock('electron', () => ({
  BrowserWindow: { fromWebContents: vi.fn(() => undefined) },
  dialog: electronMocks,
}));

vi.mock('node:worker_threads', () => {
  class Worker implements WorkerMock {
    private readonly listeners = new Map<string, ((value: never) => void)[]>();

    constructor(
      readonly filename: string,
      readonly options?: WorkerOptions,
    ) {
      workerMocks.instances.push(this);
    }

    once(event: string, listener: (value: never) => void): this {
      return this.addListener(event, listener);
    }

    on(event: string, listener: (value: never) => void): this {
      return this.addListener(event, listener);
    }

    emit(event: string, value: unknown): void {
      for (const listener of this.listeners.get(event) ?? []) listener(value as never);
    }

    async terminate(): Promise<number> {
      return 0;
    }

    private addListener(event: string, listener: (value: never) => void): this {
      const listeners = this.listeners.get(event) ?? [];
      listeners.push(listener);
      this.listeners.set(event, listeners);
      return this;
    }
  }

  return { Worker };
});

const event = {
  senderFrame: { url: 'file:///app/index.html' },
  sender: { send: vi.fn() },
} as unknown as IpcMainInvokeEvent;

const waitForWorker = async (index: number): Promise<WorkerMock> => {
  await vi.waitFor(() => expect(workerMocks.instances.length).toBeGreaterThan(index));
  return workerMocks.instances[index]!;
};

describe('dataset import worker paths', () => {
  beforeEach(() => {
    workerMocks.instances.length = 0;
    electronMocks.showOpenDialog.mockReset();
    electronMocks.showMessageBox.mockReset();
    clearDatasetImportSelections();
    configureDatasetImportHandlers(
      {
        lastImportDirectory: vi.fn(() => undefined),
        rememberImportDirectory: vi.fn(),
        ensureUniqueImportedName: vi.fn((name: string) => name),
        importedTemporaryDirectory: vi.fn((id: string) => `/managed/${id}.importing`),
        discardImportedTemporary: vi.fn(),
        installImported: vi.fn((record: ImportedDatasetRecord) => record),
      } as never,
      () => undefined,
    );
  });

  it('starts inspection, validation, and import workers beside the compiled handler', async () => {
    electronMocks.showOpenDialog.mockResolvedValue({
      canceled: false,
      filePaths: ['/source/fifa16'],
    });

    const selectionPromise = selectTextSources(event);
    const inspectionWorker = await waitForWorker(0);
    inspectionWorker.emit('message', {
      type: 'completed',
      inspection: {
        suggestedName: 'fifa16',
        sourceKind: 'text-folder',
        originalPaths: ['/source/fifa16'],
        detectedVersion: 16,
        matchingVersions: [16],
        tables: [{ table: 'players', rows: 1 }],
        warnings: [],
      },
    });
    const [selection] = await selectionPromise;
    expect(selection).toBeDefined();

    const validationPromise = validateImportSource(event, {
      selectionId: selection!.selectionId,
      fifaVersion: 16,
    });
    const validationWorker = await waitForWorker(1);
    validationWorker.emit('message', {
      type: 'completed',
      result: {
        selectionId: selection!.selectionId,
        validatedAt: new Date(0).toISOString(),
        tablesChecked: 1,
        rowsChecked: 1,
        errorCount: 0,
        warningCount: 0,
        errors: [],
        warnings: [],
      },
    });
    await validationPromise;

    const importPromise = importDatasets(event, [
      { selectionId: selection!.selectionId, name: 'FIFA 16', fifaVersion: 16 },
    ]);
    const importWorker = await waitForWorker(2);
    const importData = importWorker.options!.workerData as {
      id: string;
      temporaryDirectory: string;
    };
    const record: ImportedDatasetRecord = {
      id: importData.id,
      name: 'FIFA 16',
      fifaVersion: 16,
      source: {
        kind: 'text-folder',
        originalPaths: ['/source/fifa16'],
        hashes: {},
        importedAt: new Date(0).toISOString(),
      },
      managedFormat: 'text-folder',
      updatedAt: new Date(0).toISOString(),
      status: 'available',
      tableNames: ['players'],
      tableCount: 1,
      rowCount: 1,
      warnings: [],
      snapshotDirectory: importData.temporaryDirectory,
    };
    importWorker.emit('message', { type: 'completed', record });

    await expect(importPromise).resolves.toMatchObject([{ status: 'completed' }]);
    expect(workerMocks.instances.map((worker) => worker.filename)).toEqual([
      join(__dirname, 'inspection-worker.js'),
      join(__dirname, 'validation-worker.js'),
      join(__dirname, 'import-worker.js'),
    ]);
  });
});
