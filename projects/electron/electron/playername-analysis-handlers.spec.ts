import type { IpcMainInvokeEvent } from 'electron';
import { describe, expect, it, vi } from 'vitest';

import type { PlayernameTableAnalysis } from '../shared/contracts';
import type { DatasetLibrary, ImportedDatasetRecord } from './dataset-library';
import { analyzePlayernames, configurePlayernameHandlers } from './playername-handlers';

const workerMocks = vi.hoisted(() => ({
  instances: [] as {
    emit(event: string, value: unknown): void;
  }[],
}));

vi.mock('node:worker_threads', () => {
  class Worker {
    private readonly listeners = new Map<string, ((value: never) => void)[]>();

    constructor() {
      workerMocks.instances.push(this);
    }

    on(event: string, listener: (value: never) => void): this {
      const listeners = this.listeners.get(event) ?? [];
      listeners.push(listener);
      this.listeners.set(event, listeners);
      return this;
    }

    emit(event: string, value: unknown): void {
      for (const listener of this.listeners.get(event) ?? []) listener(value as never);
    }

    async terminate(): Promise<number> {
      return 0;
    }
  }
  return { Worker };
});

describe('Playername analysis handlers', () => {
  it('returns diagnostic tables from a failed analysis worker', async () => {
    const dataset: ImportedDatasetRecord = {
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Duplicate IDs',
      fifaVersion: 11,
      source: {
        kind: 'text-folder',
        originalPaths: ['/fixture'],
        hashes: {},
        importedAt: new Date(0).toISOString(),
      },
      managedFormat: 'text-folder',
      updatedAt: new Date(0).toISOString(),
      status: 'available',
      tableNames: ['players', 'playernames', 'dcplayernames'],
      tableCount: 3,
      rowCount: 3,
      warnings: [],
      snapshotDirectory: '/fixture',
    };
    const tables: PlayernameTableAnalysis[] = [
      {
        table: 'playernames',
        profile: {
          rangeMin: 0,
          rangeMax: 32_767,
          activeMax: 29_000,
          occupiedIds: [29_000],
          occupiedCount: 1,
          holeCount: 29_000,
          capacityCount: 3_767,
          outOfRangeCount: 0,
          belowRange: { count: 0, samples: [] },
          aboveRange: { count: 0, samples: [] },
          buckets: [],
        },
      },
    ];
    configurePlayernameHandlers({
      importedDataset: () => dataset,
    } as unknown as DatasetLibrary);
    const request = {
      requestId: '22222222-2222-4222-8222-222222222222',
      datasetKind: 'imported' as const,
      datasetId: dataset.id,
    };
    const resultPromise = analyzePlayernames(
      {
        senderFrame: { url: 'file:///app/index.html' },
        sender: { send: vi.fn() },
      } as unknown as IpcMainInvokeEvent,
      request,
    );

    workerMocks.instances.at(-1)!.emit('message', {
      type: 'failed',
      message: 'Name ID 29000 is duplicated in playernames and dcplayernames.',
      tables,
    });

    await expect(resultPromise).resolves.toMatchObject({
      status: 'failed',
      tables,
      error: {
        code: 'playername-failed',
        details: ['Name ID 29000 is duplicated in playernames and dcplayernames.'],
      },
    });
  });
});
