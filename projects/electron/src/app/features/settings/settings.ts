import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatTabsModule } from '@angular/material/tabs';

import type { DatasetKind } from '../../../../shared/contracts';
import { AppStore } from '../../core/app-store';
import { ConfirmationDialog } from '../../core/confirmation-dialog/confirmation-dialog';
import { DatasetColumnPreferences } from '../../core/dataset-column-preferences';
import { Theme, type ThemePreference } from '../../core/theme';
import { DatasetColumnEditor } from '../../shared/dataset-column-editor/dataset-column-editor';
import {
  type DatasetColumnPreference,
  type DatasetTableKind,
  columnsByDatasetTable,
  defaultDatasetColumnPreference,
} from '../../shared/dataset-column-editor/dataset-table-columns';
import { PageHeader } from '../../shared/page-header/page-header';

@Component({
  selector: 'app-settings',
  imports: [
    DatasetColumnEditor,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatDialogModule,
    MatIconModule,
    MatRadioModule,
    MatTabsModule,
    PageHeader,
  ],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings {
  protected readonly theme = inject(Theme);
  protected readonly store = inject(AppStore);
  private readonly dialog = inject(MatDialog);
  private readonly columnPreferences = inject(DatasetColumnPreferences);
  protected readonly columnDefinitions = columnsByDatasetTable;
  protected readonly defaultColumnPreference = defaultDatasetColumnPreference;
  protected readonly importedColumnPreference = signal(this.columnPreferences.load('imported'));
  protected readonly convertedColumnPreference = signal(this.columnPreferences.load('converted'));
  protected readonly deletionPending = signal(false);
  protected readonly deleteImported = signal(false);
  protected readonly deleteConverted = signal(false);
  protected readonly cleanupDisabled = computed(
    () => this.store.loading() || this.deletionPending(),
  );
  protected readonly selectedKinds = computed<DatasetKind[]>(() => {
    const kinds: DatasetKind[] = [];
    if (this.deleteImported() && this.store.importedDatasets().length) kinds.push('imported');
    if (this.deleteConverted() && this.store.convertedDatasets().length) kinds.push('converted');
    return kinds;
  });
  protected readonly canDelete = computed(
    () => !this.cleanupDisabled() && this.selectedKinds().length > 0,
  );

  protected setTheme(preference: ThemePreference): void {
    this.theme.set(preference);
  }

  protected saveColumns(table: DatasetTableKind, preference: DatasetColumnPreference): void {
    this.columnPreference(table).set(preference);
    this.columnPreferences.save(table, preference);
  }

  protected resetColumns(table: DatasetTableKind): void {
    this.columnPreferences.reset(table);
    this.columnPreference(table).set(defaultDatasetColumnPreference(table));
  }

  protected setCleanupSelection(kind: DatasetKind, checked: boolean): void {
    if (kind === 'imported') this.deleteImported.set(checked);
    else this.deleteConverted.set(checked);
  }

  protected confirmSelectedDeletion(): void {
    if (this.deletionPending() || this.store.loading()) return;
    const kinds = this.selectedKinds();
    if (!kinds.length) return;

    const importedCount = kinds.includes('imported') ? this.store.importedDatasets().length : 0;
    const convertedCount = kinds.includes('converted') ? this.store.convertedDatasets().length : 0;
    const data = this.confirmationData(importedCount, convertedCount);

    this.dialog
      .open(ConfirmationDialog, {
        data,
        role: 'alertdialog',
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) void this.deleteAllDatasets(kinds);
      });
  }

  private confirmationData(importedCount: number, convertedCount: number) {
    if (importedCount && convertedCount) {
      return {
        title: 'Delete all selected datasets?',
        message: `This will delete all ${this.datasetCount(importedCount, 'imported')} and ${this.datasetCount(convertedCount, 'converted')} managed by QDB Converter. Original source files and exported folders will not be deleted.`,
        confirmLabel: 'Delete selected datasets',
      };
    }

    if (importedCount) {
      return {
        title: 'Delete all imported datasets?',
        message: `This will delete all ${this.datasetCount(importedCount, 'managed imported')} from QDB Converter. Converted datasets, original source files, and exported folders will not be deleted.`,
        confirmLabel: 'Delete all imported datasets',
      };
    }

    return {
      title: 'Delete all converted datasets?',
      message: `This will delete all ${this.datasetCount(convertedCount, 'managed converted')} from QDB Converter. Imported datasets, original source files, and exported folders will not be deleted.`,
      confirmLabel: 'Delete all converted datasets',
    };
  }

  private datasetCount(count: number, description: string): string {
    return `${count} ${description} ${count === 1 ? 'dataset' : 'datasets'}`;
  }

  private columnPreference(table: DatasetTableKind) {
    return table === 'imported' ? this.importedColumnPreference : this.convertedColumnPreference;
  }

  private async deleteAllDatasets(kinds: DatasetKind[]): Promise<void> {
    if (this.deletionPending() || !kinds.length) return;
    this.deletionPending.set(true);
    try {
      if (await this.store.removeAllDatasets(kinds)) {
        this.deleteImported.set(false);
        this.deleteConverted.set(false);
      }
    } finally {
      this.deletionPending.set(false);
    }
  }
}
