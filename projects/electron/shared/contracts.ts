export type DatasetSourceKind = 'text-folder' | 't3db';
export type DatasetStatus = 'available' | 'corrupt';
export type OperationStatus = 'completed' | 'failed' | 'cancelled';
export type DatasetResultKind =
  'conversion' | 'playernames-minimize' | 'playernames-remove-unused' | 'playernames-combined';
export type ManagedDatasetFormat = DatasetSourceKind;

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
  managedFormat: ManagedDatasetFormat;
  updatedAt: string;
  status: DatasetStatus;
  tableNames: string[];
  tableCount: number;
  rowCount: number;
  warnings: string[];
  playernameSummary?: PlayernameSummary;
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
    | 'dataset-id-analysis-failed'
    | 'playername-failed'
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

export interface DatasetIdBucket {
  start: number;
  end: number;
  occupied: number;
  holes: number;
  capacity: number;
}

export interface DatasetIdOverflow {
  count: number;
  min?: number;
  max?: number;
  samples: number[];
}

export interface DatasetIdProfile {
  rangeMin: number;
  rangeMax: number;
  activeMax?: number;
  /** Sorted unique integer IDs. Optional for registry-v4 compatibility. */
  occupiedIds?: number[];
  occupiedCount: number;
  holeCount: number;
  capacityCount: number;
  outOfRangeCount: number;
  belowRange: DatasetIdOverflow;
  aboveRange: DatasetIdOverflow;
  buckets: DatasetIdBucket[];
}

export interface DatasetIdValueSample {
  row: number;
  value: string | number;
}

export interface DatasetTableIdAnalysis {
  table: string;
  rows: number;
  keyField?: string;
  profile?: DatasetIdProfile;
  duplicateCount: number;
  duplicateSamples: number[];
  invalidCount: number;
  invalidSamples: DatasetIdValueSample[];
  unavailableReason?: string;
  error?: string;
}

export interface DatasetIdAnalysisRequest {
  requestId: string;
  datasetKind: DatasetKind;
  datasetId: string;
}

export interface DatasetIdAnalysisResult {
  requestId: string;
  datasetId: string;
  status: OperationStatus;
  tables: DatasetTableIdAnalysis[];
  error?: ValidationError;
}

export interface DatasetIdAnalysisProgress {
  requestId: string;
  datasetId: string;
  message: string;
}

export interface ConvertedDatasetDescriptor {
  id: string;
  name: string;
  resultKind: DatasetResultKind;
  sourceDatasetKind: DatasetKind;
  sourceDatasetId: string;
  sourceDatasetName: string;
  sourceVersion: number;
  fifaVersion: number;
  createdAt: string;
  updatedAt: string;
  status: DatasetStatus;
  tableNames: string[];
  tableCount: number;
  rowCount: number;
  tableSummaries: TableConversionSummary[];
  playernameSummary?: PlayernameSummary;
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

export interface PlayernameTableSummary {
  table: 'playernames' | 'dcplayernames';
  beforeRows: number;
  afterRows: number;
  removedRows: number;
  minBefore?: number;
  maxBefore?: number;
  minAfter?: number;
  maxAfter?: number;
  beforeIdProfile?: PlayernameIdProfile;
  afterIdProfile?: PlayernameIdProfile;
}

export type PlayernameIdBucket = DatasetIdBucket;
export type PlayernameIdOverflow = DatasetIdOverflow;
export type PlayernameIdProfile = DatasetIdProfile;

export interface PlayernameTableAnalysis {
  table: 'playernames' | 'dcplayernames';
  profile: PlayernameIdProfile;
}

export interface PlayernameAnalysisRequest {
  requestId: string;
  datasetKind: DatasetKind;
  datasetId: string;
}

export interface PlayernameAnalysisResult {
  requestId: string;
  datasetId: string;
  status: OperationStatus;
  /** Profiles available for diagnostics, including partial results from failed analysis. */
  tables: PlayernameTableAnalysis[];
  error?: ValidationError;
}

export interface PlayernameAnalysisProgress {
  requestId: string;
  datasetId: string;
  message: string;
}

export interface PlayernameSummary {
  operations: PlayernameOperations;
  tables: PlayernameTableSummary[];
  referencesUpdated: number;
  totalRowsBefore: number;
  totalRowsAfter: number;
}

export interface PlayernameOperations {
  minimize: boolean;
  removeUnused: boolean;
}

export type PlayernameOutput = { kind: 'overwrite' } | { kind: 'new-converted'; name: string };

export interface PlayernameRunRequest {
  requestId: string;
  datasetKind: DatasetKind;
  datasetId: string;
  operations: PlayernameOperations;
  output: PlayernameOutput;
}

export interface PlayernameProgress {
  requestId: string;
  datasetId: string;
  message: string;
}

export interface PlayernameRunResult {
  sourceDatasetId: string;
  status: OperationStatus;
  dataset?: ImportedDatasetDescriptor | ConvertedDatasetDescriptor;
  summary?: PlayernameSummary;
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
  analyzeDatasetIds(request: DatasetIdAnalysisRequest): Promise<DatasetIdAnalysisResult>;
  cancelDatasetIdAnalysis(requestId: string): Promise<boolean>;
  analyzePlayernames(request: PlayernameAnalysisRequest): Promise<PlayernameAnalysisResult>;
  cancelPlayernameAnalysis(requestId: string): Promise<boolean>;
  runPlayername(request: PlayernameRunRequest): Promise<PlayernameRunResult>;
  cancelPlayername(requestId: string): Promise<boolean>;
  selectExportDirectory(): Promise<string | undefined>;
  exportDataset(request: ExportDatasetRequest): Promise<ExportDatasetResult>;
  revealExport(path: string): Promise<boolean>;
  onImportProgress(listener: (message: string) => void): () => void;
  onConversionProgress(listener: (progress: ConversionProgress) => void): () => void;
  onDatasetIdAnalysisProgress(listener: (progress: DatasetIdAnalysisProgress) => void): () => void;
  onPlayernameAnalysisProgress(
    listener: (progress: PlayernameAnalysisProgress) => void,
  ): () => void;
  onPlayernameProgress(listener: (progress: PlayernameProgress) => void): () => void;
}
