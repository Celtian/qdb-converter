import { Component, computed, inject, signal } from '@angular/core';
import { FormField, form, maxLength, required } from '@angular/forms/signals';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { RouterLink } from '@angular/router';
import type { CreateConvertedDatasetResult } from '../../../../shared/contracts';
import { fieldsFor, SUPPORTED_FIFA_VERSIONS } from '../../../../shared/table-config';
import { AppStore } from '../../core/app-store';

@Component({
  selector: 'app-convert',
  imports: [
    FormField,
    MatAutocompleteModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
    MatStepperModule,
    RouterLink,
  ],
  templateUrl: './convert.html',
  styleUrl: './convert.css',
})
export class Convert {
  protected readonly store = inject(AppStore);
  protected readonly fifaVersions = SUPPORTED_FIFA_VERSIONS;
  protected readonly selectedDatasetId = signal('');
  protected readonly datasetQuery = signal('');
  protected readonly targetVersion = signal(23);
  protected readonly nameModel = signal({ name: '' });
  protected readonly nameForm = form(this.nameModel, (path) => {
    required(path.name);
    maxLength(path.name, 80);
  });
  protected readonly runningRequestId = signal('');
  protected readonly result = signal<CreateConvertedDatasetResult | undefined>(undefined);
  protected readonly selectedDataset = computed(() =>
    this.store
      .availableImportedDatasets()
      .find((dataset) => dataset.id === this.selectedDatasetId()),
  );
  protected readonly filteredDatasets = computed(() => {
    const query = this.datasetQuery().trim().toLocaleLowerCase('en');
    const datasets = this.store.availableImportedDatasets();
    if (!query) return datasets;

    return datasets.filter((dataset) =>
      [
        dataset.name,
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
    this.store.availableImportedDatasets().find((dataset) => dataset.id === id)?.name ?? '';
  protected readonly compatibleTableCount = computed(() => {
    const dataset = this.selectedDataset();
    if (!dataset) return 0;
    return dataset.tableNames.filter((table) => {
      try {
        return fieldsFor(this.targetVersion(), table).length > 0;
      } catch {
        return false;
      }
    }).length;
  });
  protected readonly duplicateName = computed(() => {
    const name = this.nameModel().name.trim().toLocaleLowerCase('en');
    return (
      name.length > 0 &&
      this.store
        .convertedDatasets()
        .some((dataset) => dataset.name.toLocaleLowerCase('en') === name)
    );
  });
  protected readonly canCreate = computed(
    () =>
      this.nameForm().valid() &&
      !this.duplicateName() &&
      this.compatibleTableCount() > 0 &&
      !this.store.loading(),
  );

  protected selectDataset(id: string): void {
    this.selectedDatasetId.set(id);
    this.datasetQuery.set(this.displayDatasetName(id));
    this.result.set(undefined);
    this.updateSuggestedName();
  }

  protected filterDatasets(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.datasetQuery.set(event.target.value);
    this.selectedDatasetId.set('');
    this.result.set(undefined);
    this.updateSuggestedName();
  }

  protected restoreDatasetQuery(): void {
    this.datasetQuery.set(this.selectedDataset()?.name ?? '');
  }

  protected setTarget(version: number): void {
    this.targetVersion.set(version);
    this.result.set(undefined);
    this.updateSuggestedName();
  }

  protected async create(): Promise<void> {
    const source = this.selectedDataset();
    if (!source || !this.canCreate()) return;
    const requestId = crypto.randomUUID();
    this.runningRequestId.set(requestId);
    this.result.set(undefined);
    try {
      this.result.set(
        await this.store.createConvertedDataset({
          requestId,
          sourceDatasetId: source.id,
          targetVersion: this.targetVersion(),
          name: this.nameModel().name.trim(),
        }),
      );
    } catch {
      // The store exposes the user-facing error.
    } finally {
      this.runningRequestId.set('');
    }
  }

  protected cancel(): void {
    const requestId = this.runningRequestId();
    if (requestId) this.store.cancelConversion(requestId);
  }

  private updateSuggestedName(): void {
    const dataset = this.selectedDataset();
    if (!dataset) {
      this.nameModel.set({ name: '' });
      return;
    }
    const suffix = ` — FIFA ${this.targetVersion()}`;
    const sourceName = dataset.name.slice(0, Math.max(1, 80 - suffix.length));
    const base = `${sourceName}${suffix}`;
    const existing = new Set(
      this.store.convertedDatasets().map((item) => item.name.toLocaleLowerCase('en')),
    );
    let candidate = base;
    let index = 2;
    while (existing.has(candidate.toLocaleLowerCase('en'))) {
      const collisionSuffix = ` (${index})`;
      candidate = `${base.slice(0, 80 - collisionSuffix.length)}${collisionSuffix}`;
      index += 1;
    }
    this.nameModel.set({ name: candidate });
  }
}
