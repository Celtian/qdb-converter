import { Component, computed, inject, signal } from '@angular/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRadioModule } from '@angular/material/radio';
import { MatStepperModule } from '@angular/material/stepper';

import type {
  ConvertedDatasetDescriptor,
  DatasetKind,
  ExportDatasetResult,
  ImportedDatasetDescriptor,
} from '../../../../shared/contracts';
import { AppStore } from '../../core/app-store';
import { ConfettiService } from '../../core/confetti/confetti.service';

type ExportableDatasetDescriptor = ImportedDatasetDescriptor | ConvertedDatasetDescriptor;

const datasetSearchDetails = (dataset: ExportableDatasetDescriptor): string[] =>
  'sourceDatasetName' in dataset
    ? [dataset.sourceDatasetName]
    : [dataset.source.kind, ...dataset.source.originalPaths];

@Component({
  selector: 'app-export-dataset',
  imports: [
    MatAutocompleteModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatRadioModule,
    MatStepperModule,
  ],
  templateUrl: './export-dataset.html',
  styleUrl: './export-dataset.css',
})
export class ExportDataset {
  protected readonly store = inject(AppStore);
  private readonly confetti = inject(ConfettiService);
  protected readonly selectedDatasetKind = signal<DatasetKind | undefined>(undefined);
  protected readonly selectedDatasetId = signal('');
  protected readonly datasetQuery = signal('');
  protected readonly targetParentPath = signal('');
  protected readonly result = signal<ExportDatasetResult | undefined>(undefined);
  protected readonly availableDatasets = computed<readonly ExportableDatasetDescriptor[]>(() => {
    switch (this.selectedDatasetKind()) {
      case 'imported':
        return this.store.availableImportedDatasets();
      case 'converted':
        return this.store.availableConvertedDatasets();
      default:
        return [];
    }
  });
  protected readonly datasetTypeLabel = computed(() => {
    switch (this.selectedDatasetKind()) {
      case 'imported':
        return 'Imported';
      case 'converted':
        return 'Converted';
      default:
        return 'Available';
    }
  });
  protected readonly selectedDataset = computed(() =>
    this.availableDatasets().find((dataset) => dataset.id === this.selectedDatasetId()),
  );
  protected readonly filteredDatasets = computed(() => {
    const query = this.datasetQuery().trim().toLocaleLowerCase('en');
    const datasets = this.availableDatasets();
    if (!query) return datasets;

    return datasets.filter((dataset) =>
      [
        dataset.name,
        ...datasetSearchDetails(dataset),
        `FIFA ${dataset.fifaVersion}`,
        `${dataset.tableCount} tables`,
        `${dataset.rowCount} rows`,
      ]
        .join(' ')
        .toLocaleLowerCase('en')
        .includes(query),
    );
  });
  protected readonly displayDatasetName = (id: string): string =>
    this.availableDatasets().find((dataset) => dataset.id === id)?.name ?? '';

  protected selectDatasetKind(kind: DatasetKind): void {
    if (kind === this.selectedDatasetKind()) return;
    this.selectedDatasetKind.set(kind);
    this.selectedDatasetId.set('');
    this.datasetQuery.set('');
    this.result.set(undefined);
  }

  protected selectDataset(id: string): void {
    this.selectedDatasetId.set(id);
    this.datasetQuery.set(this.displayDatasetName(id));
    this.result.set(undefined);
  }

  protected filterDatasets(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.datasetQuery.set(event.target.value);
    this.selectedDatasetId.set('');
    this.result.set(undefined);
  }

  protected restoreDatasetQuery(): void {
    this.datasetQuery.set(this.selectedDataset()?.name ?? '');
  }

  protected async chooseTargetFolder(): Promise<void> {
    const path = await this.store.selectExportDirectory();
    if (path) {
      this.targetParentPath.set(path);
      this.result.set(undefined);
    }
  }

  protected async export(): Promise<void> {
    const datasetKind = this.selectedDatasetKind();
    const dataset = this.selectedDataset();
    const targetParentPath = this.targetParentPath();
    if (!datasetKind || !dataset || !targetParentPath || this.store.loading()) return;
    this.result.set(undefined);
    try {
      const result = await this.store.exportDataset({
        datasetKind,
        datasetId: dataset.id,
        targetParentPath,
      });
      this.result.set(result);
      this.confetti.celebrate();
    } catch {
      // The store exposes the user-facing error.
    }
  }

  protected reveal(): void {
    const path = this.result()?.outputPath;
    if (path) this.store.revealExport(path);
  }
}
