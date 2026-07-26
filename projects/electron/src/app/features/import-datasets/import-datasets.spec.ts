import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import axe from 'axe-core';
import type {
  DatasetDescriptor,
  DatasetImportCandidate,
  DatasetImportResult,
  DatasetImportValidationResult,
  DatasetSourceKind,
  QdbConverterApi,
} from '../../../../shared/contracts';
import { ImportDatasets } from './import-datasets';

const candidate = (
  selectionId: string,
  suggestedName: string,
  sourceKind: DatasetSourceKind = 'text-folder',
): DatasetImportCandidate => ({
  selectionId,
  suggestedName,
  sourceKind,
  originalPaths:
    sourceKind === 't3db'
      ? ['/sources/fifa_ng_db.db', '/sources/fifa_ng_db-meta.xml']
      : [`/${suggestedName.toLocaleLowerCase()}`],
  detectedVersion: 23,
  matchingVersions: [22, 23],
  tables: [
    { table: 'players', rows: 12_345 },
    { table: 'teams', rows: 0 },
  ],
  warnings: [],
});

const validationResult = (
  selectionId: string,
  overrides: Partial<DatasetImportValidationResult> = {},
): DatasetImportValidationResult => ({
  selectionId,
  validatedAt: new Date(0).toISOString(),
  tablesChecked: 2,
  rowsChecked: 12_345,
  errorCount: 0,
  warningCount: 0,
  errors: [],
  warnings: [],
  ...overrides,
});

