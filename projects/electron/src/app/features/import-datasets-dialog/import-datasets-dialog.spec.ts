import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import type { DatasetImportCandidate, QdbConverterApi } from '../../../../shared/contracts';

import { ImportDatasetsDialog } from './import-datasets-dialog';

describe('ImportDatasetsDialog', () => {
  let component: ImportDatasetsDialog;
  let fixture: ComponentFixture<ImportDatasetsDialog>;

  beforeEach(async () => {
    const candidate: DatasetImportCandidate = {
      selectionId: 'selection',
      suggestedName: 'Fixture',
      sourceKind: 'text-folder',
      originalPaths: ['/fixture'],
      detectedVersion: 23,
      matchingVersions: [22, 23],
      tableNames: ['players'],
      warnings: [],
    };
    window.qdbConverter = {
      selectTextSources: vi.fn(async () => [candidate]),
      selectT3dbSource: vi.fn(async () => ({ ...candidate, selectionId: 't3db' })),
      importDatasets: vi.fn(async () => [
        {
          selectionId: 'selection',
          status: 'failed' as const,
          error: { code: 'invalid-source' as const, message: 'Broken source' },
        },
      ]),
      listDatasets: vi.fn(async () => []),
      listConversions: vi.fn(async () => []),
      cancelImport: vi.fn(async () => true),
      onImportProgress: vi.fn(() => () => undefined),
      onConversionProgress: vi.fn(() => () => undefined),
    } as unknown as QdbConverterApi;
    await TestBed.configureTestingModule({
      imports: [ImportDatasetsDialog],
      providers: [{ provide: MatDialogRef, useValue: { close: vi.fn() } }],
    }).compileComponents();

    fixture = TestBed.createComponent(ImportDatasetsDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('builds and edits a multi-source import queue', async () => {
    const controls = component as unknown as {
      addTextFolders(): Promise<void>;
      addT3db(): Promise<void>;
      changeName(id: string, event: Event): void;
      changeVersion(id: string, version: number): void;
      remove(id: string): void;
      importAll(): Promise<void>;
      cancelImport(): void;
      candidates(): { selectionId: string; name: string; version: number }[];
      results(): string[];
    };
    await controls.addTextFolders();
    await controls.addT3db();
    expect(controls.candidates()).toHaveLength(2);
    const input = document.createElement('input');
    input.value = 'Renamed';
    controls.changeName('selection', { target: input } as unknown as Event);
    controls.changeVersion('selection', 22);
    expect(controls.candidates()[0]).toMatchObject({ name: 'Renamed', version: 22 });
    controls.remove('t3db');
    await controls.importAll();
    expect(controls.results()).toEqual(['Broken source']);
    controls.cancelImport();
    expect(window.qdbConverter!.cancelImport).toHaveBeenCalled();
  });
});
