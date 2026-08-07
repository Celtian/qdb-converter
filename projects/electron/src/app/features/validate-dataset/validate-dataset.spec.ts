import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatAutocompleteHarness } from '@angular/material/autocomplete/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatRadioGroupHarness } from '@angular/material/radio/testing';

import axe from 'axe-core';

import type {
  ConvertedDatasetDescriptor,
  DatasetKind,
  DatasetValidationRequest,
  DatasetValidationResult,
  ImportedDatasetDescriptor,
  QdbConverterApi,
} from '../../../../shared/contracts';
import { AppStore } from '../../core/app-store';
import { ConfettiService } from '../../core/confetti/confetti.service';
import { ValidateDataset } from './validate-dataset';

const importedDataset: ImportedDatasetDescriptor = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Imported fixture',
  fifaVersion: 23,
  source: {
    kind: 'text-folder',
    originalPaths: ['/fixtures/imported'],
    hashes: {},
    importedAt: new Date(0).toISOString(),
  },
  managedFormat: 'text-folder',
  updatedAt: new Date(0).toISOString(),
  status: 'available',
  tableNames: ['players'],
  tableCount: 1,
  rowCount: 3,
  warnings: [],
};

const corruptImportedDataset: ImportedDatasetDescriptor = {
  ...importedDataset,
  id: '22222222-2222-4222-8222-222222222222',
  name: 'Missing imported snapshot',
  status: 'corrupt',
  error: 'The managed imported snapshot is missing.',
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

const validationResult = (datasetId: string): DatasetValidationResult => ({
  datasetId,
  validatedAt: new Date(2).toISOString(),
  tablesChecked: 1,
  rowsChecked: 3,
  errorCount: 0,
  warningCount: 0,
  errors: [],
  warnings: [],
});

describe('ValidateDataset', () => {
  let component: ValidateDataset;
  let celebrate: ReturnType<typeof vi.fn>;
  let fixture: ComponentFixture<ValidateDataset>;

  beforeEach(async () => {
    celebrate = vi.fn();
    window.qdbConverter = {
      listImportedDatasets: vi.fn(async () => [importedDataset, corruptImportedDataset]),
      listConvertedDatasets: vi.fn(async () => [convertedDataset]),
      validateDataset: vi.fn(async (request: DatasetValidationRequest) =>
        validationResult(request.datasetId),
      ),
      onImportProgress: vi.fn(() => () => undefined),
      onConversionProgress: vi.fn(() => () => undefined),
    } as unknown as QdbConverterApi;
    await TestBed.configureTestingModule({
      imports: [ValidateDataset],
      providers: [{ provide: ConfettiService, useValue: { celebrate } }],
    }).compileComponents();

    fixture = TestBed.createComponent(ValidateDataset);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('renders an accessible three-step validation wizard', async () => {
    const element = fixture.nativeElement as HTMLElement;
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const radioGroup = await loader.getHarness(MatRadioGroupHarness);

    expect(element.querySelector('mat-stepper')?.getAttribute('aria-label')).toBe(
      'Dataset validation wizard',
    );
    expect(
      [...element.querySelectorAll('.mat-step-icon-content')].map((icon) => icon.textContent),
    ).toEqual(['1', '2', '3']);
    expect(await radioGroup.getCheckedValue()).toBeNull();
    expect(element.textContent).toContain('Imported dataset');
    expect(element.textContent).toContain('Converted dataset');
    expect((await axe.run(element)).violations).toEqual([]);
  });

  it('includes corrupt datasets in the type-aware autocomplete', async () => {
    await TestBed.inject(AppStore).refresh();
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const radioGroup = await loader.getHarness(MatRadioGroupHarness);
    await radioGroup.checkRadioButton({ label: /Imported dataset/ });
    await fixture.whenStable();
    await (await loader.getHarness(MatButtonHarness.with({ text: 'Next' }))).click();

    const autocomplete = await loader.getHarness(MatAutocompleteHarness);
    await autocomplete.enterText('corrupt');
    const options = await autocomplete.getOptions();

    expect(options).toHaveLength(1);
    expect(await options[0]!.getText()).toContain('Missing imported snapshot');
    expect(await options[0]!.getText()).toContain('Corrupt');
  });

  it('shows guidance when the selected dataset library is empty', async () => {
    const controls = component as unknown as {
      selectDatasetKind(kind: DatasetKind): void;
    };
    const element = fixture.nativeElement as HTMLElement;

    controls.selectDatasetKind('imported');
    await fixture.whenStable();
    expect(element.textContent).toContain(
      'No imported datasets were found. Add one from the Import page first.',
    );

    controls.selectDatasetKind('converted');
    await fixture.whenStable();
    expect(element.textContent).toContain(
      'No converted datasets were found. Create one from the Convert page first.',
    );
  });

  it.each([
    ['imported', importedDataset],
    ['converted', convertedDataset],
  ] as const)(
    'automatically validates a selected %s dataset once',
    async (datasetKind, dataset) => {
      await TestBed.inject(AppStore).refresh();
      const controls = component as unknown as {
        selectDatasetKind(kind: DatasetKind): void;
        selectDataset(id: string): void;
        stepChanged(index: number): void;
        result(): DatasetValidationResult | undefined;
      };

      controls.selectDatasetKind(datasetKind);
      controls.selectDataset(dataset.id);
      controls.stepChanged(2);
      controls.stepChanged(2);
      await fixture.whenStable();

      expect(window.qdbConverter!.validateDataset).toHaveBeenCalledOnce();
      expect(window.qdbConverter!.validateDataset).toHaveBeenCalledWith({
        datasetKind,
        datasetId: dataset.id,
      });
      expect(controls.result()?.datasetId).toBe(dataset.id);
      expect(celebrate).toHaveBeenCalledOnce();
      expect((fixture.nativeElement as HTMLElement).textContent).toContain(
        'No validation issues were found',
      );
    },
  );

  it('runs a completed validation again on request', async () => {
    await TestBed.inject(AppStore).refresh();
    const controls = component as unknown as {
      selectDatasetKind(kind: DatasetKind): void;
      selectDataset(id: string): void;
      run(): Promise<void>;
    };
    controls.selectDatasetKind('imported');
    controls.selectDataset(importedDataset.id);
    await controls.run();
    await fixture.whenStable();

    const loader = TestbedHarnessEnvironment.loader(fixture);
    await (await loader.getHarness(MatButtonHarness.with({ text: 'Run again' }))).click();
    await fixture.whenStable();

    expect(window.qdbConverter!.validateDataset).toHaveBeenCalledTimes(2);
  });

  it('clears dataset and result state when the dataset kind changes', async () => {
    await TestBed.inject(AppStore).refresh();
    const controls = component as unknown as {
      selectDatasetKind(kind: DatasetKind): void;
      selectDataset(id: string): void;
      run(): Promise<void>;
      selectedDataset(): ImportedDatasetDescriptor | ConvertedDatasetDescriptor | undefined;
      datasetQuery(): string;
      result(): DatasetValidationResult | undefined;
    };

    controls.selectDatasetKind('imported');
    controls.selectDataset(importedDataset.id);
    await controls.run();
    expect(controls.result()).toBeDefined();

    controls.selectDatasetKind('converted');
    await fixture.whenStable();

    expect(controls.selectedDataset()).toBeUndefined();
    expect(controls.datasetQuery()).toBe('');
    expect(controls.result()).toBeUndefined();
  });

  it('shows worker failures and retries validation', async () => {
    vi.mocked(window.qdbConverter!.validateDataset)
      .mockRejectedValueOnce(new Error('Validation worker unavailable'))
      .mockResolvedValueOnce(validationResult(importedDataset.id));
    await TestBed.inject(AppStore).refresh();
    const controls = component as unknown as {
      selectDatasetKind(kind: DatasetKind): void;
      selectDataset(id: string): void;
      run(): Promise<void>;
    };
    controls.selectDatasetKind('imported');
    controls.selectDataset(importedDataset.id);

    await controls.run();
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Validation worker unavailable',
    );

    const loader = TestbedHarnessEnvironment.loader(fixture);
    await (await loader.getHarness(MatButtonHarness.with({ text: 'Try again' }))).click();
    await fixture.whenStable();

    expect(window.qdbConverter!.validateDataset).toHaveBeenCalledTimes(2);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'No validation issues were found',
    );
    expect((await axe.run(fixture.nativeElement as HTMLElement)).violations).toEqual([]);
  });
});