describe('ImportDatasets', () => {
  const formatStorageKey = 'qdb-converter-import-source-kind';
  let component: ImportDatasets;
  let fixture: ComponentFixture<ImportDatasets>;
  let importResults: DatasetImportResult[];

  beforeEach(async () => {
    localStorage.removeItem(formatStorageKey);
    importResults = [];
    window.qdbConverter = {
      listDatasets: vi.fn(async () => []),
      listConversions: vi.fn(async () => []),
      selectTextSources: vi.fn(async () => [
        {
          ...candidate('text', 'Text source'),
          originalPaths: ['/sources/exports/fifa23/very-long-folder-name/text-tables'],
          warnings: ['Unsupported text tables will be preserved but not converted.'],
        },
        candidate('extra', 'Extra source'),
      ]),
      selectT3dbDatabaseFile: vi.fn(async () => ({
        id: 'database-file',
        displayPath: '/sources/fifa_ng_db.db',
        fileName: 'fifa_ng_db.db',
      })),
      selectT3dbMetadataFile: vi.fn(async () => ({
        id: 'metadata-file',
        displayPath: '/sources/fifa_ng_db-meta.xml',
        fileName: 'fifa_ng_db-meta.xml',
      })),
      prepareT3dbSource: vi.fn(async () => candidate('t3db', 'T3db source', 't3db')),
      validateImportSource: vi.fn(async (request) => validationResult(request.selectionId)),
      importDatasets: vi.fn(async () => importResults),
      cancelImport: vi.fn(async () => true),
      onImportProgress: vi.fn(() => () => undefined),
      onConversionProgress: vi.fn(() => () => undefined),
    } as unknown as QdbConverterApi;
    await TestBed.configureTestingModule({
      imports: [ImportDatasets],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ImportDatasets);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('renders a numbered, accessible four-step wizard with format choices', async () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('mat-stepper')?.getAttribute('aria-label')).toBe(
      'Dataset import wizard',
    );
    expect(
      [...element.querySelectorAll('.mat-step-icon-content')].map((icon) => icon.textContent),
    ).toEqual(['1', '2', '3', '4']);
    expect(element.querySelector('mat-radio-group')?.getAttribute('aria-label')).toBe(
      'Dataset source format',
    );
    expect(element.textContent).toContain('Text-table folders');
    expect(element.textContent).toContain('Source folders');
    expect(await axe.run(element)).toEqual(expect.objectContaining({ violations: [] }));
  });

  it('presents selected sources with accessible metadata, paths, warnings, and actions', async () => {
    const controls = component as unknown as {
      selectTextFolders(): Promise<void>;
    };

    await controls.selectTextFolders();
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    const card = element.querySelector<HTMLElement>('.candidate-card');
    const reviewCard = element.querySelector<HTMLElement>('.review-card');
    const path = card?.querySelector<HTMLElement>('.source-path');
    const removeButton = card?.querySelector<HTMLButtonElement>('.remove-source');

    expect(card?.querySelector('.source-title')?.textContent).toContain('Text source');
    expect(card?.querySelector('.source-kind')?.textContent?.trim()).toBe('Text folder');
    expect(card?.querySelector('.source-metadata')?.textContent).toContain('2 tables');
    expect(card?.querySelector('.source-metadata')?.textContent).toContain('FIFA 23');
    expect(path?.getAttribute('title')).toBe(
      '/sources/exports/fifa23/very-long-folder-name/text-tables',
    );
    expect(card?.querySelector('.source-warning')?.textContent).toContain(
      'Unsupported text tables will be preserved but not converted.',
    );
    expect(removeButton?.getAttribute('aria-label')).toBe('Remove Text source');
    expect(reviewCard?.querySelector('.source-title')?.textContent).toContain('Text source');
    expect(reviewCard?.querySelector('.source-metadata')?.textContent).toContain('FIFA 23');
    expect(reviewCard?.querySelector('.source-warning')?.textContent).toContain(
      'Unsupported text tables will be preserved but not converted.',
    );
    expect(await axe.run(element)).toEqual(expect.objectContaining({ violations: [] }));
  });

  it('queues, edits, validates, removes, and clears multiple text sources on format change', async () => {
    const controls = component as unknown as {
      changeFormat(format: DatasetSourceKind): void;
      selectTextFolders(): Promise<void>;
      changeName(id: string, event: Event): void;
      changeVersion(id: string, version: number): void;
      remove(id: string): void;
      candidates(): { selectionId: string; name: string; version: number }[];
      format(): DatasetSourceKind;
      reviewReady(): boolean;
      textSourceDisplay(): string;
    };

    await controls.selectTextFolders();
    expect(controls.candidates()).toHaveLength(2);
    expect(controls.textSourceDisplay()).toBe('2 folders selected');
    expect(controls.reviewReady()).toBe(true);

    const input = document.createElement('input');
    input.value = 'Extra source';
    controls.changeName('text', { target: input } as unknown as Event);
    expect(controls.reviewReady()).toBe(false);
    controls.changeName('text', {
      target: Object.assign(document.createElement('input'), { value: 'Renamed' }),
    } as unknown as Event);
    controls.changeVersion('text', 21);
    expect(controls.reviewReady()).toBe(false);
    controls.changeVersion('text', 22);
    expect(controls.reviewReady()).toBe(true);
    controls.remove('extra');
    expect(controls.candidates()).toHaveLength(1);

    controls.changeFormat('t3db');
    await fixture.whenStable();
    expect(controls.format()).toBe('t3db');
    expect(controls.candidates()).toHaveLength(0);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('t3db database');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Metadata XML');
  });

  it('persists the selected format and keeps it when starting another import', async () => {
    const controls = component as unknown as {
      changeFormat(format: DatasetSourceKind): void;
      startAnotherImport(): void;
      format(): DatasetSourceKind;
    };

    controls.changeFormat('t3db');
    controls.startAnotherImport();
    await fixture.whenStable();

    expect(controls.format()).toBe('t3db');
    expect(localStorage.getItem(formatStorageKey)).toBe('t3db');

    fixture.destroy();
    fixture = TestBed.createComponent(ImportDatasets);
    component = fixture.componentInstance;
    await fixture.whenStable();

    const restored = component as unknown as { format(): DatasetSourceKind };
    expect(restored.format()).toBe('t3db');
  });

  it('falls back to text folders when the stored format is invalid', async () => {
    localStorage.setItem(formatStorageKey, 'unsupported');
    fixture.destroy();
    fixture = TestBed.createComponent(ImportDatasets);
    component = fixture.componentInstance;
    await fixture.whenStable();

    const controls = component as unknown as { format(): DatasetSourceKind };
    expect(controls.format()).toBe('text-folder');
  });

  it('groups import tables by dataset and shows the row count for each table', async () => {
    const controls = component as unknown as {
      selectTextFolders(): Promise<void>;
    };
    const element = fixture.nativeElement as HTMLElement;
    const button = (label: string) =>
      [...element.querySelectorAll<HTMLButtonElement>('button')].find(
        (candidate) => candidate.textContent?.trim() === label,
      );

    button('Next')!.click();
    await fixture.whenStable();
    await controls.selectTextFolders();
    await fixture.whenStable();
    button('Review sources')!.click();
    await fixture.whenStable();
    button('Review import')!.click();
    await fixture.whenStable();

    const groups = [...element.querySelectorAll<HTMLElement>('.import-dataset')];
    expect(groups).toHaveLength(2);
    expect(groups.map((group) => group.querySelector('h3')?.textContent?.trim())).toEqual([
      'Text source',
      'Extra source',
    ]);
    for (const group of groups) {
      const rows = [...group.querySelectorAll('tbody tr')].map((row) =>
        [...row.querySelectorAll('td')].map((cell) => cell.textContent?.trim()),
      );
      expect(rows).toEqual([
        ['players', '12,345'],
        ['teams', '0'],
      ]);
    }
    expect(element.textContent).not.toContain('Pending datasets');
    expect(await axe.run(element)).toEqual(expect.objectContaining({ violations: [] }));
  });

  it('validates sources sequentially on entering the import step and allows warnings', async () => {
    vi.mocked(window.qdbConverter!.validateImportSource).mockImplementation(async (request) =>
      request.selectionId === 'text'
        ? validationResult(request.selectionId, {
            warningCount: 3,
            warnings: [
              {
                table: 'players',
                field: 'playerid',
                message: 'Value is outside the published range 0–300000.',
                occurrences: 3,
                samples: [{ row: 1, value: 300001 }],
              },
            ],
          })
        : validationResult(request.selectionId),
    );
    const controls = component as unknown as {
      selectTextFolders(): Promise<void>;
      reviewImport(): void;
      canImport(): boolean;
    };

    await controls.selectTextFolders();
    controls.reviewImport();
    await fixture.whenStable();

    expect(window.qdbConverter!.validateImportSource).toHaveBeenNthCalledWith(1, {
      selectionId: 'text',
      fifaVersion: 23,
    });
    expect(window.qdbConverter!.validateImportSource).toHaveBeenNthCalledWith(2, {
      selectionId: 'extra',
      fifaVersion: 23,
    });
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('app-validation-report')).toHaveLength(2);
    expect(element.textContent).toContain('Source ready to import');
    expect(element.textContent).toContain('0 blocking errors and 3 warnings found');
    expect(controls.canImport()).toBe(true);
    const headingIds = [...element.querySelectorAll<HTMLElement>('.issue-section h3')].map(
      (heading) => heading.id,
    );
    expect(new Set(headingIds).size).toBe(headingIds.length);
    expect(await axe.run(element)).toEqual(expect.objectContaining({ violations: [] }));
  });

  it('blocks the whole batch when one source has validation errors', async () => {
    vi.mocked(window.qdbConverter!.validateImportSource).mockImplementation(async (request) =>
      request.selectionId === 'extra'
        ? validationResult(request.selectionId, {
            errorCount: 1,
            errors: [
              {
                table: 'players',
                field: 'playerid',
                message: 'Value must be unique.',
                occurrences: 1,
                samples: [{ row: 2, value: 1 }],
              },
            ],
          })
        : validationResult(request.selectionId),
    );
    const controls = component as unknown as {
      selectTextFolders(): Promise<void>;
      runValidations(): Promise<void>;
      importAll(): Promise<void>;
      canImport(): boolean;
    };

    await controls.selectTextFolders();
    await controls.runValidations();
    await fixture.whenStable();
    await controls.importAll();

    expect(controls.canImport()).toBe(false);
    expect(window.qdbConverter!.importDatasets).not.toHaveBeenCalled();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Blocking validation errors found',
    );
  });

  it('shows validation failures, retries them, and invalidates only version changes', async () => {
    vi.mocked(window.qdbConverter!.validateImportSource)
      .mockRejectedValueOnce(new Error('Validation worker unavailable'))
      .mockImplementation(async (request) => validationResult(request.selectionId));
    const controls = component as unknown as {
      selectTextFolders(): Promise<void>;
      runValidations(): Promise<void>;
      changeName(id: string, event: Event): void;
      changeVersion(id: string, version: number): void;
      validationState(
        id: string,
      ): { status: string; fifaVersion: number; error?: string } | undefined;
      canImport(): boolean;
    };

    await controls.selectTextFolders();
    await controls.runValidations();
    await fixture.whenStable();

    expect(controls.validationState('text')).toMatchObject({
      status: 'failed',
      error: 'Validation worker unavailable',
    });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Validation worker unavailable',
    );

    await controls.runValidations();
    controls.changeName('text', {
      target: Object.assign(document.createElement('input'), { value: 'Renamed' }),
    } as unknown as Event);
    expect(controls.validationState('text')?.status).toBe('completed');
    expect(controls.canImport()).toBe(true);

    controls.changeVersion('text', 22);
    expect(controls.validationState('text')).toBeUndefined();
    expect(controls.validationState('extra')?.status).toBe('completed');
    expect(controls.canImport()).toBe(false);
  });

  it('shows an existing-name error until the candidate has a unique name', async () => {
    vi.mocked(window.qdbConverter!.listDatasets).mockResolvedValue([
      {
        name: 'TEXT SOURCE',
      } as DatasetDescriptor,
    ]);
    const controls = component as unknown as {
      store: { datasets(): DatasetDescriptor[]; refresh(): Promise<void> };
      candidates(): DatasetImportCandidate[];
      validationMessages(candidate: DatasetImportCandidate): string[];
    };

    await controls.store.refresh();
    await fixture.whenStable();
    expect(controls.store.datasets()).toEqual([expect.objectContaining({ name: 'TEXT SOURCE' })]);
    const element = fixture.nativeElement as HTMLElement;
    const button = (label: string) =>
      [...element.querySelectorAll<HTMLButtonElement>('button')].find(
        (candidate) =>
          candidate.textContent?.trim() === label || candidate.getAttribute('aria-label') === label,
      );

    button('Next')!.click();
    await fixture.whenStable();
    button('Select source folders')!.click();
    await fixture.whenStable();
    expect(controls.validationMessages(controls.candidates()[0])).toContain(
      'A dataset with this name already exists.',
    );
    button('Review sources')!.click();
    await fixture.whenStable();
    expect(controls.validationMessages(controls.candidates()[0])).toContain(
      'A dataset with this name already exists.',
    );

    const reviewCard = [...element.querySelectorAll<HTMLElement>('.review-card')].find((card) =>
      card.querySelector('.source-title')?.textContent?.includes('Text source'),
    );
    const nameField = reviewCard?.querySelector<HTMLElement>('.review-fields mat-form-field');
    const nameInput = nameField?.querySelector<HTMLInputElement>('input');
    const nameError = nameField?.querySelector<HTMLElement>('mat-error');
    const reviewButton = [...element.querySelectorAll<HTMLButtonElement>('button')].find(
      (button) => button.textContent?.trim() === 'Review import',
    );

    expect(nameField?.classList.contains('mat-form-field-invalid')).toBe(true);
    expect(nameError?.textContent?.trim()).toBe('A dataset with this name already exists.');
    expect(nameInput?.getAttribute('aria-invalid')).toBe('true');
    expect(nameInput?.getAttribute('aria-describedby')).toContain(nameError?.id);
    expect(reviewButton?.disabled).toBe(true);
    expect(await axe.run(element)).toEqual(expect.objectContaining({ violations: [] }));

    nameInput!.value = 'Unique source';
    nameInput!.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();

    expect(nameField?.classList.contains('mat-form-field-invalid')).toBe(false);
    expect(nameField?.querySelector('mat-error')).toBeNull();
    expect(nameInput?.getAttribute('aria-invalid')).toBe('false');
    expect(reviewButton?.disabled).toBe(false);
  });

  it('requires both t3db files and prepares one candidate before review', async () => {
    const controls = component as unknown as {
      changeFormat(format: DatasetSourceKind): void;
      selectT3dbDatabase(): Promise<void>;
      selectT3dbMetadata(): Promise<void>;
      continueSource(): Promise<void>;
      candidates(): { selectionId: string }[];
      sourceReady(): boolean;
    };

    controls.changeFormat('t3db');
    await controls.continueSource();
    expect(window.qdbConverter!.prepareT3dbSource).not.toHaveBeenCalled();

    await controls.selectT3dbDatabase();
    expect(controls.sourceReady()).toBe(false);
    await controls.continueSource();
    expect(window.qdbConverter!.prepareT3dbSource).not.toHaveBeenCalled();

    await controls.selectT3dbMetadata();
    expect(controls.sourceReady()).toBe(true);
    await controls.continueSource();
    expect(window.qdbConverter!.prepareT3dbSource).toHaveBeenCalledWith({
      databaseFileId: 'database-file',
      metadataFileId: 'metadata-file',
    });
    expect(controls.candidates()).toEqual([
      expect.objectContaining({ selectionId: 't3db', name: 'T3db source', version: 23 }),
    ]);
  });

  it('shows partial results, keeps failed sources, and supports cancellation', async () => {
    const controls = component as unknown as {
      selectTextFolders(): Promise<void>;
      runValidations(): Promise<void>;
      importAll(): Promise<void>;
      cancelImport(): void;
      candidates(): { selectionId: string }[];
      results(): DatasetImportResult[];
    };
    await controls.selectTextFolders();
    importResults = [
      {
        selectionId: 'text',
        status: 'completed',
        dataset: { name: 'Text source' } as DatasetImportResult['dataset'],
      },
      {
        selectionId: 'extra',
        status: 'failed',
        error: { code: 'invalid-source', message: 'Broken source' },
      },
    ];

    await controls.runValidations();
    await controls.importAll();
    expect(controls.results()).toHaveLength(2);
    expect(controls.candidates()).toHaveLength(1);
    expect(controls.candidates()[0].selectionId).toBe('extra');
    controls.cancelImport();
    expect(window.qdbConverter!.cancelImport).toHaveBeenCalled();
  });
});
