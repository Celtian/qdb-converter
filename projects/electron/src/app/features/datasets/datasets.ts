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
import { MatSortModule, type Sort, type SortDirection } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import type { ImportedDatasetDescriptor } from '../../../../shared/contracts';
import { AppStore } from '../../core/app-store';
import { ConfirmationDialog } from '../../core/confirmation-dialog/confirmation-dialog';
import { DatasetColumnPreferences } from '../../core/dataset-column-preferences';
import { DatasetNameDialog } from '../../core/dataset-name-dialog/dataset-name-dialog';
import {
  DatasetColumnDrawer,
  type DatasetColumnDrawerData,
} from '../../shared/dataset-column-drawer/dataset-column-drawer';
import {
  columnsByDatasetTable,
  defaultDatasetColumnPreference,
  type DatasetColumnPreference,
  visibleDatasetColumns,
} from '../../shared/dataset-column-editor/dataset-table-columns';
import {
  DatasetFilterDrawer,
  type DatasetFilterDrawerData,
  type DatasetFilters,
  emptyImportedDatasetFilters,
  type ImportedDatasetFilters,
} from '../../shared/dataset-filter-drawer/dataset-filter-drawer';
import { StatusBadge } from '../../shared/status-badge/status-badge';
import { DatasetDetailsDialog, type DatasetDetailsDialogResult } from './dataset-details-dialog';

type DatasetSortKey = 'imported' | 'name' | 'rows' | 'source' | 'status' | 'tables' | 'version';

interface DatasetSort {
  active: DatasetSortKey;
  direction: Exclude<SortDirection, ''>;
}

const sortLabels: Record<DatasetSortKey, string> = {
  imported: 'Imported',
  name: 'Name',
  rows: 'Rows',
  source: 'Source',
  status: 'Status',
  tables: 'Tables',
  version: 'Version',
};

@Component({
  selector: 'app-datasets',
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
    MatSortModule,
    MatTableModule,
    RouterLink,
    StatusBadge,
  ],
  templateUrl: './datasets.html',
  styleUrl: './datasets.css',
})
export class ImportedDatasets {
  protected readonly store = inject(AppStore);
  private readonly dialog = inject(MatDialog);
  private readonly columnPreferences = inject(DatasetColumnPreferences);
  protected readonly query = signal('');
  private readonly filters = signal<ImportedDatasetFilters>(emptyImportedDatasetFilters());
  protected readonly activeFilterCount = computed(() => {
    const filters = this.filters();
    return Number(filters.fifaVersion !== 'all') + Number(filters.sourceKind !== 'all');
  });
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(25);
  protected readonly pageSizeOptions = [10, 25, 50, 100];
  protected readonly sort = signal<DatasetSort>({ active: 'imported', direction: 'desc' });
  protected readonly sortAnnouncement = signal('');
  protected readonly selectedIds = signal<ReadonlySet<string>>(new Set());
  protected readonly deletionPending = signal(false);
  protected readonly columnDefinitions = columnsByDatasetTable.imported;
  private readonly columnPreference = signal(this.columnPreferences.load('imported'));
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
    const sort = this.sort();
    return this.store
      .importedDatasets()
      .filter(
        (dataset) => filters.fifaVersion === 'all' || dataset.fifaVersion === filters.fifaVersion,
      )
      .filter(
        (dataset) => filters.sourceKind === 'all' || dataset.source.kind === filters.sourceKind,
      )
      .filter((dataset) =>
        [
          dataset.name,
          dataset.source.kind,
          String(dataset.fifaVersion),
          ...dataset.source.originalPaths,
        ]
          .join(' ')
          .toLocaleLowerCase()
          .includes(query),
      )
      .sort((left, right) => this.compareDatasets(left, right, sort));
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

  protected showDetails(dataset: ImportedDatasetDescriptor): void {
    this.dialog
      .open<DatasetDetailsDialog, ImportedDatasetDescriptor, DatasetDetailsDialogResult>(
        DatasetDetailsDialog,
        {
          data: dataset,
          width: '520px',
          maxWidth: 'calc(100vw - 2rem)',
          autoFocus: 'dialog',
        },
      )
      .afterClosed()
      .subscribe((result) => {
        if (result === 'rename') this.rename(dataset);
      });
  }

