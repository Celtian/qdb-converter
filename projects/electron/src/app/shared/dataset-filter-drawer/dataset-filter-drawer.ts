import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';

import type {
  DatasetResultKind,
  DatasetSourceKind,
  DatasetStatus,
} from '../../../../shared/contracts';
import { SUPPORTED_FIFA_VERSIONS } from '../../../../shared/table-config';

export type DatasetVersionFilter = number | 'all';
export type PlayernameResultFilter =
  'all' | 'none' | 'playernames-minimize' | 'playernames-remove-unused' | 'playernames-combined';

export interface ImportedDatasetFilters {
  kind: 'imported';
  fifaVersion: DatasetVersionFilter;
  sourceKind: DatasetSourceKind | 'all';
  playernameResult: PlayernameResultFilter;
}

export interface ConvertedDatasetFilters {
  kind: 'converted';
  resultKind: DatasetResultKind | 'all';
  sourceVersion: DatasetVersionFilter;
  targetVersion: DatasetVersionFilter;
  status: DatasetStatus | 'all';
}

export type DatasetFilters = ImportedDatasetFilters | ConvertedDatasetFilters;

export interface DatasetFilterDrawerData {
  filters: DatasetFilters;
}

interface DatasetFilterFormValue {
  fifaVersion: DatasetVersionFilter;
  sourceKind: DatasetSourceKind | 'all';
  playernameResult: PlayernameResultFilter;
  sourceVersion: DatasetVersionFilter;
  targetVersion: DatasetVersionFilter;
  status: DatasetStatus | 'all';
  resultKind: DatasetResultKind | 'all';
}

export const emptyImportedDatasetFilters = (): ImportedDatasetFilters => ({
  kind: 'imported',
  fifaVersion: 'all',
  sourceKind: 'all',
  playernameResult: 'all',
});

export const emptyConvertedDatasetFilters = (): ConvertedDatasetFilters => ({
  kind: 'converted',
  resultKind: 'all',
  sourceVersion: 'all',
  targetVersion: 'all',
  status: 'all',
});

const toFormValue = (filters: DatasetFilters): DatasetFilterFormValue => ({
  fifaVersion: filters.kind === 'imported' ? filters.fifaVersion : 'all',
  sourceKind: filters.kind === 'imported' ? filters.sourceKind : 'all',
  playernameResult: filters.kind === 'imported' ? filters.playernameResult : 'all',
  sourceVersion: filters.kind === 'converted' ? filters.sourceVersion : 'all',
  targetVersion: filters.kind === 'converted' ? filters.targetVersion : 'all',
  status: filters.kind === 'converted' ? filters.status : 'all',
  resultKind: filters.kind === 'converted' ? filters.resultKind : 'all',
});

@Component({
  selector: 'app-dataset-filter-drawer',
  imports: [MatButtonModule, MatFormFieldModule, MatIconModule, MatSelectModule],
  templateUrl: './dataset-filter-drawer.html',
  styleUrl: './dataset-filter-drawer.css',
})
export class DatasetFilterDrawer {
  protected readonly data = inject<DatasetFilterDrawerData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<DatasetFilterDrawer, DatasetFilters>);
  protected readonly kind = this.data.filters.kind;
  protected readonly fifaVersions = SUPPORTED_FIFA_VERSIONS;
  protected readonly filtersModel = signal(toFormValue(this.data.filters));

  protected setFifaVersion(fifaVersion: DatasetVersionFilter): void {
    this.filtersModel.update((filters) => ({ ...filters, fifaVersion }));
  }

  protected setSourceKind(sourceKind: DatasetSourceKind | 'all'): void {
    this.filtersModel.update((filters) => ({ ...filters, sourceKind }));
  }

  protected setSourceVersion(sourceVersion: DatasetVersionFilter): void {
    this.filtersModel.update((filters) => ({ ...filters, sourceVersion }));
  }

  protected setTargetVersion(targetVersion: DatasetVersionFilter): void {
    this.filtersModel.update((filters) => ({ ...filters, targetVersion }));
  }

  protected setStatus(status: DatasetStatus | 'all'): void {
    this.filtersModel.update((filters) => ({ ...filters, status }));
  }

  protected setResultKind(resultKind: DatasetResultKind | 'all'): void {
    this.filtersModel.update((filters) => ({ ...filters, resultKind }));
  }

  protected setPlayernameResult(playernameResult: PlayernameResultFilter): void {
    this.filtersModel.update((filters) => ({ ...filters, playernameResult }));
  }

  protected clearAll(): void {
    const filters =
      this.kind === 'imported' ? emptyImportedDatasetFilters() : emptyConvertedDatasetFilters();
    this.filtersModel.set(toFormValue(filters));
  }

  protected apply(): void {
    const value = this.filtersModel();
    this.dialogRef.close(
      this.kind === 'imported'
        ? {
            kind: 'imported',
            fifaVersion: value.fifaVersion,
            sourceKind: value.sourceKind,
            playernameResult: value.playernameResult,
          }
        : {
            kind: 'converted',
            resultKind: value.resultKind,
            sourceVersion: value.sourceVersion,
            targetVersion: value.targetVersion,
            status: value.status,
          },
    );
  }

  protected cancel(): void {
    this.dialogRef.close();
  }
}
