import { TestBed } from '@angular/core/testing';

import type {
  ConvertedDatasetDescriptor,
  DatasetImportResult,
  ImportedDatasetDescriptor,
  QdbConverterApi,
} from '../../../shared/contracts';
import { AppStore } from './app-store';

const importedDataset: ImportedDatasetDescriptor = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Fixture',
  fifaVersion: 23,
  source: {
    kind: 'text-folder',
    originalPaths: ['/fixture'],
    hashes: {},
    importedAt: new Date(0).toISOString(),
  },
  managedFormat: 'text-folder',
  updatedAt: new Date(0).toISOString(),
  status: 'available',
  tableNames: ['players'],
  tableCount: 1,
  rowCount: 2,
  warnings: [],
};

const convertedDataset: ConvertedDatasetDescriptor = {
  id: '33333333-3333-4333-8333-333333333333',
  name: 'Fixture — FIFA 22',
  resultKind: 'conversion',
  sourceDatasetKind: 'imported',
  sourceDatasetId: importedDataset.id,
  sourceDatasetName: importedDataset.name,
  sourceVersion: 23,
  fifaVersion: 22,
  createdAt: new Date(1).toISOString(),
  updatedAt: new Date(1).toISOString(),
  status: 'available',
  tableNames: ['players'],
  tableCount: 1,
  rowCount: 2,
  tableSummaries: [],
  warnings: [],
};

