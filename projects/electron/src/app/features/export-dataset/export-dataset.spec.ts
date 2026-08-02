import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatAutocompleteHarness } from '@angular/material/autocomplete/testing';
import { MatRadioGroupHarness } from '@angular/material/radio/testing';

import axe from 'axe-core';

import type {
  ConvertedDatasetDescriptor,
  DatasetKind,
  ExportDatasetRequest,
  ImportedDatasetDescriptor,
  QdbConverterApi,
} from '../../../../shared/contracts';
import { AppStore } from '../../core/app-store';
import { ConfettiService } from '../../core/confetti/confetti.service';
import { ExportDataset } from './export-dataset';

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
  status: 'available',
  tableNames: ['players'],
  tableCount: 1,
  rowCount: 3,
  warnings: [],
};

const convertedDataset: ConvertedDatasetDescriptor = {
  id: '33333333-3333-4333-8333-333333333333',
  name: 'Fixture — FIFA 22',
  sourceDatasetId: importedDataset.id,
  sourceDatasetName: importedDataset.name,
  sourceVersion: 23,
  fifaVersion: 22,
  createdAt: new Date(1).toISOString(),
  status: 'available',
  tableNames: ['players'],
  tableCount: 1,
  rowCount: 2,
  tableSummaries: [],
  warnings: [],
};

describe('ExportDataset', () => {
  let component: ExportDataset;
  let celebrate: ReturnType<typeof vi.fn>;
  let fixture: ComponentFixture<ExportDataset>;

  beforeEach(async () => {
    celebrate = vi.fn();
    window.qdbConverter = {
      listImportedDatasets: vi.fn(async () => [importedDataset]),
      listConvertedDatasets: vi.fn(async () => [convertedDataset]),
      selectExportDirectory: vi.fn(async () => '/exports'),
      exportDataset: vi.fn(async (request: ExportDatasetRequest) => ({
        datasetId: request.datasetId,
        outputPath: `/exports/${request.datasetKind}-fixture-20260726T120000Z`,
      })),
      revealExport: vi.fn(async () => true),
      onImportProgress: vi.fn(() => () => undefined),
      onConversionProgress: vi.fn(() => () => undefined),
    } as unknown as QdbConverterApi;
    await TestBed.configureTestingModule({
      imports: [ExportDataset],
      providers: [{ provide: ConfettiService, useValue: { celebrate } }],
    }).compileComponents();

    fixture = TestBed.createComponent(ExportDataset);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('renders an accessible three-step wizard that requires a dataset type', async () => {
    const element = fixture.nativeElement as HTMLElement;
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const radioGroup = await loader.getHarness(MatRadioGroupHarness);

    expect(element.querySelector('mat-stepper')?.getAttribute('aria-label')).toBe(
      'Dataset export wizard',
    );
    expect(
      [...element.querySelectorAll('.mat-step-icon-content')].map((icon) => icon.textContent),
    ).toEqual(['1', '2', '3']);
    expect(element.querySelector('mat-radio-group')?.getAttribute('aria-label')).toBe(
      'Dataset export type',
    );
    expect(await radioGroup.getCheckedValue()).toBeNull();
    expect(element.querySelector<HTMLButtonElement>('button[matsteppernext]')?.disabled).toBe(true);
    expect(element.textContent).toContain('Imported dataset');
    expect(element.textContent).toContain('Converted dataset');
    expect((await axe.run(element)).violations).toEqual([]);
  });

  it('selects an imported dataset from the type-aware autocomplete', async () => {
    await TestBed.inject(AppStore).refresh();
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const radioGroup = await loader.getHarness(MatRadioGroupHarness);

    await radioGroup.checkRadioButton({ label: /Imported dataset/ });
    await fixture.whenStable();
    element.querySelector<HTMLButtonElement>('button[matsteppernext]')?.click();
    await fixture.whenStable();

    const autocomplete = await loader.getHarness(MatAutocompleteHarness);

    await autocomplete.enterText('FIFA 23');
    await autocomplete.selectOption({ text: /Imported fixture/ });
    await fixture.whenStable();

    expect(await autocomplete.getValue()).toBe('Imported fixture');
    expect(element.querySelector('.selected-dataset')?.textContent).toContain(
      'FIFA 23 · 1 tables · 3 rows',
    );
    expect(element.querySelector('mat-label')?.textContent).toContain('Imported dataset');
  });

  it('shows guidance when the selected dataset library is empty', async () => {
    const controls = component as unknown as {
      selectDatasetKind(kind: DatasetKind): void;
    };
    const element = fixture.nativeElement as HTMLElement;

    controls.selectDatasetKind('imported');
    await fixture.whenStable();
    expect(element.textContent).toContain(
      'No imported datasets are available. Add one from the Import page first.',
    );

    controls.selectDatasetKind('converted');
    await fixture.whenStable();
    expect(element.textContent).toContain(
      'No converted datasets are available. Create one from the Convert page first.',
    );
  });

  it('clears dataset state but preserves the target folder when the type changes', async () => {
    await TestBed.inject(AppStore).refresh();
    const controls = component as unknown as {
      selectDatasetKind(kind: DatasetKind): void;
      selectDataset(id: string): void;
      chooseTargetFolder(): Promise<void>;
      export(): Promise<void>;
      selectedDataset(): ImportedDatasetDescriptor | ConvertedDatasetDescriptor | undefined;
      datasetQuery(): string;
      targetParentPath(): string;
      result(): { outputPath: string } | undefined;
    };

    controls.selectDatasetKind('imported');
    controls.selectDataset(importedDataset.id);
    await controls.chooseTargetFolder();
    await controls.export();
    expect(controls.result()).toBeDefined();

    controls.selectDatasetKind('converted');
    await fixture.whenStable();

    expect(controls.selectedDataset()).toBeUndefined();
    expect(controls.datasetQuery()).toBe('');
    expect(controls.targetParentPath()).toBe('/exports');
    expect(controls.result()).toBeUndefined();
  });

  it.each([
    ['imported', importedDataset],
    ['converted', convertedDataset],
  ] as const)('exports and reveals a selected %s dataset', async (datasetKind, dataset) => {
    await TestBed.inject(AppStore).refresh();
    const controls = component as unknown as {
      selectDatasetKind(kind: DatasetKind): void;
      selectDataset(id: string): void;
      chooseTargetFolder(): Promise<void>;
      export(): Promise<void>;
      reveal(): void;
      targetParentPath(): string;
      result(): { outputPath: string } | undefined;
    };

    controls.selectDatasetKind(datasetKind);
    controls.selectDataset(dataset.id);
    await controls.chooseTargetFolder();
    await fixture.whenStable();
    expect(controls.targetParentPath()).toBe('/exports');
    expect(
      (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('.target-picker input')
        ?.value,
    ).toBe('/exports');
    expect(
      (fixture.nativeElement as HTMLElement)
        .querySelector('.target-picker button')
        ?.getAttribute('aria-label'),
    ).toBe('Change target folder');
    await controls.export();
    await fixture.whenStable();
    expect(window.qdbConverter!.exportDataset).toHaveBeenCalledWith({
      datasetKind,
      datasetId: dataset.id,
      targetParentPath: '/exports',
    });
    expect(controls.result()?.outputPath).toContain('/exports/');
    expect(celebrate).toHaveBeenCalledOnce();
    controls.reveal();
    expect(window.qdbConverter!.revealExport).toHaveBeenCalledWith(
      `/exports/${datasetKind}-fixture-20260726T120000Z`,
    );
    expect((await axe.run(fixture.nativeElement as HTMLElement)).violations).toEqual([]);
  });
});
