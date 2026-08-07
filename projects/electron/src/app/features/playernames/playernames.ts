import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { FormField, form, maxLength, required, submit, validate } from '@angular/forms/signals';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRadioModule } from '@angular/material/radio';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { RouterLink } from '@angular/router';

import type {
  ConvertedDatasetDescriptor,
  DatasetKind,
  ImportedDatasetDescriptor,
  PlayernameAnalysisResult,
  PlayernameOperations,
  PlayernameOutput,
  PlayernameRunResult,
} from '../../../../shared/contracts';
import { AppStore } from '../../core/app-store';
import { ConfettiService } from '../../core/confetti/confetti.service';
import { ConfirmationDialog } from '../../core/confirmation-dialog/confirmation-dialog';
import { PageHeader } from '../../shared/page-header/page-header';
import {
  PlayernameIdLanes,
  playernameSummaryProfiles,
} from '../../shared/playername-id-range/playername-id-lanes';

type PlayernameDataset = ImportedDatasetDescriptor | ConvertedDatasetDescriptor;
type OutputKind = PlayernameOutput['kind'];

const searchDetails = (dataset: PlayernameDataset): string[] =>
  'sourceDatasetName' in dataset
    ? [dataset.sourceDatasetName, `FIFA ${dataset.sourceVersion}`]
    : [dataset.source.kind, ...dataset.source.originalPaths];

@Component({
  selector: 'app-playernames',
  imports: [
    DecimalPipe,
    FormField,
    MatAutocompleteModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatRadioModule,
    MatStepperModule,
    PageHeader,
    PlayernameIdLanes,
    RouterLink,
  ],
  templateUrl: './playernames.html',
  styleUrl: './playernames.css',
})
export class Playernames {
  protected readonly store = inject(AppStore);
  private readonly confetti = inject(ConfettiService);
  private readonly dialog = inject(MatDialog);
  private readonly stepper = viewChild(MatStepper);

  protected readonly selectedDatasetKind = signal<DatasetKind | undefined>(undefined);
  protected readonly selectedDatasetId = signal('');
  protected readonly datasetQuery = signal('');
  protected readonly operations = signal<PlayernameOperations>({
    minimize: false,
    removeUnused: false,
  });
  protected readonly outputKind = signal<OutputKind | undefined>(undefined);
  protected readonly nameModel = signal({ name: '' });
  protected readonly nameForm = form(this.nameModel, (path) => {
    required(path.name, { message: 'Enter a managed dataset name.' });
    maxLength(path.name, 80, { message: 'Use at most 80 characters.' });
    validate(path.name, ({ value }) => {
      const normalized = value().trim().toLocaleLowerCase('en');
      return normalized &&
        this.store
          .convertedDatasets()
          .some((dataset) => dataset.name.toLocaleLowerCase('en') === normalized)
        ? { kind: 'duplicate', message: 'A converted dataset with this name already exists.' }
        : undefined;
    });
  });
  protected readonly runningRequestId = signal('');
  protected readonly analysisRequestId = signal('');
  protected readonly analysis = signal<PlayernameAnalysisResult | undefined>(undefined);
  protected readonly result = signal<PlayernameRunResult | undefined>(undefined);

