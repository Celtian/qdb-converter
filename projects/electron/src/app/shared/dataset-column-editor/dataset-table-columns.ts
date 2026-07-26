export type DatasetTableKind = 'imported' | 'converted';

export type DatasetColumnKey =
  | 'actions'
  | 'created'
  | 'imported'
  | 'name'
  | 'rows'
  | 'source'
  | 'status'
  | 'tables'
  | 'target'
  | 'version';

export interface DatasetColumnDefinition {
  readonly key: DatasetColumnKey;
  readonly label: string;
  readonly defaultVisible: boolean;
  readonly required: boolean;
}

export interface DatasetColumnPreference {
  readonly version: 1;
  readonly order: readonly DatasetColumnKey[];
  readonly visible: readonly DatasetColumnKey[];
}

export type DatasetColumnVisibility = Record<string, boolean>;

const defineColumn = (
  key: DatasetColumnKey,
  label: string,
  required = false,
): DatasetColumnDefinition => ({
  key,
  label,
  defaultVisible: true,
  required,
});

export const columnsByDatasetTable: Record<DatasetTableKind, readonly DatasetColumnDefinition[]> = {
  imported: [
    defineColumn('name', 'Name', true),
    defineColumn('version', 'Version'),
    defineColumn('source', 'Source'),
    defineColumn('tables', 'Tables'),
    defineColumn('rows', 'Rows'),
    defineColumn('imported', 'Imported'),
    defineColumn('status', 'Status'),
    defineColumn('actions', 'Actions', true),
  ],
  converted: [
    defineColumn('name', 'Name', true),
    defineColumn('source', 'Source'),
    defineColumn('target', 'Target'),
    defineColumn('tables', 'Tables'),
    defineColumn('rows', 'Rows'),
    defineColumn('created', 'Created'),
    defineColumn('status', 'Status'),
    defineColumn('actions', 'Actions', true),
  ],
};

export function defaultDatasetColumnPreference(table: DatasetTableKind): DatasetColumnPreference {
  const columns = columnsByDatasetTable[table];
  return {
    version: 1,
    order: columns.map(({ key }) => key),
    visible: columns
      .filter(({ defaultVisible, required }) => defaultVisible || required)
      .map(({ key }) => key),
  };
}

export function visibleDatasetColumns(preference: DatasetColumnPreference): DatasetColumnKey[] {
  const visible = new Set(preference.visible);
  return preference.order.filter((column) => visible.has(column));
}

export function toDatasetColumnVisibility(
  columns: readonly DatasetColumnDefinition[],
  visibleColumns: readonly DatasetColumnKey[],
): DatasetColumnVisibility {
  const visible = new Set(visibleColumns);
  return Object.fromEntries(columns.map(({ key }) => [key, visible.has(key)]));
}

export function fromDatasetColumnVisibility(
  columns: readonly DatasetColumnDefinition[],
  visibility: DatasetColumnVisibility,
): DatasetColumnKey[] {
  return columns.filter(({ key, required }) => required || visibility[key]).map(({ key }) => key);
}
