import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import axe from 'axe-core';
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

const secondRecord: ConversionRecord = {
  ...record,
  id: '55555555-5555-4555-8555-555555555555',
  datasetName: 'Second',
  completedAt: new Date(2).toISOString(),
};

describe('Conversions', () => {
  let component: Conversions;
  let fixture: ComponentFixture<Conversions>;

  beforeEach(async () => {
    window.qdbConverter = {
      listDatasets: vi.fn(async () => []),
      listConversions: vi.fn(async () => [record, secondRecord]),
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

  it('renders conversion statuses as non-interactive badges', async () => {
    await TestBed.inject(AppStore).refresh();
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('app-status-badge .status-badge--success')?.textContent).toBe(
      'Completed',
    );
    expect(element.querySelector('mat-chip')).toBeNull();
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

  it('paginates rows and resets the page when searching', async () => {
    await TestBed.inject(AppStore).refresh();
    await fixture.whenStable();
    const controls = component as unknown as {
      setQuery(event: Event): void;
      pageChanged(event: { pageIndex: number; pageSize: number; length: number }): void;
      pageIndex(): number;
      paged(): ConversionRecord[];
    };

    expect((fixture.nativeElement as HTMLElement).querySelector('mat-paginator')).toBeTruthy();
    controls.pageChanged({ pageIndex: 1, pageSize: 1, length: 2 });
    expect(controls.paged()).toEqual([record]);

    const input = document.createElement('input');
    input.value = 'fixture';
    controls.setQuery({ target: input } as unknown as Event);
    expect(controls.pageIndex()).toBe(0);
    expect(controls.paged()).toEqual([record]);
  });

  it('replaces empty conversion history with an accessible state after loading', async () => {
    vi.mocked(window.qdbConverter!.listConversions).mockResolvedValueOnce([]);
    const store = TestBed.inject(AppStore);
    await store.refresh();
    store.loading.set(true);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.empty-state')).toBeNull();

    store.loading.set(false);
    await fixture.whenStable();

    expect(element.querySelector('.empty-state h2')?.textContent).toBe('No conversion history');
    expect(element.querySelector('table')).toBeNull();
    expect(element.querySelector('mat-paginator')).toBeNull();
    expect((await axe.run(element)).violations).toEqual([]);
  });

  it('shows a no-match state and clears the conversion search', async () => {
    await TestBed.inject(AppStore).refresh();
    const controls = component as unknown as {
      setQuery(event: Event): void;
      pageChanged(event: { pageIndex: number; pageSize: number; length: number }): void;
      query(): string;
      pageIndex(): number;
    };
    const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
      'input[type="search"]',
    )!;
    input.value = 'missing';
    controls.setQuery({ target: input } as unknown as Event);
    controls.pageChanged({ pageIndex: 1, pageSize: 1, length: 0 });
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.empty-state h2')?.textContent).toBe(
      'No conversions match your search',
    );
    expect(element.querySelector('table')).toBeNull();
    expect(element.querySelector('mat-paginator')).toBeNull();
    expect((await axe.run(element)).violations).toEqual([]);

    const clearButton = element.querySelector<HTMLButtonElement>('.empty-state button')!;
    expect(clearButton.textContent).toContain('Clear search');
    clearButton.click();
    await fixture.whenStable();

    expect(controls.query()).toBe('');
    expect(controls.pageIndex()).toBe(0);
    expect(input.value).toBe('');
    expect(element.querySelector('table')).toBeTruthy();
    expect(element.querySelector('mat-paginator')).toBeTruthy();
  });
});
