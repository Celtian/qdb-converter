import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import axe from 'axe-core';

import type {
  ConvertedDatasetDescriptor,
  PlayernameIdProfile,
  QdbConverterApi,
} from '../../../../shared/contracts';
import { ConvertedDatasetDetailsDialog } from './converted-dataset-details-dialog';

const idProfile: PlayernameIdProfile = {
  rangeMin: 0,
  rangeMax: 49_999,
  activeMax: 9,
  occupiedIds: [0, 1, 2, 4, 6, 8, 9],
  occupiedCount: 7,
  holeCount: 3,
  capacityCount: 49_990,
  outOfRangeCount: 0,
  belowRange: { count: 0, samples: [] },
  aboveRange: { count: 0, samples: [] },
  buckets: Array.from({ length: 256 }, () => ({
    start: 0,
    end: 0,
    occupied: 0,
    holes: 0,
    capacity: 0,
  })),
};

const dataset: ConvertedDatasetDescriptor = {
  id: '33333333-3333-4333-8333-333333333333',
  name: 'Fixture — FIFA 22',
  resultKind: 'conversion',
  sourceDatasetKind: 'imported',
  sourceDatasetId: '11111111-1111-4111-8111-111111111111',
  sourceDatasetName: 'Fixture',
  sourceVersion: 23,
  fifaVersion: 22,
  createdAt: new Date(1).toISOString(),
  updatedAt: new Date(1).toISOString(),
  status: 'available',
  tableNames: ['players', 'teams'],
  tableCount: 2,
  rowCount: 1_235,
  tableSummaries: [
    {
      table: 'players',
      rows: 1_234,
      defaultSubstitutions: 2,
      ratingDifferences: 3,
      warnings: ['A player value used its target-version default.'],
    },
    {
      table: 'teams',
      rows: 1,
      defaultSubstitutions: 0,
      ratingDifferences: 0,
      warnings: [],
    },
  ],
  warnings: ['One source field was not available in the target version.'],
};