  protected readonly availableDatasets = computed<readonly PlayernameDataset[]>(() => {
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
  protected readonly analysisReady = computed(
    () =>
      this.analysis()?.status === 'completed' &&
      this.analysis()?.datasetId === this.selectedDatasetId(),
  );
  protected readonly outOfRangeCount = computed(
    () =>
      this.analysis()?.tables.reduce((total, table) => total + table.profile.outOfRangeCount, 0) ??
      0,
  );
  protected readonly currentIdProfiles = computed(() => this.analysis()?.tables ?? []);
  protected readonly resultBeforeIdProfiles = computed(() =>
    playernameSummaryProfiles(this.result()?.summary?.tables ?? [], 'before'),
  );
  protected readonly resultAfterIdProfiles = computed(() =>
    playernameSummaryProfiles(this.result()?.summary?.tables ?? [], 'after'),
  );
  protected readonly operationsAllowed = computed(
    () => this.hasOperations() && (!this.outOfRangeCount() || this.operations().minimize),
  );
  protected readonly filteredDatasets = computed(() => {
    const query = this.datasetQuery().trim().toLocaleLowerCase('en');
    if (!query) return this.availableDatasets();
    return this.availableDatasets().filter((dataset) =>
      [
        dataset.name,
        ...searchDetails(dataset),
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
  protected readonly canRun = computed(() => {
    if (
      !this.selectedDataset() ||
      !this.analysisReady() ||
      !this.operationsAllowed() ||
      !this.outputKind() ||
      this.store.loading()
    )
      return false;
    return this.outputKind() === 'new-converted' ? this.nameForm().valid() : true;
  });
  protected readonly hasOperations = computed(() => {
    const operations = this.operations();
    return operations.minimize || operations.removeUnused;
  });

  protected selectDatasetKind(kind: DatasetKind): void {
    if (kind === this.selectedDatasetKind()) return;
    this.selectedDatasetKind.set(kind);
    this.selectedDatasetId.set('');
    this.datasetQuery.set('');
    void this.cancelAnalysis();
    this.clearAfterDataset();
  }

  protected selectDataset(id: string): void {
    this.selectedDatasetId.set(id);
    this.datasetQuery.set(this.displayDatasetName(id));
    this.clearAfterDataset();
    this.updateSuggestedName();
    void this.analyzeSelectedDataset();
  }

  protected filterDatasets(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.datasetQuery.set(event.target.value);
    this.selectedDatasetId.set('');
    void this.cancelAnalysis();
    this.clearAfterDataset();
  }

  protected restoreDatasetQuery(): void {
    this.datasetQuery.set(this.selectedDataset()?.name ?? '');
  }

  protected isCompatible(dataset: PlayernameDataset): boolean {
    const tables = new Set(dataset.tableNames);
    return tables.has('players') && tables.has('playernames');
  }

  protected selectOperation(operation: keyof PlayernameOperations, checked: boolean): void {
    this.operations.update((current) => ({ ...current, [operation]: checked }));
    this.result.set(undefined);
    this.updateSuggestedName();
  }

  protected selectOutputKind(kind: OutputKind): void {
    this.outputKind.set(kind);
    this.result.set(undefined);
    if (kind === 'new-converted') this.updateSuggestedName();
  }

  protected run(): void {
    if (this.outputKind() === 'new-converted') {
      void submit(this.nameForm, async () => this.execute());
      return;
    }
    const dataset = this.selectedDataset();
    const datasetKind = this.selectedDatasetKind();
    if (!dataset || !datasetKind || !this.canRun()) return;
    this.dialog
      .open(ConfirmationDialog, {
        role: 'alertdialog',
        data: {
          title: `Overwrite ${dataset.name}?`,
          message: `This permanently replaces the managed ${datasetKind} dataset with the optimized text snapshot. Original external source files will not be changed.`,
          confirmLabel: 'Overwrite managed dataset',
        },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) void this.execute();
      });
  }

  protected cancel(): void {
    const requestId = this.runningRequestId();
    if (requestId) this.store.cancelPlayername(requestId);
  }

  protected reset(): void {
    void this.cancelAnalysis();
    this.selectedDatasetKind.set(undefined);
    this.selectedDatasetId.set('');
    this.datasetQuery.set('');
    this.operations.set({ minimize: false, removeUnused: false });
    this.outputKind.set(undefined);
    this.nameModel.set({ name: '' });
    this.runningRequestId.set('');
    this.analysis.set(undefined);
    this.result.set(undefined);
    this.store.error.set('');
    this.stepper()?.reset();
  }

  protected operationsLabel(operations: PlayernameOperations = this.operations()): string {
    if (operations.minimize && operations.removeUnused)
      return 'Remove unused names, then minimize ID holes';
    return operations.minimize ? 'Minimize ID holes' : 'Remove unused names';
  }

  protected resultRoute(): string {
    const dataset = this.result()?.dataset;
    return dataset && 'source' in dataset ? '/' : '/datasets';
  }

  private async execute(): Promise<void> {
    const datasetKind = this.selectedDatasetKind();
    const dataset = this.selectedDataset();
    const operations = this.operations();
    const outputKind = this.outputKind();
    if (!datasetKind || !dataset || !this.hasOperations() || !outputKind || !this.canRun()) return;
    const requestId = crypto.randomUUID();
    const output: PlayernameOutput =
      outputKind === 'new-converted'
        ? { kind: 'new-converted', name: this.nameModel().name.trim() }
        : { kind: 'overwrite' };
    this.runningRequestId.set(requestId);
    this.result.set(undefined);
    try {
      const result = await this.store.runPlayername({
        requestId,
        datasetKind,
        datasetId: dataset.id,
        operations,
        output,
      });
      this.result.set(result);
      if (result.status === 'completed') this.confetti.celebrate();
    } catch {
      // The store exposes the user-facing error.
    } finally {
      this.runningRequestId.set('');
    }
  }

  private clearAfterDataset(): void {
    this.operations.set({ minimize: false, removeUnused: false });
    this.outputKind.set(undefined);
    this.nameModel.set({ name: '' });
    this.analysis.set(undefined);
    this.result.set(undefined);
  }

  private async analyzeSelectedDataset(): Promise<void> {
    await this.cancelAnalysis();
    const datasetKind = this.selectedDatasetKind();
    const datasetId = this.selectedDatasetId();
    if (!datasetKind || !datasetId) return;
    const requestId = crypto.randomUUID();
    this.analysisRequestId.set(requestId);
    this.analysis.set(undefined);
    try {
      const result = await this.store.analyzePlayernames({ requestId, datasetKind, datasetId });
      if (
        this.analysisRequestId() === requestId &&
        this.selectedDatasetKind() === datasetKind &&
        this.selectedDatasetId() === datasetId
      )
        this.analysis.set(result);
    } catch {
      // The store exposes the user-facing analysis error.
    }
  }

  private async cancelAnalysis(): Promise<void> {
    const requestId = this.analysisRequestId();
    this.analysisRequestId.set('');
    if (requestId) await this.store.cancelPlayernameAnalysis(requestId);
  }

  private updateSuggestedName(): void {
    const dataset = this.selectedDataset();
    const operations = this.operations();
    if (!dataset || (!operations.minimize && !operations.removeUnused)) return;
    const suffix =
      operations.minimize && operations.removeUnused
        ? 'Playernames optimized'
        : operations.minimize
          ? 'Playernames minimized'
          : 'Unused playernames removed';
    const base = `${dataset.name} — ${suffix}`;
    let candidate = base.slice(0, 80);
    let index = 2;
    const names = new Set(
      this.store.convertedDatasets().map((item) => item.name.toLocaleLowerCase('en')),
    );
    while (names.has(candidate.toLocaleLowerCase('en'))) {
      const number = ` ${index}`;
      candidate = `${base.slice(0, 80 - number.length)}${number}`;
      index += 1;
    }
    this.nameModel.set({ name: candidate });
  }
}
