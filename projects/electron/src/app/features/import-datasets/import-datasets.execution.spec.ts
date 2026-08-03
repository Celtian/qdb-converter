import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import type {
  DatasetImportCandidate,
  DatasetImportResult,
  DatasetImportValidationResult,
  DatasetSourceKind,
  QdbConverterApi,
} from '../../../../shared/contracts';
import { ConfettiService } from '../../core/confetti/confetti.service';
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
  let celebrate: ReturnType<typeof vi.fn>;
  let component: ImportDatasets;
  let fixture: ComponentFixture<ImportDatasets>;
  let importResults: DatasetImportResult[];

  beforeEach(async () => {
    celebrate = vi.fn();
    localStorage.removeItem(formatStorageKey);
    importResults = [];
    window.qdbConverter = {
      listImportedDatasets: vi.fn(async () => []),
      listConvertedDatasets: vi.fn(async () => []),
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
      providers: [provideRouter([]), { provide: ConfettiService, useValue: { celebrate } }],
    }).compileComponents();

    fixture = TestBed.createComponent(ImportDatasets);
    component = fixture.componentInstance;
    await fixture.whenStable();
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
    expect(celebrate).toHaveBeenCalledOnce();
    controls.cancelImport();
    expect(window.qdbConverter!.cancelImport).toHaveBeenCalled();
  });
});
