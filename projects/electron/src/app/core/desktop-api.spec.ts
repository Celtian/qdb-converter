import { TestBed } from '@angular/core/testing';
import type { QdbConverterApi } from '../../../shared/contracts';
import { DesktopApi } from './desktop-api';

describe('DesktopApi', () => {
  it('exposes every narrow preload capability', async () => {
    const fake = Object.fromEntries(
      [
        'listDatasets',
        'selectTextSources',
        'selectT3dbSource',
        'importDatasets',
        'cancelImport',
        'renameDataset',
        'removeDataset',
        'selectOutputDirectory',
        'runConversion',
        'cancelConversion',
        'listConversions',
        'removeConversion',
        'revealOutput',
      ].map((name) => [name, vi.fn(async () => undefined)]),
    ) as unknown as QdbConverterApi;
    fake.onImportProgress = vi.fn(() => () => undefined);
    fake.onConversionProgress = vi.fn(() => () => undefined);
    window.qdbConverter = fake;
    TestBed.configureTestingModule({});
    const service = TestBed.inject(DesktopApi);
    const request = {
      requestId: '22222222-2222-4222-8222-222222222222',
      datasetIds: ['11111111-1111-4111-8111-111111111111'],
      targetVersion: 23,
      tables: ['players'],
      outputParentPath: '/output',
      extendContracts: false,
    };
    await service.listDatasets();
    await service.selectTextSources();
    await service.selectT3dbSource();
    await service.importDatasets([]);
    await service.cancelImport();
    await service.renameDataset(request.datasetIds[0]!, 'Name');
    await service.removeDataset(request.datasetIds[0]!);
    await service.selectOutputDirectory();
    await service.runConversion(request);
    await service.cancelConversion(request.requestId);
    await service.listConversions();
    await service.removeConversion(request.requestId);
    await service.revealOutput('/output');
    service.onImportProgress(() => undefined)();
    service.onConversionProgress(() => undefined)();
    expect(fake.revealOutput).toHaveBeenCalledWith('/output');
  });

  it('fails safely when desktop operations are unavailable in a browser', () => {
    window.qdbConverter = undefined;
    const service = TestBed.inject(DesktopApi);
    expect(() => service.listDatasets()).toThrow(/unavailable/);
    expect(service.onImportProgress(() => undefined)).toBeTypeOf('function');
    expect(service.onConversionProgress(() => undefined)).toBeTypeOf('function');
  });
});
