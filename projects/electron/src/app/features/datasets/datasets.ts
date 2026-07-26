import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import type { DatasetDescriptor } from '../../../../shared/contracts';
import { AppStore } from '../../core/app-store';
import { ConfirmationDialog } from '../../core/confirmation-dialog/confirmation-dialog';
import { DatasetNameDialog } from '../../core/dataset-name-dialog/dataset-name-dialog';
import { ImportDatasetsDialog } from '../import-datasets-dialog/import-datasets-dialog';

@Component({
  selector: 'app-datasets',
  imports: [
    DatePipe,
    MatButtonModule,
    MatChipsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatProgressBarModule,
    MatSelectModule,
    MatTableModule,
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
  protected readonly columns = [
    'name',
    'version',
    'source',
    'tables',
    'imported',
    'status',
    'actions',
  ];
  protected readonly filtered = computed(() => {
    const query = this.query().trim().toLocaleLowerCase();
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
      .sort((left, right) => right.source.importedAt.localeCompare(left.source.importedAt));
  });

  protected openImport(): void {
    this.dialog.open(ImportDatasetsDialog, { width: '900px', maxWidth: '96vw' });
  }

  protected rename(dataset: DatasetDescriptor): void {
    this.dialog
      .open(DatasetNameDialog, { data: { name: dataset.name }, width: '420px' })
      .afterClosed()
      .subscribe((name: string | undefined) => {
        if (name && name !== dataset.name) void this.store.renameDataset(dataset.id, name);
      });
  }

  protected remove(dataset: DatasetDescriptor): void {
    this.dialog
      .open(ConfirmationDialog, {
        data: {
          title: 'Remove dataset?',
          message: `The managed snapshot for “${dataset.name}” will be deleted. Conversion history and external output remain untouched.`,
          confirmLabel: 'Remove',
        },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) void this.store.removeDataset(dataset.id);
      });
  }

  protected setQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  protected setVersion(value: string): void {
    this.version.set(value);
  }

  protected setSource(value: string): void {
    this.source.set(value);
  }
}
