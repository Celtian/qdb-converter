export type DatasetSourceKind = 'text-folder' | 't3db';
export type DatasetStatus = 'available' | 'corrupt';
export type OperationStatus = 'completed' | 'failed' | 'cancelled';

export interface SourceProvenance {
  kind: DatasetSourceKind;
  originalPaths: string[];
  hashes: Record<string, string>;
  importedAt: string;
}

export interface ImportedDatasetDescriptor {
  id: string;
  name: string;
  fifaVersion: number;
  source: SourceProvenance;
  status: DatasetStatus;
  tableNames: string[];
  tableCount: number;
  rowCount: number;
  warnings: string[];
  error?: string;
}

export interface DatasetImportTableSummary {
  table: string;
  rows: number;
}

export interface DatasetImportCandidate {
  selectionId: string;
  suggestedName: string;
  sourceKind: DatasetSourceKind;
  originalPaths: string[];
  detectedVersion?: number;
  matchingVersions: number[];
  tables: DatasetImportTableSummary[];
  warnings: string[];
}

export interface DatasetSourceFileSelection {
  id: string;
  displayPath: string;
  fileName: string;
}

export interface T3dbSourcePreparationRequest {
  databaseFileId: string;
  metadataFileId: string;
}

export interface DatasetImportRequest {
  selectionId: string;
  name: string;
  fifaVersion: number;
}

export interface DatasetImportResult {
  selectionId: string;
  status: OperationStatus;
  dataset?: ImportedDatasetDescriptor;
  error?: ValidationError;
}

export interface DatasetValidationSample {
  row: number;
  value: string | number;
}

export interface DatasetValidationIssue {
  table: string;
  field?: string;
  message: string;
  occurrences: number;
  samples: DatasetValidationSample[];
}

export interface DatasetValidationReport {
  validatedAt: string;
  tablesChecked: number;
  rowsChecked: number;
  errorCount: number;
  warningCount: number;
  errors: DatasetValidationIssue[];
  warnings: DatasetValidationIssue[];
}

export interface DatasetValidationResult extends DatasetValidationReport {
  datasetId: string;
}

export type DatasetKind = 'imported' | 'converted';

export interface DatasetCleanupResult {
  imported: number;
  converted: number;
}

export interface DatasetValidationRequest {
  datasetKind: DatasetKind;
  datasetId: string;
}

export interface DatasetImportValidationRequest {
  selectionId: string;
  fifaVersion: number;
}

export interface DatasetImportValidationResult extends DatasetValidationReport {
  selectionId: string;
}

export interface ValidationError {
  code:
    | 'invalid-request'
    | 'invalid-source'
    | 'duplicate-name'
    | 'version-mismatch'
    | 'missing-files'
    | 'cancelled'
    | 'conversion-failed'
    | 'export-failed';
  message: string;
  details?: string[];
}

export interface TableConversionSummary {
  table: string;
  rows: number;
  defaultSubstitutions: number;
  ratingDifferences: number;
  warnings: string[];
}

export interface ConvertedDatasetDescriptor {
  id: string;
  name: string;
  sourceDatasetId: string;
  sourceDatasetName: string;
  sourceVersion: number;
  fifaVersion: number;
  createdAt: string;
  status: DatasetStatus;
  tableNames: string[];
  tableCount: number;
  rowCount: number;
  tableSummaries: TableConversionSummary[];
  warnings: string[];
  error?: string;
}

export interface CreateConvertedDatasetRequest {
  requestId: string;
  sourceDatasetId: string;
  targetVersion: number;
  name: string;
}

export interface ConversionProgress {
  requestId: string;
  sourceDatasetId?: string;
  message: string;
}

export interface CreateConvertedDatasetResult {
  sourceDatasetId: string;
  status: OperationStatus;
  dataset?: ConvertedDatasetDescriptor;
  tables: TableConversionSummary[];
  warnings: string[];
  error?: ValidationError;
}

export interface ExportDatasetRequest {
  datasetKind: DatasetKind;
  datasetId: string;
  targetParentPath: string;
}

export interface ExportDatasetResult {
  datasetId: string;
  outputPath: string;
}

export interface QdbConverterApi {
  listImportedDatasets(): Promise<ImportedDatasetDescriptor[]>;
  validateDataset(request: DatasetValidationRequest): Promise<DatasetValidationResult>;
  validateImportSource(
    request: DatasetImportValidationRequest,
  ): Promise<DatasetImportValidationResult>;
  selectTextSources(): Promise<DatasetImportCandidate[]>;
  selectT3dbDatabaseFile(): Promise<DatasetSourceFileSelection | undefined>;
  selectT3dbMetadataFile(): Promise<DatasetSourceFileSelection | undefined>;
  prepareT3dbSource(request: T3dbSourcePreparationRequest): Promise<DatasetImportCandidate>;
  importDatasets(requests: DatasetImportRequest[]): Promise<DatasetImportResult[]>;
  cancelImport(): Promise<boolean>;
  renameImportedDataset(id: string, name: string): Promise<ImportedDatasetDescriptor>;
  removeImportedDataset(id: string): Promise<boolean>;
  removeImportedDatasets(ids: string[]): Promise<number>;
  removeAllDatasets(kinds: DatasetKind[]): Promise<DatasetCleanupResult>;
  listConvertedDatasets(): Promise<ConvertedDatasetDescriptor[]>;
  createConvertedDataset(
    request: CreateConvertedDatasetRequest,
  ): Promise<CreateConvertedDatasetResult>;
  cancelConversion(requestId: string): Promise<boolean>;
  renameConvertedDataset(id: string, name: string): Promise<ConvertedDatasetDescriptor>;
  removeConvertedDataset(id: string): Promise<boolean>;
  removeConvertedDatasets(ids: string[]): Promise<number>;
  selectExportDirectory(): Promise<string | undefined>;
  exportDataset(request: ExportDatasetRequest): Promise<ExportDatasetResult>;
  revealExport(path: string): Promise<boolean>;
  onImportProgress(listener: (message: string) => void): () => void;
  onConversionProgress(listener: (progress: ConversionProgress) => void): () => void;
}
