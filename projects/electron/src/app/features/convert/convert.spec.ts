import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatAutocompleteHarness } from '@angular/material/autocomplete/testing';
import { provideRouter } from '@angular/router';

import axe from 'axe-core';

import type {
  ConvertedDatasetDescriptor,
  ImportedDatasetDescriptor,
  QdbConverterApi,
} from '../../../../shared/contracts';
import { AppStore } from '../../core/app-store';
import { ConfettiService } from '../../core/confetti/confetti.service';
import { Convert } from './convert';

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
  tableNames: ['players', 'unknown'],
  tableCount: 2,
  rowCount: 1,
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
  rowCount: 1,
  tableSummaries: [],
  warnings: [],
};

describe('Convert', () => {
  let component: Convert;
  let celebrate: ReturnType<typeof vi.fn>;
  let fixture: ComponentFixture<Convert>;

  beforeEach(async () => {
    celebrate = vi.fn();
    window.qdbConverter = {
      listImportedDatasets: vi.fn(async () => [importedDataset]),
      listConvertedDatasets: vi.fn(async () => []),
      createConvertedDataset: vi.fn(async (request) => ({
        sourceDatasetId: request.sourceDatasetId,
        status: 'completed',
        dataset: { ...convertedDataset, name: request.name, fifaVersion: request.targetVersion },
        tables: [],
        warnings: [],
      })),
      cancelConversion: vi.fn(async () => true),
      onImportProgress: vi.fn(() => () => undefined),
      onConversionProgress: vi.fn(() => () => undefined),
    } as unknown as QdbConverterApi;
    await TestBed.configureTestingModule({
      imports: [Convert],
      providers: [provideRouter([]), { provide: ConfettiService, useValue: { celebrate } }],
    }).compileComponents();

    fixture = TestBed.createComponent(Convert);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('renders an accessible three-step conversion wizard', async () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('section > mat-card')).toBeTruthy();
    expect(element.querySelector('mat-stepper')?.getAttribute('aria-label')).toBe(
      'Dataset conversion wizard',
    );
    expect(
      [...element.querySelectorAll('.mat-step-icon-content')].map((icon) => icon.textContent),
    ).toEqual(['1', '2', '3']);
    expect(
      element.querySelectorAll('button[matsteppernext], button[matstepperprevious]'),
    ).toHaveLength(4);
    expect((await axe.run(element)).violations).toEqual([]);
  });

  it('selects and clears an imported dataset with a filterable autocomplete', async () => {
    await TestBed.inject(AppStore).refresh();
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const autocomplete = await loader.getHarness(MatAutocompleteHarness);

    expect(element.querySelector('mat-radio-group')).toBeNull();
    await autocomplete.enterText('FIFA 23');
    await autocomplete.selectOption({ text: /Fixture/ });
    await fixture.whenStable();

    expect(await autocomplete.getValue()).toBe('Fixture');
    expect(element.querySelector('mat-stepper mat-card')?.textContent).toContain(
      'FIFA 23 · 2 tables · 1 rows',
    );
    expect(element.querySelector<HTMLButtonElement>('button[matsteppernext]')?.disabled).toBe(
      false,
    );

    await autocomplete.enterText('Missing dataset');
    await fixture.whenStable();

    expect(element.querySelector('mat-stepper mat-card')).toBeNull();
    expect(element.querySelector<HTMLButtonElement>('button[matsteppernext]')?.disabled).toBe(true);
  });

  it('disables the autocomplete and links to import when no datasets are available', async () => {
    vi.mocked(window.qdbConverter!.listImportedDatasets).mockResolvedValueOnce([]);
    await TestBed.inject(AppStore).refresh();
    await fixture.whenStable();
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const autocomplete = await loader.getHarness(MatAutocompleteHarness);
    const element = fixture.nativeElement as HTMLElement;

    expect(await autocomplete.isDisabled()).toBe(true);
    expect(element.querySelector('a[href="/import"]')?.textContent).toContain('Import dataset');
  });

  it('selects one imported dataset, suggests a unique name, and creates a managed dataset', async () => {
    await TestBed.inject(AppStore).refresh();
    const controls = component as unknown as {
      selectDataset(id: string): void;
      setTarget(version: number): void;
      create(): Promise<void>;
      compatibleTableCount(): number;
      nameModel(): { name: string };
      result(): { status: string; dataset?: ConvertedDatasetDescriptor } | undefined;
    };

    controls.selectDataset(importedDataset.id);
    controls.setTarget(22);
    expect(controls.compatibleTableCount()).toBe(1);
    expect(controls.nameModel().name).toBe('Fixture — FIFA 22');

    await controls.create();
    await fixture.whenStable();

    expect(window.qdbConverter!.createConvertedDataset).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceDatasetId: importedDataset.id,
        targetVersion: 22,
        name: 'Fixture — FIFA 22',
      }),
    );
    expect(controls.result()?.status).toBe('completed');
    expect(celebrate).toHaveBeenCalledOnce();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('a[href="/datasets"]')?.textContent,
    ).toContain('View datasets');
  });

  it('suffixes colliding suggestions and cancels an active conversion', async () => {
    vi.mocked(window.qdbConverter!.listConvertedDatasets).mockResolvedValueOnce([convertedDataset]);
    await TestBed.inject(AppStore).refresh();
    const controls = component as unknown as {
      selectDataset(id: string): void;
      setTarget(version: number): void;
      cancel(): void;
      runningRequestId: { set(value: string): void };
      nameModel(): { name: string };
    };

    controls.selectDataset(importedDataset.id);
    controls.setTarget(22);
    expect(controls.nameModel().name).toBe('Fixture — FIFA 22 (2)');

    controls.runningRequestId.set('22222222-2222-4222-8222-222222222222');
    controls.cancel();
    expect(window.qdbConverter!.cancelConversion).toHaveBeenCalledWith(
      '22222222-2222-4222-8222-222222222222',
    );
  });
});
