import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, type PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';

import type { ConvertedDatasetDescriptor, DatasetResultKind } from '../../../../shared/contracts';
import { AppStore } from '../../core/app-store';
import { ConfirmationDialog } from '../../core/confirmation-dialog/confirmation-dialog';
import { DatasetColumnPreferences } from '../../core/dataset-column-preferences';
import { DatasetNameDialog } from '../../core/dataset-name-dialog/dataset-name-dialog';
import {
  DatasetColumnDrawer,
  type DatasetColumnDrawerData,
} from '../../shared/dataset-column-drawer/dataset-column-drawer';
import {
  type DatasetColumnPreference,
  columnsByDatasetTable,
  defaultDatasetColumnPreference,
  visibleDatasetColumns,
} from '../../shared/dataset-column-editor/dataset-table-columns';
import {
  type ConvertedDatasetFilters,
  DatasetFilterDrawer,
  type DatasetFilterDrawerData,
  type DatasetFilters,
  emptyConvertedDatasetFilters,
} from '../../shared/dataset-filter-drawer/dataset-filter-drawer';
import { PageHeader } from '../../shared/page-header/page-header';
import { StatusBadge } from '../../shared/status-badge/status-badge';
import {
  ConvertedDatasetDetailsDialog,
  type ConvertedDatasetDetailsDialogResult,
} from './converted-dataset-details-dialog';

@Component({
  selector: 'app-converted-datasets',
  imports: [
    DatePipe,
    DecimalPipe,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatTableModule,
    PageHeader,
    RouterLink,
    StatusBadge,
  ],
  templateUrl: './converted-datasets.html',
  styleUrl: './converted-datasets.css',
})
export class ConvertedDatasets {
  protected readonly store = inject(AppStore);
  private readonly dialog = inject(MatDialog);
  private readonly columnPreferences = inject(DatasetColumnPreferences);
  protected readonly query = signal('');
  private readonly filters = signal<ConvertedDatasetFilters>(emptyConvertedDatasetFilters());
  protected readonly activeFilterCount = computed(() => {
    const filters = this.filters();
    return (
      Number(filters.sourceVersion !== 'all') +
      Number(filters.targetVersion !== 'all') +
      Number(filters.resultKind !== 'all') +
      Number(filters.status !== 'all')
    );
  });
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(25);
  protected readonly pageSizeOptions = [10, 25, 50, 100];
  protected readonly selectedIds = signal<ReadonlySet<string>>(new Set());
  protected readonly deletionPending = signal(false);
  protected readonly columnDefinitions = columnsByDatasetTable.converted;
  private readonly columnPreference = signal(this.columnPreferences.load('converted'));
  protected readonly columns = computed(() => visibleDatasetColumns(this.columnPreference()));
  protected readonly displayedColumns = computed<readonly string[]>(() => [
    'select',
    ...this.columns(),
  ]);
  protected readonly hiddenColumnCount = computed(
    () => this.columnDefinitions.length - this.columns().length,
  );
  protected readonly filtered = computed(() => {
    const query = this.query().trim().toLocaleLowerCase();
    const filters = this.filters();
    return this.store
      .convertedDatasets()
      .filter(
        (dataset) =>
          filters.sourceVersion === 'all' || dataset.sourceVersion === filters.sourceVersion,
      )
      .filter(
        (dataset) =>
          filters.targetVersion === 'all' || dataset.fifaVersion === filters.targetVersion,
      )
      .filter(
        (dataset) => filters.resultKind === 'all' || dataset.resultKind === filters.resultKind,
      )
      .filter((dataset) => filters.status === 'all' || dataset.status === filters.status)
      .filter((dataset) =>
        [
          dataset.name,
          dataset.sourceDatasetName,
          dataset.status,
          this.resultKindLabel(dataset.resultKind),
          String(dataset.sourceVersion),
          String(dataset.fifaVersion),
        ]
          .join(' ')
          .toLocaleLowerCase()
          .includes(query),
      )
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  });
  protected readonly effectivePageIndex = computed(() => {
    const pageCount = Math.ceil(this.filtered().length / this.pageSize());
    return Math.min(this.pageIndex(), Math.max(0, pageCount - 1));
  });
  protected readonly paged = computed(() => {
    const startIndex = this.effectivePageIndex() * this.pageSize();
    return this.filtered().slice(startIndex, startIndex + this.pageSize());
  });
  protected readonly selectedCount = computed(() => this.selectedIds().size);
  protected readonly allRowsSelected = computed(() => {
    const rows = this.paged();
    const selectedIds = this.selectedIds();
    return rows.length > 0 && rows.every((dataset) => selectedIds.has(dataset.id));
  });
  protected readonly someRowsSelected = computed(() => {
    const rows = this.paged();
    const selectedIds = this.selectedIds();
    return !this.allRowsSelected() && rows.some((dataset) => selectedIds.has(dataset.id));
  });

  protected setQuery(event: Event): void {
    this.clearSelection();
    this.pageIndex.set(0);
    this.query.set((event.target as HTMLInputElement).value);
  }

  protected resultKindLabel(kind: DatasetResultKind): string {
    switch (kind) {
      case 'conversion':
        return 'Conversion';
      case 'playernames-minimize':
        return 'Playernames minimize';
      case 'playernames-remove-unused':
        return 'Remove unused names';
      case 'playernames-combined':
        return 'Remove unused + minimize';
    }
  }