describe('ConvertedDatasetDetailsDialog', () => {
  afterEach(() => {
    window.qdbConverter = undefined;
  });

  beforeEach(() => {
    window.qdbConverter = {
      analyzeDatasetIds: vi.fn(async (request) => ({
        requestId: request.requestId,
        datasetId: request.datasetId,
        status: 'completed',
        tables: dataset.tableNames.map((table) => ({
          table,
          rows: dataset.tableSummaries.find((summary) => summary.table === table)?.rows ?? 0,
          keyField: table + 'id',
          profile: idProfile,
          duplicateCount: 0,
          duplicateSamples: [],
          invalidCount: 0,
          invalidSamples: [],
        })),
      })),
      cancelDatasetIdAnalysis: vi.fn(async () => true),
      onDatasetIdAnalysisProgress: vi.fn(() => () => undefined),
    } as unknown as QdbConverterApi;
  });

  it('presents conversion metadata, table statistics, and warnings accessibly', async () => {
    const close = vi.fn();
    await TestBed.configureTestingModule({
      imports: [ConvertedDatasetDetailsDialog],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: dataset },
        { provide: MatDialogRef, useValue: { close } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ConvertedDatasetDetailsDialog);
    const loader = TestbedHarnessEnvironment.loader(fixture);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const details = [...element.querySelectorAll('mat-dialog-content > dl dt')].map((term) => ({
      label: term.textContent?.trim(),
      value: term.nextElementSibling?.textContent?.trim(),
    }));
    const tableSummaries = element.querySelectorAll('[data-table-id-analysis]');

    expect(element.querySelector('h2')?.textContent).toContain(dataset.name);
    expect(details).toContainEqual({ label: 'Source dataset', value: 'Fixture' });
    expect(details).toContainEqual({ label: 'Source version', value: 'FIFA 23' });
    expect(details).toContainEqual({ label: 'Target version', value: 'FIFA 22' });
    expect(details).toContainEqual({ label: 'Tables', value: '2' });
    expect(details).toContainEqual({ label: 'Rows', value: '1,235' });
    expect(element.querySelector('time')?.getAttribute('datetime')).toBe(dataset.createdAt);
    expect(tableSummaries).toHaveLength(2);
    expect(tableSummaries[0]?.textContent).toContain('players');
    expect(tableSummaries[0]?.textContent).toContain('1,234');
    expect(tableSummaries[0]?.textContent).toContain('Default substitutions');
    expect(tableSummaries[0]?.textContent).toContain('2');
    expect(tableSummaries[0]?.textContent).toContain('Rating differences');
    expect(tableSummaries[0]?.textContent).toContain('3');
    expect(tableSummaries[0]?.textContent).toContain(dataset.tableSummaries[0]!.warnings[0]);
    expect(element.querySelectorAll('app-dataset-id-range')).toHaveLength(2);
    expect(element.querySelector('#converted-dataset-warnings-heading')?.textContent).toContain(
      'Conversion warning (1)',
    );
    expect(element.textContent).toContain(dataset.warnings[0]);
    expect((await axe.run(element)).violations).toEqual([]);

    const renameButton = await loader.getHarness(MatButtonHarness.with({ text: 'Rename' }));
    expect(await renameButton.getAppearance()).toBe('filled');
    expect(await (await renameButton.host()).getAttribute('aria-haspopup')).toBe('dialog');
    await renameButton.click();
    expect(close).toHaveBeenLastCalledWith('rename');

    close.mockClear();
    await (await loader.getHarness(MatButtonHarness.with({ text: 'Close' }))).click();
    expect(close).toHaveBeenLastCalledWith(undefined);
  });

  it('shows conversion statistics and the latest combined Playernames overwrite together', async () => {
    await TestBed.configureTestingModule({
      imports: [ConvertedDatasetDetailsDialog],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            ...dataset,
            resultKind: 'playernames-combined',
            updatedAt: new Date(2).toISOString(),
            playernameSummary: {
              operations: { minimize: true, removeUnused: true },
              tables: [
                {
                  table: 'playernames',
                  beforeRows: 10,
                  afterRows: 7,
                  removedRows: 3,
                  minBefore: 4,
                  maxBefore: 20,
                  minAfter: 0,
                  maxAfter: 6,
                  beforeIdProfile: { ...idProfile, outOfRangeCount: 1 },
                  afterIdProfile: { ...idProfile, activeMax: 6, holeCount: 0 },
                },
              ],
              referencesUpdated: 4,
              totalRowsBefore: 10,
              totalRowsAfter: 7,
            },
          } satisfies ConvertedDatasetDescriptor,
        },
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ConvertedDatasetDetailsDialog);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Table conversion details and ID health');
    expect(element.textContent).toContain('Playernames details');
    expect(element.textContent).toContain('Remove unused names, then minimize ID holes');
    expect(element.textContent).toContain('3 unused rows removed');
    expect(
      element.querySelectorAll(
        'section[aria-labelledby="playername-table-details-heading"] app-dataset-id-range',
      ),
    ).toHaveLength(2);
    expect(
      element.querySelectorAll(
        'section[aria-labelledby="playername-table-details-heading"] app-playername-id-union',
      ),
    ).toHaveLength(2);
    expect(element.textContent).toContain('Playernames IDs before');
    expect(element.textContent).toContain('Playernames IDs after');
    expect((await axe.run(element)).violations).toEqual([]);
  });

  it('shows an error and table-name fallback for older converted datasets', async () => {
    await TestBed.configureTestingModule({
      imports: [ConvertedDatasetDetailsDialog],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            ...dataset,
            status: 'corrupt',
            error: 'The managed converted snapshot is missing.',
            tableSummaries: [],
            warnings: [],
          } satisfies ConvertedDatasetDescriptor,
        },
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ConvertedDatasetDetailsDialog);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector('section[aria-labelledby="converted-dataset-error-heading"]')
        ?.textContent,
    ).toContain('The managed converted snapshot is missing.');
    expect(
      [...element.querySelectorAll('[data-table-id-analysis] h4')].map((item) => item.textContent),
    ).toEqual(dataset.tableNames);
    expect(element.querySelector('button[aria-haspopup="dialog"]')?.textContent).toContain(
      'Rename',
    );
    expect((await axe.run(element)).violations).toEqual([]);
  });

  it('explains when no table details are available', async () => {
    vi.mocked(window.qdbConverter!.analyzeDatasetIds).mockImplementationOnce(async (request) => ({
      requestId: request.requestId,
      datasetId: request.datasetId,
      status: 'completed',
      tables: [],
    }));
    await TestBed.configureTestingModule({
      imports: [ConvertedDatasetDetailsDialog],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            ...dataset,
            tableNames: [],
            tableCount: 0,
            rowCount: 0,
            tableSummaries: [],
            warnings: [],
          } satisfies ConvertedDatasetDescriptor,
        },
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ConvertedDatasetDetailsDialog);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('No managed tables were recorded for this dataset.');
    expect(element.querySelector('[data-table-id-analysis]')).toBeNull();
    expect((await axe.run(element)).violations).toEqual([]);
  });
});