const api = (): QdbConverterApi => ({
  listImportedDatasets: vi.fn(async () => [importedDataset]),
  validateDataset: vi.fn(),
  validateImportSource: vi.fn(),
  selectTextSources: vi.fn(async () => []),
  selectT3dbDatabaseFile: vi.fn(async () => undefined),
  selectT3dbMetadataFile: vi.fn(async () => undefined),
  prepareT3dbSource: vi.fn(),
  importDatasets: vi.fn(
    async () =>
      [
        { selectionId: 'selection', status: 'completed', dataset: importedDataset },
      ] satisfies DatasetImportResult[],
  ),
  cancelImport: vi.fn(async () => true),
  renameImportedDataset: vi.fn(async () => importedDataset),
  removeImportedDataset: vi.fn(async () => true),
  removeImportedDatasets: vi.fn(async () => 1),
  removeAllDatasets: vi.fn(async () => ({ imported: 1, converted: 0 })),
  listConvertedDatasets: vi.fn(async () => [convertedDataset]),
  createConvertedDataset: vi.fn(async () => ({
    sourceDatasetId: importedDataset.id,
    status: 'completed' as const,
    dataset: convertedDataset,
    tables: [],
    warnings: [],
  })),
  cancelConversion: vi.fn(async () => true),
  renameConvertedDataset: vi.fn(async () => convertedDataset),
  removeConvertedDataset: vi.fn(async () => true),
  removeConvertedDatasets: vi.fn(async () => 1),
  analyzeDatasetIds: vi.fn(async (request) => ({
    requestId: request.requestId,
    datasetId: request.datasetId,
    status: 'completed' as const,
    tables: [],
  })),
  cancelDatasetIdAnalysis: vi.fn(async () => true),
  analyzePlayernames: vi.fn(async (request) => ({
    requestId: request.requestId,
    datasetId: request.datasetId,
    status: 'completed' as const,
    tables: [],
  })),
  cancelPlayernameAnalysis: vi.fn(async () => true),
  runPlayername: vi.fn(async () => ({
    sourceDatasetId: importedDataset.id,
    status: 'completed' as const,
    dataset: convertedDataset,
  })),
  cancelPlayername: vi.fn(async () => true),
  selectExportDirectory: vi.fn(async () => '/output'),
  exportDataset: vi.fn(async () => ({
    datasetId: convertedDataset.id,
    outputPath: '/output/result',
  })),
  revealExport: vi.fn(async () => true),
  onImportProgress: vi.fn(() => () => undefined),
  onConversionProgress: vi.fn(() => () => undefined),
  onDatasetIdAnalysisProgress: vi.fn(() => () => undefined),
  onPlayernameAnalysisProgress: vi.fn(() => () => undefined),
  onPlayernameProgress: vi.fn(() => () => undefined),
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

  it('loads both catalogs and delegates imported-dataset mutations', async () => {
    await service.refresh();
    expect(service.importedDatasets()).toEqual([importedDataset]);
    expect(service.availableImportedDatasets()).toEqual([importedDataset]);
    expect(service.convertedDatasets()).toEqual([convertedDataset]);
    await service.importDatasets([{ selectionId: 'selection', name: 'Fixture', fifaVersion: 23 }]);
    await service.renameImportedDataset(importedDataset.id, 'Renamed');
    await service.removeImportedDataset(importedDataset.id);
    await service.removeImportedDatasets([importedDataset.id]);
    await service.removeAllDatasets(['imported']);
    expect(desktop.importDatasets).toHaveBeenCalled();
    expect(desktop.renameImportedDataset).toHaveBeenCalled();
    expect(desktop.removeImportedDatasets).toHaveBeenNthCalledWith(1, [importedDataset.id]);
    expect(desktop.removeImportedDatasets).toHaveBeenNthCalledWith(2, [importedDataset.id]);
    expect(desktop.removeAllDatasets).toHaveBeenCalledWith(['imported']);
  });

  it('creates, renames, removes, and exports converted datasets', async () => {
    await service.createConvertedDataset({
      requestId: '22222222-2222-4222-8222-222222222222',
      sourceDatasetId: importedDataset.id,
      targetVersion: 22,
      name: convertedDataset.name,
    });
    await service.renameConvertedDataset(convertedDataset.id, 'Renamed');
    await service.removeConvertedDataset(convertedDataset.id);
    await service.removeConvertedDatasets([convertedDataset.id]);
    expect(await service.selectExportDirectory()).toBe('/output');
    expect(
      await service.exportDataset({
        datasetKind: 'converted',
        datasetId: convertedDataset.id,
        targetParentPath: '/output',
      }),
    ).toEqual({ datasetId: convertedDataset.id, outputPath: '/output/result' });
    service.revealExport('/output/result');
    service.cancelConversion('22222222-2222-4222-8222-222222222222');
    expect(desktop.createConvertedDataset).toHaveBeenCalled();
    expect(desktop.renameConvertedDataset).toHaveBeenCalled();
    expect(desktop.removeConvertedDatasets).toHaveBeenNthCalledWith(1, [convertedDataset.id]);
    expect(desktop.removeConvertedDatasets).toHaveBeenNthCalledWith(2, [convertedDataset.id]);
    expect(desktop.exportDataset).toHaveBeenCalledWith({
      datasetKind: 'converted',
      datasetId: convertedDataset.id,
      targetParentPath: '/output',
    });
    expect(desktop.revealExport).toHaveBeenCalled();
    expect(desktop.cancelConversion).toHaveBeenCalled();
  });

  it('reports desktop failures without leaving loading active', async () => {
    vi.mocked(desktop.listImportedDatasets).mockRejectedValueOnce(new Error('offline'));
    await service.refresh();
    expect(service.error()).toBe('offline');
    expect(service.loading()).toBe(false);
  });

  it('analyzes and cancels Playernames diagnostics independently', async () => {
    const request = {
      requestId: '22222222-2222-4222-8222-222222222222',
      datasetKind: 'imported' as const,
      datasetId: importedDataset.id,
    };

    await expect(service.analyzePlayernames(request)).resolves.toMatchObject({
      status: 'completed',
      datasetId: importedDataset.id,
    });
    await expect(service.cancelPlayernameAnalysis(request.requestId)).resolves.toBe(true);

    expect(desktop.analyzePlayernames).toHaveBeenCalledWith(request);
    expect(desktop.cancelPlayernameAnalysis).toHaveBeenCalledWith(request.requestId);
    expect(service.playernameAnalysisLoading()).toBe(false);
    expect(service.playernameAnalysisError()).toBe('');
  });

  it('retains catalog state after imported deletion failures', async () => {
    await service.refresh();
    vi.mocked(desktop.removeImportedDatasets).mockRejectedValueOnce(new Error('delete failed'));

    await expect(service.removeImportedDatasets([importedDataset.id])).resolves.toBe(false);

    expect(service.importedDatasets()).toEqual([importedDataset]);
    expect(service.error()).toBe('delete failed');
    expect(service.loading()).toBe(false);
  });

  it('retains catalog state after converted deletion failures', async () => {
    await service.refresh();
    vi.mocked(desktop.removeConvertedDatasets).mockRejectedValueOnce(new Error('delete failed'));

    await expect(service.removeConvertedDatasets([convertedDataset.id])).resolves.toBe(false);

    expect(service.convertedDatasets()).toEqual([convertedDataset]);
    expect(service.error()).toBe('delete failed');
    expect(service.loading()).toBe(false);
  });
});
