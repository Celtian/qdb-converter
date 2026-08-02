import { Component, computed, inject, signal } from '@angular/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatStepperModule } from '@angular/material/stepper';

import type {
  ConvertedDatasetDescriptor,
  DatasetKind,
  DatasetValidationResult,
  ImportedDatasetDescriptor,
} from '../../../../shared/contracts';
import { AppStore } from '../../core/app-store';
import { ConfettiService } from '../../core/confetti/confetti.service';
import { DesktopApi } from '../../core/desktop-api';
import { StatusBadge } from '../../shared/status-badge/status-badge';
import { ValidationReport } from '../../shared/validation-report/validation-report';

type ValidatableDatasetDescriptor = ImportedDatasetDescriptor | ConvertedDatasetDescriptor;

const datasetSearchDetails = (dataset: ValidatableDatasetDescriptor): string[] =>
  'sourceDatasetName' in dataset
    ? [dataset.sourceDatasetName, `FIFA ${dataset.sourceVersion}`]
    : [dataset.source.kind, ...dataset.source.originalPaths];

@Component({
  selector: 'app-validate-dataset',
  imports: [
    MatAutocompleteModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatStepperModule,
    StatusBadge,
    ValidationReport,
  ],
  templateUrl: './validate-dataset.html',
  styleUrl: './validate-dataset.css',
})
export class ValidateDataset {
  protected readonly store = inject(AppStore);
  private readonly confetti = inject(ConfettiService);
  private readonly desktop = inject(DesktopApi);
  private validationRequestId = 0;

  protected readonly selectedDatasetKind = signal<DatasetKind | undefined>(undefined);
  protected readonly selectedDatasetId = signal('');
  protected readonly datasetQuery = signal('');
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly result = signal<DatasetValidationResult | undefined>(undefined);
  protected readonly lastValidatedKey = signal('');
  protected readonly availableDatasets = computed<readonly ValidatableDatasetDescriptor[]>(() => {
    switch (this.selectedDatasetKind()) {
      case 'imported':
        return this.store.importedDatasets();
      case 'converted':
        return this.store.convertedDatasets();
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
        dataset.status,
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
    this.clearValidation();
  }

  protected selectDataset(id: string): void {
    this.selectedDatasetId.set(id);
    this.datasetQuery.set(this.displayDatasetName(id));
    this.clearValidation();
  }

  protected filterDatasets(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.datasetQuery.set(event.target.value);
    this.selectedDatasetId.set('');
    this.clearValidation();
  }

  protected restoreDatasetQuery(): void {
    this.datasetQuery.set(this.selectedDataset()?.name ?? '');
  }

  protected stepChanged(index: number): void {
    const key = this.selectionKey();
    if (index === 2 && key && key !== this.lastValidatedKey()) void this.run();
  }

  protected async run(): Promise<void> {
    const datasetKind = this.selectedDatasetKind();
    const dataset = this.selectedDataset();
    if (!datasetKind || !dataset) return;

    const requestId = ++this.validationRequestId;
    const key = `${datasetKind}:${dataset.id}`;
    this.lastValidatedKey.set(key);
    this.loading.set(true);
    this.error.set('');
    this.result.set(undefined);
    try {
      const result = await this.desktop.validateDataset({
        datasetKind,
        datasetId: dataset.id,
      });
      if (requestId === this.validationRequestId && key === this.selectionKey()) {
        this.result.set(result);
        if (result.errorCount === 0) this.confetti.celebrate();
      }
    } catch (error) {
      if (requestId === this.validationRequestId && key === this.selectionKey())
        this.error.set(error instanceof Error ? error.message : String(error));
    } finally {
      if (requestId === this.validationRequestId) this.loading.set(false);
    }
  }

  protected datasetOrigin(dataset: ValidatableDatasetDescriptor): string {
    if ('sourceDatasetName' in dataset)
      return `Converted from ${dataset.sourceDatasetName} · FIFA ${dataset.sourceVersion} to FIFA ${dataset.fifaVersion}`;
    return dataset.source.kind === 't3db' ? 'Imported from t3db' : 'Imported from a text folder';
  }

  private selectionKey(): string {
    const kind = this.selectedDatasetKind();
    const id = this.selectedDatasetId();
    return kind && id ? `${kind}:${id}` : '';
  }

  private clearValidation(): void {
    this.validationRequestId += 1;
    this.loading.set(false);
    this.error.set('');
    this.result.set(undefined);
    this.lastValidatedKey.set('');
  }
}
