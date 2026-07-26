import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import type { DatasetDescriptor, QdbConverterApi } from '../../../../shared/contracts';
import { AppStore } from '../../core/app-store';

import { Convert } from './convert';

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
  tableNames: ['players', 'unknown'],
  tableCount: 2,
  rowCount: 1,
  warnings: [],
};

describe('Convert', () => {
  let component: Convert;
  let fixture: ComponentFixture<Convert>;

  beforeEach(async () => {
    window.qdbConverter = {
      listDatasets: vi.fn(async () => [dataset]),
      listConversions: vi.fn(async () => []),
      selectOutputDirectory: vi.fn(async () => '/output'),
      runConversion: vi.fn(async () => [
        {
          datasetId: dataset.id,
          status: 'completed' as const,
          outputPath: '/output/result',
          tables: [],
          warnings: [],
        },
      ]),
      cancelConversion: vi.fn(async () => true),
      onImportProgress: vi.fn(() => () => undefined),
      onConversionProgress: vi.fn(() => () => undefined),
    } as unknown as QdbConverterApi;
    await TestBed.configureTestingModule({
      imports: [Convert],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Convert);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the sibling-style numbered wizard shell', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('mat-card.wizard-card')).toBeTruthy();
    const stepper = element.querySelector('mat-stepper');
    expect(stepper?.classList.contains('qdb-wizard')).toBe(true);
    expect(stepper?.getAttribute('aria-label')).toBe('Dataset conversion wizard');
    expect(
      [...element.querySelectorAll('.mat-step-icon-content')].map((icon) => icon.textContent),
    ).toEqual(['1', '2', '3', '4']);
    expect(element.querySelectorAll('.step-actions')).toHaveLength(4);
  });

  it('selects compatible tables, output, and runs a batch', async () => {
    await TestBed.inject(AppStore).refresh();
    const controls = component as unknown as {
      toggleDataset(id: string, selected: boolean): void;
      setTarget(version: number): void;
      toggleTable(table: string, selected: boolean): void;
      chooseOutput(): Promise<void>;
      run(): Promise<void>;
      showHistory(): void;
      compatibleTables(): string[];
      selectedTables(): string[];
      outputParentPath(): string;
      resultMessages(): string[];
    };
    controls.toggleDataset(dataset.id, true);
    await Promise.resolve();
    expect(controls.compatibleTables()).toEqual(['players']);
    expect(controls.selectedTables()).toEqual(['players']);
    controls.setTarget(22);
    await Promise.resolve();
    controls.toggleTable('players', false);
    controls.toggleTable('players', true);
    await controls.chooseOutput();
    expect(controls.outputParentPath()).toBe('/output');
    await controls.run();
    expect(controls.resultMessages()[0]).toContain('/output/result');
    controls.toggleDataset(dataset.id, false);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate');
    controls.showHistory();
    expect(navigate).toHaveBeenCalledWith(['/conversions']);
  });

  it('cancels the active request and reports failed conversions', async () => {
    vi.mocked(window.qdbConverter!.runConversion).mockResolvedValueOnce([
      {
        datasetId: dataset.id,
        status: 'failed',
        tables: [],
        warnings: [],
        error: { code: 'conversion-failed', message: 'failed' },
      },
    ]);
    const controls = component as unknown as {
      toggleDataset(id: string, selected: boolean): void;
      chooseOutput(): Promise<void>;
      run(): Promise<void>;
      cancel(): void;
      runningRequestId: { set(value: string): void };
      resultMessages(): string[];
    };
    controls.toggleDataset(dataset.id, true);
    await controls.chooseOutput();
    await controls.run();
    expect(controls.resultMessages()).toEqual(['failed']);
    controls.runningRequestId.set('22222222-2222-4222-8222-222222222222');
    controls.cancel();
    expect(window.qdbConverter!.cancelConversion).toHaveBeenCalled();
  });
});