  protected openFilters(): void {
    this.dialog
      .open<DatasetFilterDrawer, DatasetFilterDrawerData, DatasetFilters>(DatasetFilterDrawer, {
        ariaLabelledBy: 'dataset-filter-title',
        ariaModal: true,
        autoFocus: 'first-tabbable',
        data: { filters: { ...this.filters() } },
        delayFocusTrap: false,
        disableClose: false,
        height: '100vh',
        maxHeight: '100vh',
        maxWidth: '100vw',
        panelClass: 'dataset-filter-drawer-panel',
        position: { right: '0', top: '0' },
        restoreFocus: true,
        width: '28rem',
      })
      .afterClosed()
      .subscribe((filters) => {
        if (filters?.kind !== 'converted') return;
        this.applyFilters(filters);
      });
  }

  protected openColumns(): void {
    this.dialog
      .open<DatasetColumnDrawer, DatasetColumnDrawerData, DatasetColumnPreference>(
        DatasetColumnDrawer,
        {
          ariaLabelledBy: 'dataset-column-title',
          ariaModal: true,
          autoFocus: 'first-tabbable',
          data: {
            table: 'converted',
            columns: this.columnDefinitions,
            preference: this.columnPreference(),
            defaultPreference: defaultDatasetColumnPreference('converted'),
          },
          delayFocusTrap: false,
          disableClose: false,
          height: '100vh',
          maxHeight: '100vh',
          maxWidth: '100vw',
          panelClass: 'dataset-column-drawer-panel',
          position: { right: '0', top: '0' },
          restoreFocus: true,
          width: '28rem',
        },
      )
      .afterClosed()
      .subscribe((preference) => {
        if (!preference) return;
        this.columnPreferences.save('converted', preference);
        this.columnPreference.set(preference);
      });
  }

  protected clearFilters(): void {
    this.clearSelection();
    this.query.set('');
    this.filters.set(emptyConvertedDatasetFilters());
    this.pageIndex.set(0);
  }

  protected pageChanged(event: PageEvent): void {
    this.clearSelection();
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  protected showDetails(dataset: ConvertedDatasetDescriptor): void {
    this.dialog
      .open<
        ConvertedDatasetDetailsDialog,
        ConvertedDatasetDescriptor,
        ConvertedDatasetDetailsDialogResult
      >(ConvertedDatasetDetailsDialog, {
        data: dataset,
        width: '720px',
        maxWidth: 'calc(100vw - 2rem)',
        autoFocus: 'dialog',
        restoreFocus: true,
      })
      .afterClosed()
      .subscribe((result) => {
        if (result === 'rename') this.rename(dataset);
      });
  }

  protected rename(dataset: ConvertedDatasetDescriptor): void {
    this.dialog
      .open(DatasetNameDialog, {
        data: { name: dataset.name },
        width: '440px',
        maxWidth: 'calc(100vw - 2rem)',
        ariaDescribedBy: 'dataset-name-dialog-description',
        autoFocus: '[data-dialog-primary-field]',
        restoreFocus: true,
      })
      .afterClosed()
      .subscribe((name: string | undefined) => {
        if (name && name !== dataset.name) void this.store.renameConvertedDataset(dataset.id, name);
      });
  }

  protected remove(dataset: ConvertedDatasetDescriptor): void {
    if (this.deletionPending()) return;
    this.dialog
      .open(ConfirmationDialog, {
        data: {
          title: 'Delete converted dataset?',
          message: `The managed converted snapshot for “${dataset.name}” will be deleted. Previously exported folders remain untouched.`,
          confirmLabel: 'Delete',
        },
        role: 'alertdialog',
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) void this.deleteDataset(dataset.id);
      });
  }

  protected isSelected(dataset: ConvertedDatasetDescriptor): boolean {
    return this.selectedIds().has(dataset.id);
  }

  protected toggleRow(dataset: ConvertedDatasetDescriptor, checked: boolean): void {
    this.selectedIds.update((selectedIds) => {
      const next = new Set(selectedIds);
      if (checked) next.add(dataset.id);
      else next.delete(dataset.id);
      return next;
    });
  }

  protected toggleAllRows(checked: boolean): void {
    this.selectedIds.set(checked ? new Set(this.paged().map((dataset) => dataset.id)) : new Set());
  }

  protected confirmSelectedDeletion(): void {
    if (this.deletionPending()) return;
    const count = this.selectedCount();
    if (!count) return;
    const subject = count === 1 ? 'dataset' : 'datasets';
    const snapshots = count === 1 ? 'snapshot' : 'snapshots';
    this.dialog
      .open(ConfirmationDialog, {
        data: {
          title: `Delete selected ${subject}?`,
          message: `The managed converted ${snapshots} for ${count} selected ${subject} will be deleted. Imported datasets and previously exported folders remain untouched.`,
          confirmLabel: `Delete ${count} ${subject}`,
        },
        role: 'alertdialog',
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) void this.deleteSelectedDatasets();
      });
  }

  private clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  private applyFilters(filters: ConvertedDatasetFilters): void {
    this.clearSelection();
    this.filters.set({ ...filters });
    this.pageIndex.set(0);
  }

  private async deleteDataset(id: string): Promise<void> {
    this.deletionPending.set(true);
    try {
      if (await this.store.removeConvertedDataset(id)) this.clearSelection();
    } finally {
      this.deletionPending.set(false);
    }
  }

  private async deleteSelectedDatasets(): Promise<void> {
    const ids = [...this.selectedIds()];
    if (!ids.length || this.deletionPending()) return;
    this.deletionPending.set(true);
    try {
      if (await this.store.removeConvertedDatasets(ids)) this.clearSelection();
    } finally {
      this.deletionPending.set(false);
    }
  }
}
