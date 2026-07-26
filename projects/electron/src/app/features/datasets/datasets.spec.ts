import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import type { DatasetDescriptor, QdbConverterApi } from '../../../../shared/contracts';
import { AppStore } from '../../core/app-store';

import { Datasets } from './datasets';

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
  rowCount: 1,
  warnings: [],
};

describe('Datasets', () => {
  let component: Datasets;
  let fixture: ComponentFixture<Datasets>;

  beforeEach(async () => {
    window.qdbConverter = {
      listDatasets: vi.fn(async () => [dataset]),
      listConversions: vi.fn(async () => []),
      renameDataset: vi.fn(async () => dataset),
      removeDataset: vi.fn(async () => true),
      onImportProgress: vi.fn(() => () => undefined),
      onConversionProgress: vi.fn(() => () => undefined),
    } as unknown as QdbConverterApi;
    await TestBed.configureTestingModule({
      imports: [Datasets],
    }).compileComponents();

    fixture = TestBed.createComponent(Datasets);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('filters, renames, and removes catalog datasets', async () => {
    await TestBed.inject(AppStore).refresh();
    const controls = component as unknown as {
      setQuery(event: Event): void;
      setVersion(value: string): void;
      setSource(value: string): void;
      rename(value: DatasetDescriptor): void;
      remove(value: DatasetDescriptor): void;
      openImport(): void;
      filtered(): DatasetDescriptor[];
    };
    const input = document.createElement('input');
    input.value = 'fixture';
    controls.setQuery({ target: input } as unknown as Event);
    controls.setVersion('23');
    controls.setSource('text-folder');
    expect(controls.filtered()).toEqual([dataset]);
    controls.setVersion('22');
    expect(controls.filtered()).toEqual([]);
    controls.setVersion('all');
    controls.setSource('all');

    const dialog = TestBed.inject(MatDialog);
    const open = vi.spyOn(dialog, 'open');
    open.mockReturnValueOnce({ afterClosed: () => of('Renamed') } as never);
    controls.rename(dataset);
    await Promise.resolve();
    open.mockReturnValueOnce({ afterClosed: () => of(true) } as never);
    controls.remove(dataset);
    await Promise.resolve();
    open.mockRestore();
    controls.openImport();
  });
});
