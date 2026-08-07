import { TestBed } from '@angular/core/testing';

import axe from 'axe-core';

import type {
  DatasetIdProfile,
  DatasetTableIdAnalysis,
  QdbConverterApi,
} from '../../../../shared/contracts';
import { DatasetIdAnalysis } from './dataset-id-analysis';

const profile: DatasetIdProfile = {
  rangeMin: 0,
  rangeMax: 10,
  activeMax: 4,
  occupiedIds: [0, 2, 4, 12],
  occupiedCount: 3,
  holeCount: 2,
  capacityCount: 6,
  outOfRangeCount: 1,
  belowRange: { count: 0, samples: [] },
  aboveRange: { count: 1, min: 12, max: 12, samples: [12] },
  buckets: Array.from({ length: 256 }, () => ({
    start: 0,
    end: 0,
    occupied: 0,
    holes: 0,
    capacity: 0,
  })),
};

const analyses: DatasetTableIdAnalysis[] = [
  {
    table: 'players',
    rows: 5,
    keyField: 'playerid',
    profile,
    duplicateCount: 1,
    duplicateSamples: [4],
    invalidCount: 1,
    invalidSamples: [{ row: 5, value: 'bad' }],
  },
  {
    table: 'leaguerefereelinks',
    rows: 2,
    duplicateCount: 0,
    duplicateSamples: [],
    invalidCount: 0,
    invalidSamples: [],
    unavailableReason: 'No unique integer ID with a published range is defined for this table.',
  },
  {
    table: 'videos',
    rows: 8,
    duplicateCount: 0,
    duplicateSamples: [],
    invalidCount: 0,
    invalidSamples: [],
    unavailableReason: 'No unique integer ID with a published range is defined for this table.',
  },
];

const configureApi = (
  implementation: QdbConverterApi['analyzeDatasetIds'] = vi.fn(async (request) => ({
    requestId: request.requestId,
    datasetId: request.datasetId,
    status: 'completed' as const,
    tables: analyses,
  })),
): QdbConverterApi => {
  const api = {
    analyzeDatasetIds: implementation,
    cancelDatasetIdAnalysis: vi.fn(async () => true),
    onDatasetIdAnalysisProgress: vi.fn(() => () => undefined),
  } as unknown as QdbConverterApi;
  window.qdbConverter = api;
  return api;
};

describe('DatasetIdAnalysis', () => {
  afterEach(() => {
    window.qdbConverter = undefined;
  });

  it('analyzes on open and renders every table state accessibly', async () => {
    const api = configureApi();
    await TestBed.configureTestingModule({ imports: [DatasetIdAnalysis] }).compileComponents();
    const fixture = TestBed.createComponent(DatasetIdAnalysis);
    fixture.componentRef.setInput('datasetKind', 'converted');
    fixture.componentRef.setInput('datasetId', '33333333-3333-4333-8333-333333333333');
    fixture.componentRef.setInput('status', 'available');
    fixture.componentRef.setInput('tableNames', ['players', 'leaguerefereelinks', 'videos']);
    fixture.componentRef.setInput('conversionSummaries', [
      {
        table: 'players',
        rows: 5,
        defaultSubstitutions: 2,
        ratingDifferences: 1,
        warnings: [],
      },
    ]);
    await fixture.whenStable();
    await vi.waitFor(() => expect(api.analyzeDatasetIds).toHaveBeenCalledOnce());
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelectorAll('[data-table-id-analysis]')).toHaveLength(2);
    expect(element.querySelector('app-dataset-id-range')).not.toBeNull();
    expect(element.textContent).toContain('ID field playerid');
    expect(element.textContent).toContain('1 duplicate value');
    expect(element.textContent).toContain('row 5: bad');
    expect(element.textContent).toContain('No unique integer ID');
    expect(element.textContent).toContain('Default substitutions');
    expect(element.textContent).not.toContain('videos');
    expect((await axe.run(element)).violations).toEqual([]);
  });

  it('shows a retryable worker error and retries without removing table cards', async () => {
    const analyze = vi
      .fn<QdbConverterApi['analyzeDatasetIds']>()
      .mockRejectedValueOnce(new Error('Worker unavailable'))
      .mockImplementationOnce(async (request) => ({
        requestId: request.requestId,
        datasetId: request.datasetId,
        status: 'completed',
        tables: analyses,
      }));
    const api = configureApi(analyze);
    await TestBed.configureTestingModule({ imports: [DatasetIdAnalysis] }).compileComponents();
    const fixture = TestBed.createComponent(DatasetIdAnalysis);
    fixture.componentRef.setInput('datasetKind', 'imported');
    fixture.componentRef.setInput('datasetId', '11111111-1111-4111-8111-111111111111');
    fixture.componentRef.setInput('status', 'available');
    fixture.componentRef.setInput('tableNames', ['players', 'leaguerefereelinks', 'videos']);
    await fixture.whenStable();
    await vi.waitFor(() =>
      expect((fixture.nativeElement as HTMLElement).textContent).toContain('Worker unavailable'),
    );

    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button')?.click();
    await vi.waitFor(() => expect(api.analyzeDatasetIds).toHaveBeenCalledTimes(2));
    await fixture.whenStable();

    expect(
      (fixture.nativeElement as HTMLElement).querySelectorAll('[data-table-id-analysis]'),
    ).toHaveLength(2);
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('app-dataset-id-range'),
    ).not.toBeNull();
  });

  it('does not analyze corrupt datasets', async () => {
    const api = configureApi();
    await TestBed.configureTestingModule({ imports: [DatasetIdAnalysis] }).compileComponents();
    const fixture = TestBed.createComponent(DatasetIdAnalysis);
    fixture.componentRef.setInput('datasetKind', 'imported');
    fixture.componentRef.setInput('datasetId', '11111111-1111-4111-8111-111111111111');
    fixture.componentRef.setInput('status', 'corrupt');
    fixture.componentRef.setInput('tableNames', ['players', 'videos']);
    await fixture.whenStable();

    expect(api.analyzeDatasetIds).not.toHaveBeenCalled();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'managed dataset is not available',
    );
    expect(
      (fixture.nativeElement as HTMLElement).querySelectorAll('[data-table-id-analysis]'),
    ).toHaveLength(1);
  });
});
