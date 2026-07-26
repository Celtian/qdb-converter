import { Service } from '@angular/core';
import {
  columnsByDatasetTable,
  defaultDatasetColumnPreference,
  type DatasetColumnKey,
  type DatasetColumnPreference,
  type DatasetTableKind,
} from '../shared/dataset-column-editor/dataset-table-columns';

export const datasetColumnPreferenceKey = (table: DatasetTableKind): string =>
  `qdb-converter.visible-columns.${table}`;

@Service()
export class DatasetColumnPreferences {
  load(table: DatasetTableKind): DatasetColumnPreference {
    const defaults = defaultDatasetColumnPreference(table);
    try {
      const stored = localStorage.getItem(datasetColumnPreferenceKey(table));
      if (stored === null) return defaults;
      const value: unknown = JSON.parse(stored);
      if (!this.isStoredPreference(value)) return defaults;
      return this.normalize(table, value.order, value.visible, true);
    } catch {
      return defaults;
    }
  }

  save(table: DatasetTableKind, preference: DatasetColumnPreference): void {
    try {
      localStorage.setItem(
        datasetColumnPreferenceKey(table),
        JSON.stringify(this.normalize(table, preference.order, preference.visible, true)),
      );
    } catch {
      // Table layouts remain usable for this session when local storage is unavailable.
    }
  }

  reset(table: DatasetTableKind): void {
    try {
      localStorage.removeItem(datasetColumnPreferenceKey(table));
    } catch {
      // Reset still applies to the current view when local storage is unavailable.
    }
  }

  private isStoredPreference(
    value: unknown,
  ): value is { version: 1; order: unknown[]; visible: unknown[] } {
    if (typeof value !== 'object' || value === null) return false;
    const candidate = value as Record<string, unknown>;
    return (
      candidate['version'] === 1 &&
      Array.isArray(candidate['order']) &&
      Array.isArray(candidate['visible'])
    );
  }

  private normalize(
    table: DatasetTableKind,
    orderValues: readonly unknown[],
    visibleValues: readonly unknown[],
    showNewDefaults: boolean,
  ): DatasetColumnPreference {
    const definitions = columnsByDatasetTable[table];
    const validKeys = new Set(definitions.map(({ key }) => key));
    const order: DatasetColumnKey[] = [];
    const ordered = new Set<DatasetColumnKey>();
    const currentKey = (value: unknown): DatasetColumnKey | undefined =>
      typeof value === 'string' && validKeys.has(value as DatasetColumnKey)
        ? (value as DatasetColumnKey)
        : undefined;

    for (const value of orderValues) {
      const key = currentKey(value);
      if (!key || ordered.has(key)) continue;
      ordered.add(key);
      order.push(key);
    }

    const visible = new Set(
      visibleValues.map(currentKey).filter((key): key is DatasetColumnKey => key !== undefined),
    );
    for (const definition of definitions) {
      if (!ordered.has(definition.key)) {
        order.push(definition.key);
        ordered.add(definition.key);
        if (showNewDefaults && definition.defaultVisible) visible.add(definition.key);
      }
      if (definition.required) visible.add(definition.key);
    }

    return {
      version: 1,
      order,
      visible: order.filter((key) => visible.has(key)),
    };
  }
}
