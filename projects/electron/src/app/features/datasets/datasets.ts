import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, type PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule, type Sort, type SortDirection } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import type { DatasetDescriptor } from '../../../../shared/contracts';
import { AppStore } from '../../core/app-store';
import { ConfirmationDialog } from '../../core/confirmation-dialog/confirmation-dialog';
import { DatasetNameDialog } from '../../core/dataset-name-dialog/dataset-name-dialog';
import { StatusBadge } from '../../shared/status-badge/status-badge';
import { DatasetDetailsDialog } from './dataset-details-dialog';
import { DatasetValidationDialog } from './dataset-validation-dialog';

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
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatSelectModule,
    MatSortModule,
    MatTableModule,
    RouterLink,
    StatusBadge,
  ],
  templateUrl: './datasets.html',
  styleUrl: './datasets.css',
})
export class Datasets {
  protected readonly store = inject(AppStore);
  private readonly dialog = inject(MatDialog);
  protected readonly query = signal('');
  protected readonly version = signal('all');
  protected readonly source = signal('all');
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(25);
  protected readonly pageSizeOptions = [10, 25, 50, 100];
  protected readonly sort = signal<DatasetSort>({ active: 'imported', direction: 'desc' });
  protected readonly sortAnnouncement = signal('');
  protected readonly selectedIds = signal<ReadonlySet<string>>(new Set());
  protected readonly deletionPending = signal(false);
  protected readonly columns = [
    'select',
    'name',
    'version',
    'source',
    'tables',
    'rows',
    'imported',
    'status',
    'actions',
  ];
  protected readonly filtered = computed(() => {
    const query = this.query().trim().toLocaleLowerCase();
    const sort = this.sort();
    return this.store
      .datasets()
      .filter(
        (dataset) => this.version() === 'all' || dataset.fifaVersion === Number(this.version()),
      )
      .filter((dataset) => this.source() === 'all' || dataset.source.kind === this.source())
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

  protected showDetails(dataset: DatasetDescriptor): void {
    this.dialog.open(DatasetDetailsDialog, {
      data: dataset,
      width: '520px',
      maxWidth: 'calc(100vw - 2rem)',
      autoFocus: 'dialog',
    });
  }

  protected rename(dataset: DatasetDescriptor): void {
    this.dialog
      .open(DatasetNameDialog, { data: { name: dataset.name }, width: '420px' })
      .afterClosed()
      .subscribe((name: string | undefined) => {
        if (name && name !== dataset.name) void this.store.renameDataset(dataset.id, name);
      });
  }

  protected validate(dataset: DatasetDescriptor): void {
    this.dialog.open(DatasetValidationDialog, {
      data: dataset,
      width: '900px',
      maxWidth: 'calc(100vw - 2rem)',
      autoFocus: 'dialog',
    });
  }

  protected remove(dataset: DatasetDescriptor): void {
    if (this.deletionPending()) return;
    this.dialog
      .open(ConfirmationDialog, {
        data: {
          title: 'Delete dataset?',
          message: `The managed snapshot for “${dataset.name}” will be deleted. Conversion history and external output remain untouched.`,
          confirmLabel: 'Delete',
        },
        role: 'alertdialog',
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) void this.deleteDataset(dataset.id);
      });
  }

  protected isSelected(dataset: DatasetDescriptor): boolean {
    return this.selectedIds().has(dataset.id);
  }

  protected toggleRow(dataset: DatasetDescriptor, checked: boolean): void {
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
          message: `The managed ${snapshots} for ${count} selected ${subject} will be deleted. Conversion history and external output remain untouched.`,
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

  protected setVersion(value: string): void {
    this.clearSelection();
    this.pageIndex.set(0);
    this.version.set(value);
  }

  protected setSource(value: string): void {
    this.clearSelection();
    this.pageIndex.set(0);
    this.source.set(value);
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
    this.version.set('all');
    this.source.set('all');
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

  private compareDatasets(
    left: DatasetDescriptor,
    right: DatasetDescriptor,
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
      if (await this.store.removeDataset(id)) this.clearSelection();
    } finally {
      this.deletionPending.set(false);
    }
  }

  private async deleteSelectedDatasets(): Promise<void> {
    const ids = [...this.selectedIds()];
    if (!ids.length || this.deletionPending()) return;
    this.deletionPending.set(true);
    try {
      if (await this.store.removeDatasets(ids)) this.clearSelection();
    } finally {
      this.deletionPending.set(false);
    }
  }
}
