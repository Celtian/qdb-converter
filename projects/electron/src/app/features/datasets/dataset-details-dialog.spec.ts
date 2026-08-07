import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import axe from 'axe-core';

import type {
  ImportedDatasetDescriptor,
  PlayernameIdProfile,
  QdbConverterApi,
} from '../../../../shared/contracts';
import { DatasetDetailsDialog } from './dataset-details-dialog';

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

const dataset: ImportedDatasetDescriptor = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Fixture',
  fifaVersion: 23,
  source: {
    kind: 't3db',
    originalPaths: ['/fixture/database.db', '/fixture/metadata.xml'],
    hashes: {},
    importedAt: new Date(0).toISOString(),
  },
  managedFormat: 't3db',
  updatedAt: new Date(0).toISOString(),
  status: 'available',
  tableNames: ['players', 'teams'],
  tableCount: 2,
  rowCount: 1_234,
  warnings: ['A source value was normalized.', 'An optional table was not present.'],
};

describe('DatasetDetailsDialog', () => {
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
          rows: table === 'players' ? 1_233 : 1,
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

  it('presents summary details, source paths, and warnings accessibly', async () => {
    const close = vi.fn();
    await TestBed.configureTestingModule({
      imports: [DatasetDetailsDialog],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: dataset },
        { provide: MatDialogRef, useValue: { close } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(DatasetDetailsDialog);
    const loader = TestbedHarnessEnvironment.loader(fixture);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const details = [...element.querySelectorAll('mat-dialog-content > dl dt')].map((term) => ({
      label: term.textContent?.trim(),
      value: term.nextElementSibling?.textContent?.trim(),
    }));

    expect(element.querySelector('h2')?.textContent).toContain(dataset.name);
    expect(element.querySelector('mat-dialog-content > dl')?.textContent).toContain('FIFA 23');
    expect(details).toContainEqual({ label: 'Tables', value: '2' });
    expect(details).toContainEqual({ label: 'Rows', value: '1,234' });
    expect(element.querySelector('time')?.getAttribute('datetime')).toBe(dataset.source.importedAt);
    expect(
      [...element.querySelectorAll('section[aria-labelledby="dataset-source-heading"] code')].map(
        (item) => item.textContent,
      ),
    ).toEqual(dataset.source.originalPaths);
    expect(
      element.querySelector('section[aria-labelledby$="warnings-heading"] ul')?.textContent,
    ).toContain(dataset.warnings[0]);
    expect(element.querySelectorAll('[data-table-id-analysis]')).toHaveLength(2);
    expect(element.querySelectorAll('app-dataset-id-range')).toHaveLength(2);
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

  it('shows the corruption error when the dataset is unavailable', async () => {
    await TestBed.configureTestingModule({
      imports: [DatasetDetailsDialog],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            ...dataset,
            status: 'corrupt',
            error: 'The managed source snapshot is missing.',
            warnings: [],
          } satisfies ImportedDatasetDescriptor,
        },
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(DatasetDetailsDialog);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector('section[aria-labelledby$="error-heading"]')?.textContent,
    ).toContain('The managed source snapshot is missing.');
    expect(element.querySelector('section[aria-labelledby$="warnings-heading"] ul')).toBeNull();
    expect(element.querySelector('button[aria-haspopup="dialog"]')?.textContent).toContain(
      'Rename',
    );
    expect((await axe.run(element)).violations).toEqual([]);
  });

  it('shows a text-managed t3db overwrite and its latest combined summary', async () => {
    await TestBed.configureTestingModule({
      imports: [DatasetDetailsDialog],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            ...dataset,
            managedFormat: 'text-folder',
            updatedAt: new Date(2).toISOString(),
            playernameSummary: {
              operations: { minimize: true, removeUnused: true },
              tables: [
                {
                  table: 'playernames',
                  beforeRows: 10,
                  afterRows: 7,
                  removedRows: 3,
                  beforeIdProfile: { ...idProfile, outOfRangeCount: 1 },
                  afterIdProfile: { ...idProfile, activeMax: 6, holeCount: 0 },
                },
              ],
              referencesUpdated: 4,
              totalRowsBefore: 10,
              totalRowsAfter: 7,
            },
          } satisfies ImportedDatasetDescriptor,
        },
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(DatasetDetailsDialog);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Managed format');
    expect(element.textContent).toContain('Text folder');
    expect(element.textContent).toContain('Remove unused names, then minimize ID holes');
    expect(element.textContent).toContain('10 name rows before · 7 after');
    expect(
      element.querySelectorAll(
        'section[aria-labelledby="imported-playername-details-heading"] app-dataset-id-range',
      ),
    ).toHaveLength(2);
    expect(
      element.querySelectorAll(
        'section[aria-labelledby="imported-playername-details-heading"] app-playername-id-lanes',
      ),
    ).toHaveLength(2);
    expect((await axe.run(element)).violations).toEqual([]);
  });
});
