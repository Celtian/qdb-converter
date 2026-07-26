import { TestBed } from '@angular/core/testing';
import type {
  ConversionRecord,
  DatasetDescriptor,
  DatasetImportResult,
  QdbConverterApi,
} from '../../../shared/contracts';
import { AppStore } from './app-store';

const dataset: DatasetDescriptor = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Fixture',
  fifaVersion: 23,
  source: {
    kind: 'text-folder',
    originalPaths: ['/fixture'],
    hashes: {},
    importedAt: new Date(0).toISOString(),
  },
  status: 'available',
  tableNames: ['players'],
  tableCount: 1,
  rowCount: 2,
  warnings: [],
};

const conversion: ConversionRecord = {
  id: '33333333-3333-4333-8333-333333333333',
  requestId: '22222222-2222-4222-8222-222222222222',
  datasetId: dataset.id,
  datasetName: dataset.name,
  sourceVersion: 23,
  targetVersion: 22,
  source: dataset.source,
  status: 'completed',
  outputPath: '/output',
  selectedTables: ['players'],
  tableSummaries: [],
  warnings: [],
  startedAt: new Date(0).toISOString(),
  completedAt: new Date(1).toISOString(),
  durationMs: 1,
};

const api = (): QdbConverterApi => ({
  listDatasets: vi.fn(async () => [dataset]),
  validateDataset: vi.fn(),
  validateImportSource: vi.fn(),
  selectTextSources: vi.fn(async () => []),
  selectT3dbDatabaseFile: vi.fn(async () => undefined),
  selectT3dbMetadataFile: vi.fn(async () => undefined),
  prepareT3dbSource: vi.fn(),
  importDatasets: vi.fn(
    async () =>
      [{ selectionId: 'selection', status: 'completed', dataset }] satisfies DatasetImportResult[],
  ),
  cancelImport: vi.fn(async () => true),
  renameDataset: vi.fn(async () => dataset),
  removeDataset: vi.fn(async () => true),
  removeDatasets: vi.fn(async () => 1),
  selectOutputDirectory: vi.fn(async () => '/output'),
  runConversion: vi.fn(async () => [
    {
      datasetId: dataset.id,
      status: 'completed' as const,
      tables: [],
      warnings: [],
    },
  ]),
  cancelConversion: vi.fn(async () => true),
  listConversions: vi.fn(async () => [conversion]),
  removeConversion: vi.fn(async () => true),
  revealOutput: vi.fn(async () => true),
  onImportProgress: vi.fn(() => () => undefined),
  onConversionProgress: vi.fn(() => () => undefined),
});

describe('AppStore', () => {
  let service: AppStore;
  let desktop: QdbConverterApi;

  beforeEach(() => {
    desktop = api();
    window.qdbConverter = desktop;
    TestBed.configureTestingModule({});
    service = TestBed.inject(AppStore);
  });

  it('loads catalog state and delegates dataset mutations', async () => {
    await service.refresh();
    expect(service.datasets()).toEqual([dataset]);
    expect(service.availableDatasets()).toEqual([dataset]);
    expect(service.conversions()).toEqual([conversion]);
    await service.importDatasets([{ selectionId: 'selection', name: 'Fixture', fifaVersion: 23 }]);
    await service.renameDataset(dataset.id, 'Renamed');
    await service.removeDataset(dataset.id);
    await service.removeDatasets([dataset.id]);
    expect(desktop.importDatasets).toHaveBeenCalled();
    expect(desktop.renameDataset).toHaveBeenCalled();
    expect(desktop.removeDatasets).toHaveBeenNthCalledWith(1, [dataset.id]);
    expect(desktop.removeDatasets).toHaveBeenNthCalledWith(2, [dataset.id]);
  });

  it('runs conversions and removes history entries', async () => {
    await service.runConversion({
      requestId: conversion.requestId,
      datasetIds: [dataset.id],
      targetVersion: 22,
      tables: ['players'],
      outputParentPath: '/output',
      extendContracts: false,
    });
    await service.removeConversion(conversion.id);
    expect(desktop.runConversion).toHaveBeenCalled();
    expect(desktop.removeConversion).toHaveBeenCalled();
  });

  it('reports desktop failures without leaving loading active', async () => {
    vi.mocked(desktop.listDatasets).mockRejectedValueOnce(new Error('offline'));
    await service.refresh();
    expect(service.error()).toBe('offline');
    expect(service.loading()).toBe(false);
  });

  it('reports batch deletion failures and leaves catalog state available', async () => {
    await service.refresh();
    vi.mocked(desktop.removeDatasets).mockRejectedValueOnce(new Error('delete failed'));

    await expect(service.removeDatasets([dataset.id])).resolves.toBe(false);

    expect(service.datasets()).toEqual([dataset]);
    expect(service.error()).toBe('delete failed');
    expect(service.loading()).toBe(false);
  });
});
