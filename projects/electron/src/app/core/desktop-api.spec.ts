import { TestBed } from '@angular/core/testing';
import type { QdbConverterApi } from '../../../shared/contracts';
import { DesktopApi } from './desktop-api';

describe('DesktopApi', () => {
  it('exposes every narrow preload capability', async () => {
    const fake = Object.fromEntries(
      [
        'listImportedDatasets',
        'validateDataset',
        'validateImportSource',
        'selectTextSources',
        'selectT3dbDatabaseFile',
        'selectT3dbMetadataFile',
        'prepareT3dbSource',
        'importDatasets',
        'cancelImport',
        'renameImportedDataset',
        'removeImportedDataset',
        'removeImportedDatasets',
        'removeAllDatasets',
        'listConvertedDatasets',
        'createConvertedDataset',
        'cancelConversion',
        'renameConvertedDataset',
        'removeConvertedDataset',
        'removeConvertedDatasets',
        'selectExportDirectory',
        'exportDataset',
        'revealExport',
      ].map((name) => [name, vi.fn(async () => undefined)]),
    ) as unknown as QdbConverterApi;
    fake.onImportProgress = vi.fn(() => () => undefined);
    fake.onConversionProgress = vi.fn(() => () => undefined);
    window.qdbConverter = fake;
    TestBed.configureTestingModule({});
    const service = TestBed.inject(DesktopApi);
    const sourceDatasetId = '11111111-1111-4111-8111-111111111111';
    const convertedDatasetId = '33333333-3333-4333-8333-333333333333';
    const request = {
      requestId: '22222222-2222-4222-8222-222222222222',
      sourceDatasetId,
      targetVersion: 23,
      name: 'Converted',
    };
    await service.listImportedDatasets();
    await service.validateDataset({ datasetKind: 'imported', datasetId: sourceDatasetId });
    await service.validateImportSource({ selectionId: 'selection', fifaVersion: 23 });
    await service.selectTextSources();
    await service.selectT3dbDatabaseFile();
    await service.selectT3dbMetadataFile();
    await service.prepareT3dbSource({
      databaseFileId: 'database-file',
      metadataFileId: 'metadata-file',
    });
    await service.importDatasets([]);
    await service.cancelImport();
    await service.renameImportedDataset(sourceDatasetId, 'Name');
    await service.removeImportedDataset(sourceDatasetId);
    await service.removeImportedDatasets([sourceDatasetId]);
    await service.removeAllDatasets(['imported']);
    await service.listConvertedDatasets();
    await service.createConvertedDataset(request);
    await service.cancelConversion(request.requestId);
    await service.renameConvertedDataset(convertedDatasetId, 'Renamed');
    await service.removeConvertedDataset(convertedDatasetId);
    await service.removeConvertedDatasets([convertedDatasetId]);
    await service.selectExportDirectory();
    await service.exportDataset({
      datasetKind: 'converted',
      datasetId: convertedDatasetId,
      targetParentPath: '/output',
    });
    await service.revealExport('/output/export');
    service.onImportProgress(() => undefined)();
    service.onConversionProgress(() => undefined)();

    expect(fake.removeImportedDatasets).toHaveBeenCalledWith([sourceDatasetId]);
    expect(fake.removeAllDatasets).toHaveBeenCalledWith(['imported']);
    expect(fake.validateDataset).toHaveBeenCalledWith({
      datasetKind: 'imported',
      datasetId: sourceDatasetId,
    });
    expect(fake.createConvertedDataset).toHaveBeenCalledWith(request);
    expect(fake.removeConvertedDatasets).toHaveBeenCalledWith([convertedDatasetId]);
    expect(fake.exportDataset).toHaveBeenCalledWith({
      datasetKind: 'converted',
      datasetId: convertedDatasetId,
      targetParentPath: '/output',
    });
    expect(fake.revealExport).toHaveBeenCalledWith('/output/export');
  });

  it('fails safely when desktop operations are unavailable in a browser', () => {
    window.qdbConverter = undefined;
    const service = TestBed.inject(DesktopApi);
    expect(() => service.listImportedDatasets()).toThrow(/unavailable/);
    expect(service.onImportProgress(() => undefined)).toBeTypeOf('function');
    expect(service.onConversionProgress(() => undefined)).toBeTypeOf('function');
  });
});
