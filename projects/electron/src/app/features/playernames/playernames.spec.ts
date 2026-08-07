import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';

import axe from 'axe-core';
import { of } from 'rxjs';

import type {
  ConvertedDatasetDescriptor,
  DatasetKind,
  ImportedDatasetDescriptor,
  PlayernameIdProfile,
  PlayernameOperations,
  PlayernameRunRequest,
  PlayernameRunResult,
  QdbConverterApi,
} from '../../../../shared/contracts';
import { AppStore } from '../../core/app-store';
import { ConfettiService } from '../../core/confetti/confetti.service';
import { Playernames } from './playernames';

vi.mock('pixi.js', () => {
  class Graphics {
    clear(): this {
      return this;
    }
    destroy(): void {
      // Test double.
    }
    fill(): this {
      return this;
    }
    rect(): this {
      return this;
    }
    roundRect(): this {
      return this;
    }
    stroke(): this {
      return this;
    }
  }
  class Application {
    readonly canvas = document.createElement('canvas');
    readonly screen = { width: 800, height: 96 };
    readonly stage = { addChild: vi.fn() };
    async init(): Promise<void> {
      // Test double.
    }
    resize(): void {
      // Test double.
    }
    destroy(): void {
      // Test double.
    }
  }
  return { Application, Graphics };
});

const profile = (outOfRangeCount = 0, rangeMin = 0, rangeMax = 49_999): PlayernameIdProfile => ({
  rangeMin,
  rangeMax,
  activeMax: rangeMin + 20,
  occupiedIds: outOfRangeCount
    ? [rangeMin, rangeMin + 20, rangeMax + 2]
    : [rangeMin, rangeMin + 20],
  occupiedCount: 2,
  holeCount: 19,
  capacityCount: rangeMax - rangeMin - 20,
  outOfRangeCount,
  belowRange: { count: 0, samples: [] },
  aboveRange: {
    count: outOfRangeCount,
    min: outOfRangeCount ? rangeMax + 2 : undefined,
    max: outOfRangeCount ? rangeMax + 2 : undefined,
    samples: outOfRangeCount ? [rangeMax + 2] : [],
  },
  buckets: Array.from({ length: 256 }, (_, index) => ({
    start: index * 195,
    end: index === 255 ? 49_999 : (index + 1) * 195 - 1,
    occupied: index === 0 ? 2 : 0,
    holes: index === 0 ? 19 : 0,
    capacity: index === 0 ? 174 : index === 255 ? 275 : 195,
  })),
});

const imported: ImportedDatasetDescriptor = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Imported fixture',
  fifaVersion: 21,
  source: {
    kind: 'text-folder',
    originalPaths: ['/fixture'],
    hashes: {},
    importedAt: new Date(0).toISOString(),
  },
  managedFormat: 'text-folder',
  updatedAt: new Date(0).toISOString(),
  status: 'available',
  tableNames: ['players', 'playernames', 'dcplayernames'],
  tableCount: 3,
  rowCount: 6,
  warnings: [],
};

const converted: ConvertedDatasetDescriptor = {
  id: '22222222-2222-4222-8222-222222222222',
  name: 'Converted fixture',
  resultKind: 'conversion',
  sourceDatasetKind: 'imported',
  sourceDatasetId: imported.id,
  sourceDatasetName: imported.name,
  sourceVersion: 21,
  fifaVersion: 22,
  createdAt: new Date(1).toISOString(),
  updatedAt: new Date(1).toISOString(),
  status: 'available',
  tableNames: ['players', 'playernames', 'dcplayernames'],
  tableCount: 3,
  rowCount: 6,
  tableSummaries: [],
  warnings: [],
};

const completedResult = (request: PlayernameRunRequest): PlayernameRunResult => ({
  sourceDatasetId: request.datasetId,
  status: 'completed',
  dataset:
    request.output.kind === 'new-converted'
      ? {
          ...converted,
          id: '33333333-3333-4333-8333-333333333333',
          name: request.output.name,
          resultKind:
            request.operations.minimize && request.operations.removeUnused
              ? 'playernames-combined'
              : request.operations.minimize
                ? 'playernames-minimize'
                : 'playernames-remove-unused',
          sourceDatasetKind: request.datasetKind,
          sourceDatasetId: request.datasetId,
        }
      : request.datasetKind === 'imported'
        ? imported
        : converted,
  summary: {
    operations: request.operations,
    tables: [
      {
        table: 'playernames',
        beforeRows: 2,
        afterRows: 2,
        removedRows: 0,
        minBefore: 10,
        maxBefore: 20,
        minAfter: 0,
        maxAfter: 1,
        beforeIdProfile: profile(),
        afterIdProfile: {
          ...profile(),
          activeMax: 1,
          occupiedIds: [0, 1],
          holeCount: 0,
          capacityCount: 49_998,
        },
      },
      {
        table: 'dcplayernames',
        beforeRows: 2,
        afterRows: 2,
        removedRows: 0,
        minBefore: 50_000,
        maxBefore: 50_020,
        minAfter: 50_000,
        maxAfter: 50_020,
        beforeIdProfile: profile(0, 50_000, 55_999),
        afterIdProfile: profile(0, 50_000, 55_999),
      },
    ],
    referencesUpdated: 4,
    totalRowsBefore: 2,
    totalRowsAfter: 2,
  },
});