  protected rename(dataset: ImportedDatasetDescriptor): void {
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
        if (name && name !== dataset.name) void this.store.renameImportedDataset(dataset.id, name);
      });
  }

  protected remove(dataset: ImportedDatasetDescriptor): void {
    if (this.deletionPending()) return;
    this.dialog
      .open(ConfirmationDialog, {
        data: {
          title: 'Delete dataset?',
          message: `The managed imported snapshot for “${dataset.name}” will be deleted. Converted datasets and exported folders remain untouched.`,
          confirmLabel: 'Delete',
        },
        role: 'alertdialog',
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) void this.deleteDataset(dataset.id);
      });
  }

  protected isSelected(dataset: ImportedDatasetDescriptor): boolean {
    return this.selectedIds().has(dataset.id);
  }

  protected toggleRow(dataset: ImportedDatasetDescriptor, checked: boolean): void {
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
          message: `The managed imported ${snapshots} for ${count} selected ${subject} will be deleted. Converted datasets and exported folders remain untouched.`,
          confirmLabel: `Delete ${count} ${subject}`,
        },
        role: 'alertdialog',
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) void this.deleteSelectedDatasets();
      });
  }

  protected setQuery(event: Event): void {
    this.clearSelection();
    this.pageIndex.set(0);
    this.query.set((event.target as HTMLInputElement).value);
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
        if (filters?.kind !== 'imported') return;
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
            table: 'imported',
            columns: this.columnDefinitions,
            preference: this.columnPreference(),
            defaultPreference: defaultDatasetColumnPreference('imported'),
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
        if (preference) this.applyColumns(preference);
      });
  }

  protected sortChanged(sort: Sort): void {
    if (!this.isSortKey(sort.active) || !sort.direction) return;
    this.clearSelection();
    this.pageIndex.set(0);
    this.sort.set({ active: sort.active, direction: sort.direction });
    this.sortAnnouncement.set(
      `Sorted by ${sortLabels[sort.active]} ${sort.direction === 'asc' ? 'ascending' : 'descending'}.`,
    );
  }

  protected clearFilters(): void {
    this.clearSelection();
    this.query.set('');
    this.filters.set(emptyImportedDatasetFilters());
    this.pageIndex.set(0);
  }

  protected pageChanged(event: PageEvent): void {
    this.clearSelection();
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  private clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  private applyFilters(filters: ImportedDatasetFilters): void {
    this.clearSelection();
    this.filters.set({ ...filters });
    this.pageIndex.set(0);
  }

  private applyColumns(preference: DatasetColumnPreference): void {
    this.columnPreferences.save('imported', preference);
    this.columnPreference.set(preference);
    if (visibleDatasetColumns(preference).includes(this.sort().active)) return;
    this.sort.set({ active: 'name', direction: 'asc' });
    this.pageIndex.set(0);
    this.sortAnnouncement.set('Sorted by Name ascending.');
  }

  private compareDatasets(
    left: ImportedDatasetDescriptor,
    right: ImportedDatasetDescriptor,
    sort: DatasetSort,
  ): number {
    const direction = sort.direction === 'asc' ? 1 : -1;
    let comparison: number;

    switch (sort.active) {
      case 'name':
        comparison = left.name.localeCompare(right.name);
        break;
      case 'version':
        comparison = left.fifaVersion - right.fifaVersion;
        break;
      case 'source':
        comparison = left.source.kind.localeCompare(right.source.kind);
        break;
      case 'tables':
        comparison = left.tableCount - right.tableCount;
        break;
      case 'rows':
        comparison = left.rowCount - right.rowCount;
        break;
      case 'imported':
        comparison = left.source.importedAt.localeCompare(right.source.importedAt);
        break;
      case 'status':
        comparison = left.status.localeCompare(right.status);
        break;
    }

    return comparison === 0 ? left.name.localeCompare(right.name) : comparison * direction;
  }

  private isSortKey(value: string): value is DatasetSortKey {
    return value in sortLabels;
  }

  private async deleteDataset(id: string): Promise<void> {
    this.deletionPending.set(true);
    try {
      if (await this.store.removeImportedDataset(id)) this.clearSelection();
    } finally {
      this.deletionPending.set(false);
    }
  }

  private async deleteSelectedDatasets(): Promise<void> {
    const ids = [...this.selectedIds()];
    if (!ids.length || this.deletionPending()) return;
    this.deletionPending.set(true);
    try {
      if (await this.store.removeImportedDatasets(ids)) this.clearSelection();
    } finally {
      this.deletionPending.set(false);
    }
  }
}
