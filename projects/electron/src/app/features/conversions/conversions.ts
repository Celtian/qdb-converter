import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, type PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import type { ConversionRecord } from '../../../../shared/contracts';
import { AppStore } from '../../core/app-store';
import { ConfirmationDialog } from '../../core/confirmation-dialog/confirmation-dialog';
import { DesktopApi } from '../../core/desktop-api';
import { StatusBadge } from '../../shared/status-badge/status-badge';

@Component({
  selector: 'app-conversions',
  imports: [
    DatePipe,
    DecimalPipe,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatPaginatorModule,
    MatTableModule,
    StatusBadge,
  ],
  templateUrl: './conversions.html',
  styleUrl: './conversions.css',
})
export class Conversions {
  protected readonly store = inject(AppStore);
  private readonly desktop = inject(DesktopApi);
  private readonly dialog = inject(MatDialog);
  protected readonly query = signal('');
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(25);
  protected readonly pageSizeOptions = [10, 25, 50, 100];
  protected readonly columns = [
    'dataset',
    'versions',
    'status',
    'tables',
    'completed',
    'duration',
    'actions',
  ];
  protected readonly filtered = computed(() => {
    const query = this.query().trim().toLocaleLowerCase();
    return this.store
      .conversions()
      .filter((record) =>
        [
          record.datasetName,
          record.status,
          record.outputPath ?? '',
          String(record.sourceVersion),
          String(record.targetVersion),
        ]
          .join(' ')
          .toLocaleLowerCase()
          .includes(query),
      )
      .sort((left, right) => right.completedAt.localeCompare(left.completedAt));
  });
  protected readonly effectivePageIndex = computed(() => {
    const pageCount = Math.ceil(this.filtered().length / this.pageSize());
    return Math.min(this.pageIndex(), Math.max(0, pageCount - 1));
  });
  protected readonly paged = computed(() => {
    const startIndex = this.effectivePageIndex() * this.pageSize();
    return this.filtered().slice(startIndex, startIndex + this.pageSize());
  });

  protected setQuery(event: Event): void {
    this.pageIndex.set(0);
    this.query.set((event.target as HTMLInputElement).value);
  }

  protected clearSearch(): void {
    this.query.set('');
    this.pageIndex.set(0);
  }

  protected pageChanged(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  protected reveal(record: ConversionRecord): void {
    if (record.outputPath) void this.desktop.revealOutput(record.outputPath);
  }

  protected async retry(record: ConversionRecord): Promise<void> {
    const outputParentPath = record.outputPath?.replace(/[\\/][^\\/]+$/, '');
    if (!outputParentPath) return;
    await this.store.runConversion({
      requestId: crypto.randomUUID(),
      datasetIds: [record.datasetId],
      targetVersion: record.targetVersion,
      tables: record.selectedTables,
      outputParentPath,
      extendContracts: false,
    });
  }

  protected remove(record: ConversionRecord): void {
    this.dialog
      .open(ConfirmationDialog, {
        data: {
          title: 'Remove history entry?',
          message:
            'Only this catalog record is removed. The external output folder is never deleted.',
          confirmLabel: 'Remove',
        },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) void this.store.removeConversion(record.id);
      });
  }
}