describe('Playernames', () => {
  let fixture: ComponentFixture<Playernames>;
  let celebrate: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    celebrate = vi.fn();
    window.qdbConverter = {
      listImportedDatasets: vi.fn(async () => [imported]),
      listConvertedDatasets: vi.fn(async () => [converted]),
      analyzePlayernames: vi.fn(async (request) => ({
        requestId: request.requestId,
        datasetId: request.datasetId,
        status: 'completed' as const,
        tables: [
          { table: 'playernames' as const, profile: profile() },
          { table: 'dcplayernames' as const, profile: profile(0, 50_000, 55_999) },
        ],
      })),
      cancelPlayernameAnalysis: vi.fn(async () => true),
      runPlayername: vi.fn(async (request: PlayernameRunRequest) => completedResult(request)),
      cancelPlayername: vi.fn(async () => true),
      onImportProgress: vi.fn(() => () => undefined),
      onConversionProgress: vi.fn(() => () => undefined),
      onPlayernameAnalysisProgress: vi.fn(() => () => undefined),
      onPlayernameProgress: vi.fn(() => () => undefined),
    } as unknown as QdbConverterApi;
    await TestBed.configureTestingModule({
      imports: [Playernames],
      providers: [provideRouter([]), { provide: ConfettiService, useValue: { celebrate } }],
    }).compileComponents();
    fixture = TestBed.createComponent(Playernames);
    await TestBed.inject(AppStore).refresh();
    await fixture.whenStable();
  });

  it('renders an accessible five-step wizard for both operations and destinations', async () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('mat-stepper')?.getAttribute('aria-label')).toBe(
      'Playernames dataset wizard',
    );
    expect([...element.querySelectorAll('.mat-step-icon-content')]).toHaveLength(5);
    expect(element.textContent).toContain('Imported dataset');
    expect(element.textContent).toContain('Converted dataset');
    expect((await axe.run(element)).violations).toEqual([]);
  });

  it('combines both available name tables into one current ID canvas', async () => {
    const controls = fixture.componentInstance as unknown as {
      selectDatasetKind(kind: DatasetKind): void;
      selectDataset(id: string): void;
    };
    controls.selectDatasetKind('imported');
    controls.selectDataset(imported.id);
    await vi.waitFor(() => expect(window.qdbConverter!.analyzePlayernames).toHaveBeenCalledOnce());
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    const union = element.querySelector('app-playername-id-union');
    expect(union).not.toBeNull();
    expect(union?.querySelectorAll('app-dataset-id-range')).toHaveLength(1);
    expect(union?.textContent).toContain('playernames');
    expect(union?.textContent).toContain('dcplayernames');
  });

  it('creates a separately named managed result and shows its summary', async () => {
    const controls = fixture.componentInstance as unknown as {
      selectDatasetKind(kind: DatasetKind): void;
      selectDataset(id: string): void;
      selectOperation(operation: keyof PlayernameOperations, checked: boolean): void;
      selectOutputKind(kind: 'overwrite' | 'new-converted'): void;
      run(): void;
    };
    controls.selectDatasetKind('imported');
    controls.selectDataset(imported.id);
    await vi.waitFor(() => expect(window.qdbConverter!.analyzePlayernames).toHaveBeenCalledOnce());
    await fixture.whenStable();
    controls.selectOperation('minimize', true);
    controls.selectOutputKind('new-converted');
    controls.run();

    await vi.waitFor(() => expect(window.qdbConverter!.runPlayername).toHaveBeenCalledOnce());
    await fixture.whenStable();

    expect(window.qdbConverter!.runPlayername).toHaveBeenCalledWith(
      expect.objectContaining({
        datasetKind: 'imported',
        datasetId: imported.id,
        operations: { minimize: true, removeUnused: false },
        output: { kind: 'new-converted', name: 'Imported fixture — Playernames minimized' },
      }),
    );
    expect(celebrate).toHaveBeenCalledOnce();
    const success = (fixture.nativeElement as HTMLElement).querySelector(
      'section[aria-labelledby="playernames-result-heading"]',
    );
    expect(success?.querySelectorAll('app-playername-id-union')).toHaveLength(2);
    expect(success?.querySelectorAll('app-playername-id-union app-dataset-id-range')).toHaveLength(
      2,
    );
  });

  it('confirms and overwrites a converted result after applying both operations', async () => {
    vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue({
      afterClosed: () => of(true),
    } as never);
    const controls = fixture.componentInstance as unknown as {
      selectDatasetKind(kind: DatasetKind): void;
      selectDataset(id: string): void;
      selectOperation(operation: keyof PlayernameOperations, checked: boolean): void;
      selectOutputKind(kind: 'overwrite' | 'new-converted'): void;
      run(): void;
    };
    controls.selectDatasetKind('converted');
    controls.selectDataset(converted.id);
    await vi.waitFor(() => expect(window.qdbConverter!.analyzePlayernames).toHaveBeenCalledOnce());
    await fixture.whenStable();
    controls.selectOperation('removeUnused', true);
    controls.selectOperation('minimize', true);
    controls.selectOutputKind('overwrite');
    controls.run();

    await vi.waitFor(() => expect(window.qdbConverter!.runPlayername).toHaveBeenCalledOnce());
    await fixture.whenStable();
    expect(window.qdbConverter!.runPlayername).toHaveBeenCalledWith(
      expect.objectContaining({
        datasetKind: 'converted',
        datasetId: converted.id,
        operations: { minimize: true, removeUnused: true },
        output: { kind: 'overwrite' },
      }),
    );
  });

  it('requires an operation and preserves the managed dataset when overwrite is cancelled', async () => {
    const open = vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue({
      afterClosed: () => of(false),
    } as never);
    const controls = fixture.componentInstance as unknown as {
      canRun(): boolean;
      selectDatasetKind(kind: DatasetKind): void;
      selectDataset(id: string): void;
      selectOperation(operation: keyof PlayernameOperations, checked: boolean): void;
      selectOutputKind(kind: 'overwrite' | 'new-converted'): void;
      run(): void;
    };
    controls.selectDatasetKind('imported');
    controls.selectDataset(imported.id);
    await vi.waitFor(() => expect(window.qdbConverter!.analyzePlayernames).toHaveBeenCalledOnce());
    await fixture.whenStable();
    controls.selectOutputKind('overwrite');
    expect(controls.canRun()).toBe(false);

    controls.selectOperation('removeUnused', true);
    expect(controls.canRun()).toBe(true);
    controls.run();
    await fixture.whenStable();

    expect(open).toHaveBeenCalledOnce();
    expect(window.qdbConverter!.runPlayername).not.toHaveBeenCalled();
  });

  it('requires Minimize when analysis finds out-of-range IDs', async () => {
    vi.mocked(window.qdbConverter!.analyzePlayernames).mockImplementationOnce(async (request) => ({
      requestId: request.requestId,
      datasetId: request.datasetId,
      status: 'completed',
      tables: [{ table: 'playernames', profile: profile(1) }],
    }));
    const controls = fixture.componentInstance as unknown as {
      canRun(): boolean;
      selectDatasetKind(kind: DatasetKind): void;
      selectDataset(id: string): void;
      selectOperation(operation: keyof PlayernameOperations, checked: boolean): void;
      selectOutputKind(kind: 'overwrite' | 'new-converted'): void;
    };
    controls.selectDatasetKind('imported');
    controls.selectDataset(imported.id);
    await vi.waitFor(() => expect(window.qdbConverter!.analyzePlayernames).toHaveBeenCalledOnce());
    await fixture.whenStable();
    controls.selectOperation('removeUnused', true);
    controls.selectOutputKind('overwrite');
    expect(controls.canRun()).toBe(false);

    controls.selectOperation('minimize', true);
    expect(controls.canRun()).toBe(true);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'IDs are outside their published FIFA range',
    );
  });

  it('ignores stale analysis when the selected dataset changes', async () => {
    let resolveFirst!: (result: Awaited<ReturnType<QdbConverterApi['analyzePlayernames']>>) => void;
    vi.mocked(window.qdbConverter!.analyzePlayernames)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockImplementationOnce(async (request) => ({
        requestId: request.requestId,
        datasetId: request.datasetId,
        status: 'completed',
        tables: [{ table: 'playernames', profile: profile() }],
      }));
    const controls = fixture.componentInstance as unknown as {
      outOfRangeCount(): number;
      selectDatasetKind(kind: DatasetKind): void;
      selectDataset(id: string): void;
    };

    controls.selectDatasetKind('imported');
    controls.selectDataset(imported.id);
    await vi.waitFor(() => expect(window.qdbConverter!.analyzePlayernames).toHaveBeenCalledOnce());
    controls.selectDatasetKind('converted');
    controls.selectDataset(converted.id);
    await vi.waitFor(() =>
      expect(window.qdbConverter!.analyzePlayernames).toHaveBeenCalledTimes(2),
    );
    resolveFirst({
      requestId: '44444444-4444-4444-8444-444444444444',
      datasetId: imported.id,
      status: 'completed',
      tables: [{ table: 'playernames', profile: profile(10) }],
    });
    await fixture.whenStable();

    expect(controls.outOfRangeCount()).toBe(0);
  });
});
