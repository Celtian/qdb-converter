import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import type { ConversionRecord, QdbConverterApi } from '../../../../shared/contracts';
import { AppStore } from '../../core/app-store';

import { Conversions } from './conversions';

const record: ConversionRecord = {
  id: '33333333-3333-4333-8333-333333333333',
  requestId: '22222222-2222-4222-8222-222222222222',
  datasetId: '11111111-1111-4111-8111-111111111111',
  datasetName: 'Fixture',
  sourceVersion: 23,
  targetVersion: 22,
  source: {
    kind: 'text-folder',
    originalPaths: ['/fixture'],
    hashes: {},
    importedAt: new Date(0).toISOString(),
  },
  status: 'completed',
  outputPath: '/output/result',
  selectedTables: ['players'],
  tableSummaries: [],
  warnings: [],
  startedAt: new Date(0).toISOString(),
  completedAt: new Date(1).toISOString(),
  durationMs: 1,
};

describe('Conversions', () => {
  let component: Conversions;
  let fixture: ComponentFixture<Conversions>;

  beforeEach(async () => {
    window.qdbConverter = {
      listDatasets: vi.fn(async () => []),
      listConversions: vi.fn(async () => [record]),
      runConversion: vi.fn(async () => []),
      removeConversion: vi.fn(async () => true),
      revealOutput: vi.fn(async () => true),
      onImportProgress: vi.fn(() => () => undefined),
      onConversionProgress: vi.fn(() => () => undefined),
    } as unknown as QdbConverterApi;
    await TestBed.configureTestingModule({
      imports: [Conversions],
    }).compileComponents();

    fixture = TestBed.createComponent(Conversions);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('searches and operates on durable history', async () => {
    await TestBed.inject(AppStore).refresh();
    const controls = component as unknown as {
      setQuery(event: Event): void;
      reveal(value: ConversionRecord): void;
      retry(value: ConversionRecord): Promise<void>;
      remove(value: ConversionRecord): void;
      filtered(): ConversionRecord[];
    };
    const input = document.createElement('input');
    input.value = 'fixture';
    controls.setQuery({ target: input } as unknown as Event);
    expect(controls.filtered()).toEqual([record]);
    input.value = 'missing';
    controls.setQuery({ target: input } as unknown as Event);
    expect(controls.filtered()).toEqual([]);
    controls.reveal(record);
    await controls.retry(record);
    expect(window.qdbConverter!.revealOutput).toHaveBeenCalledWith('/output/result');
    expect(window.qdbConverter!.runConversion).toHaveBeenCalled();

    const open = vi
      .spyOn(TestBed.inject(MatDialog), 'open')
      .mockReturnValue({ afterClosed: () => of(true) } as never);
    controls.remove(record);
    await Promise.resolve();
    expect(open).toHaveBeenCalled();
    await controls.retry({ ...record, outputPath: undefined });
    controls.reveal({ ...record, outputPath: undefined });
  });
});
