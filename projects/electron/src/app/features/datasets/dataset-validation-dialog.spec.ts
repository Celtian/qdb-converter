import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import axe from 'axe-core';
import type {
  DatasetDescriptor,
  DatasetValidationResult,
  QdbConverterApi,
} from '../../../../shared/contracts';
import { DatasetValidationDialog } from './dataset-validation-dialog';

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
  rowCount: 3,
  warnings: [],
};

const validation: DatasetValidationResult = {
  datasetId: dataset.id,
  validatedAt: new Date(1).toISOString(),
  tablesChecked: 1,
  rowsChecked: 3,
  errorCount: 0,
  warningCount: 3,
  errors: [],
  warnings: [
    {
      table: 'players',
      field: 'playerid',
      message: 'Value is outside the published range 0–300000.',
      occurrences: 3,
      samples: [
        { row: 1, value: 300001 },
        { row: 2, value: 300002 },
      ],
    },
  ],
};

describe('DatasetValidationDialog', () => {
  it('loads and presents grouped validation results accessibly', async () => {
    window.qdbConverter = {
      validateDataset: vi.fn(async () => validation),
    } as unknown as QdbConverterApi;
    await TestBed.configureTestingModule({
      imports: [DatasetValidationDialog],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: dataset },
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(DatasetValidationDialog);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(window.qdbConverter.validateDataset).toHaveBeenCalledWith(dataset.id);
    expect(element.textContent).toContain('Dataset is ready to use');
    expect(element.textContent).toContain('0 blocking errors and 3 warnings found');
    expect(element.querySelector('summary')?.textContent).toContain('players.txt · playerid');
    expect(element.querySelector('.sample-note')?.textContent).toContain(
      'Showing the first 2 occurrences',
    );
    expect((await axe.run(element)).violations).toEqual([]);
  });

  it('shows failures and allows validation to be retried', async () => {
    window.qdbConverter = {
      validateDataset: vi
        .fn<() => Promise<DatasetValidationResult>>()
        .mockRejectedValueOnce(new Error('Snapshot unavailable'))
        .mockResolvedValueOnce({ ...validation, warningCount: 0, warnings: [] }),
    } as unknown as QdbConverterApi;
    await TestBed.configureTestingModule({
      imports: [DatasetValidationDialog],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: dataset },
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(DatasetValidationDialog);
    const loader = TestbedHarnessEnvironment.loader(fixture);
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Snapshot unavailable');
    await (await loader.getHarness(MatButtonHarness.with({ text: 'Try again' }))).click();
    await fixture.whenStable();

    expect(window.qdbConverter.validateDataset).toHaveBeenCalledTimes(2);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'No validation issues were found',
    );
  });
});
