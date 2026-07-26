export type DatasetSourceKind = 'text-folder' | 't3db';
export type DatasetStatus = 'available' | 'corrupt';
export type OperationStatus = 'completed' | 'failed' | 'cancelled';

export interface SourceProvenance {
  kind: DatasetSourceKind;
  originalPaths: string[];
  hashes: Record<string, string>;
  importedAt: string;
}

export interface DatasetDescriptor {
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

export interface DatasetImportCandidate {
  selectionId: string;
  suggestedName: string;
  sourceKind: DatasetSourceKind;
  originalPaths: string[];
  detectedVersion?: number;
  matchingVersions: number[];
  tableNames: string[];
  warnings: string[];
}

export interface DatasetImportRequest {
  selectionId: string;
  name: string;
  fifaVersion: number;
}

export interface DatasetImportResult {
  selectionId: string;
  status: OperationStatus;
  dataset?: DatasetDescriptor;
  error?: ValidationError;
}

export interface ValidationError {
  code:
    | 'invalid-request'
    | 'invalid-source'
    | 'duplicate-name'
    | 'version-mismatch'
    | 'missing-files'
    | 'cancelled'
    | 'conversion-failed';
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

export interface ConversionRequest {
  requestId: string;
  datasetIds: string[];
  targetVersion: number;
  tables: string[];
  outputParentPath: string;
  extendContracts: boolean;
}

export interface ConversionProgress {
  requestId: string;
  datasetId?: string;
  completedDatasets: number;
  totalDatasets: number;
  message: string;
}

export interface ConversionResult {
  datasetId: string;
  status: OperationStatus;
  outputPath?: string;
  tables: TableConversionSummary[];
  warnings: string[];
  error?: ValidationError;
}

export interface ConversionRecord {
  id: string;
  requestId: string;
  datasetId: string;
  datasetName: string;
  sourceVersion: number;
  targetVersion: number;
  source: SourceProvenance;
  status: OperationStatus;
  outputPath?: string;
  selectedTables: string[];
  tableSummaries: TableConversionSummary[];
  warnings: string[];
  error?: ValidationError;
  startedAt: string;
  completedAt: string;
  durationMs: number;
}

export interface QdbConverterApi {
  listDatasets(): Promise<DatasetDescriptor[]>;
  selectTextSources(): Promise<DatasetImportCandidate[]>;
  selectT3dbSource(): Promise<DatasetImportCandidate | undefined>;
  importDatasets(requests: DatasetImportRequest[]): Promise<DatasetImportResult[]>;
  cancelImport(): Promise<boolean>;
  renameDataset(id: string, name: string): Promise<DatasetDescriptor>;
  removeDataset(id: string): Promise<boolean>;
  selectOutputDirectory(): Promise<string | undefined>;
  runConversion(request: ConversionRequest): Promise<ConversionResult[]>;
  cancelConversion(requestId: string): Promise<boolean>;
  listConversions(): Promise<ConversionRecord[]>;
  removeConversion(id: string): Promise<boolean>;
  revealOutput(path: string): Promise<boolean>;
  onImportProgress(listener: (message: string) => void): () => void;
  onConversionProgress(listener: (progress: ConversionProgress) => void): () => void;
}
