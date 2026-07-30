import {
  afterRenderEffect,
  ApplicationRef,
  Component,
  computed,
  inject,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import type { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInput, MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { RouterLink } from '@angular/router';
import type {
  DatasetImportCandidate,
  DatasetImportRequest,
  DatasetImportResult,
  DatasetImportValidationResult,
  DatasetSourceFileSelection,
  DatasetSourceKind,
} from '../../../../shared/contracts';
import { AppStore } from '../../core/app-store';
import { ConfettiService } from '../../core/confetti/confetti.service';
import { DesktopApi } from '../../core/desktop-api';
import { ValidationReport } from '../../shared/validation-report/validation-report';

interface EditableCandidate extends DatasetImportCandidate {
  name: string;
  version: number;
}

interface CandidateValidationState {
  fifaVersion: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: DatasetImportValidationResult;
  error?: string;
}

const FORMAT_STORAGE_KEY = 'qdb-converter-import-source-kind';

const storedFormat = (): DatasetSourceKind => {
  const format = localStorage.getItem(FORMAT_STORAGE_KEY);
  return format === 'text-folder' || format === 't3db' ? format : 'text-folder';
};

@Component({
  selector: 'app-import-datasets',
  imports: [
    DecimalPipe,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatRadioModule,
    MatSelectModule,
    MatStepperModule,
    RouterLink,
    ValidationReport,
  ],
  templateUrl: './import-datasets.html',
  styleUrls: ['./import-datasets.css', './import-source-card.css'],
})
export class ImportDatasets {
  protected readonly store = inject(AppStore);
  private readonly confetti = inject(ConfettiService);
  private readonly desktop = inject(DesktopApi);
  private readonly applicationRef = inject(ApplicationRef);
  private readonly stepper = viewChild(MatStepper);
  private readonly renderedInputs = viewChildren(MatInput);
  private readonly renderedSelects = viewChildren(MatSelect);

  protected readonly format = signal<DatasetSourceKind>(storedFormat());
  protected readonly candidates = signal<EditableCandidate[]>([]);
  protected readonly t3dbDatabaseFile = signal<DatasetSourceFileSelection | undefined>(undefined);
  protected readonly t3dbMetadataFile = signal<DatasetSourceFileSelection | undefined>(undefined);
  protected readonly preparing = signal(false);
  protected readonly results = signal<DatasetImportResult[]>([]);
  protected readonly validationStates = signal<Record<string, CandidateValidationState>>({});
  protected readonly validationRunning = signal(false);
  protected readonly validationProgress = signal<
    { name: string; current: number; total: number } | undefined
  >(undefined);
  protected readonly error = signal('');
  protected readonly showErrorStateMatcher: ErrorStateMatcher = {
    isErrorState: () => true,
  };
  protected readonly hideErrorStateMatcher: ErrorStateMatcher = {
    isErrorState: () => false,
  };
  protected readonly sourceReady = computed(
    () =>
      this.candidates().length > 0 ||
      (this.format() === 't3db' &&
        this.t3dbDatabaseFile() !== undefined &&
        this.t3dbMetadataFile() !== undefined),
  );
  protected readonly textSourceDisplay = computed(() => {
    const paths = this.candidates().flatMap((candidate) => candidate.originalPaths);
    if (paths.length === 1) return paths[0];
    return paths.length > 1 ? `${paths.length} folders selected` : '';
  });
  protected readonly reviewReady = computed(
    () =>
      this.candidates().length > 0 &&
      this.candidates().every((candidate) => this.validationMessages(candidate).length === 0),
  );
  protected readonly validationsComplete = computed(() =>
    this.candidates().every((candidate) => {
      const state = this.validationStates()[candidate.selectionId];
      return (
        state?.status === 'completed' &&
        state.fifaVersion === candidate.version &&
        state.result !== undefined
      );
    }),
  );
  protected readonly validationsBlocked = computed(() =>
    this.candidates().some((candidate) => {
      const state = this.validationStates()[candidate.selectionId];
      return (
        state?.status === 'failed' ||
        (state?.status === 'completed' && (state.result?.errorCount ?? 0) > 0)
      );
    }),
  );
  protected readonly canImport = computed(
    () =>
      this.reviewReady() &&
      this.validationsComplete() &&
      !this.validationsBlocked() &&
      !this.validationRunning(),
  );

  constructor() {
    afterRenderEffect({
      write: () => {
        const candidates = this.candidates();
        const datasets = this.store.importedDatasets();
        const inputs = this.renderedInputs();
        const selects = this.renderedSelects();
        if (!candidates.length && !datasets.length && !inputs.length && !selects.length) return;
        for (const input of inputs) input.updateErrorState();
        for (const select of selects) select.updateErrorState();
      },
    });
  }

  protected changeFormat(format: DatasetSourceKind): void {
    if (this.format() === format) return;
    this.format.set(format);
    localStorage.setItem(FORMAT_STORAGE_KEY, format);
    this.resetSource();
  }

  protected async selectTextFolders(): Promise<void> {
    this.preparing.set(true);
    this.error.set('');
    try {
      const selected = await this.desktop.selectTextSources();
      if (selected.length) {
        this.clearValidations();
        this.candidates.set(selected.map((candidate) => this.edit(candidate)));
      }
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'The folders could not be selected.');
    } finally {
      this.preparing.set(false);
    }
  }

  protected async selectT3dbDatabase(): Promise<void> {
    await this.selectT3dbFile('database');
  }

  protected async selectT3dbMetadata(): Promise<void> {
    await this.selectT3dbFile('metadata');
  }

  protected async continueSource(): Promise<void> {
    if (!this.sourceReady() || this.preparing() || this.store.loading()) return;
    if (this.candidates().length) {
      this.stepper()?.next();
      return;
    }
    const database = this.t3dbDatabaseFile();
    const metadata = this.t3dbMetadataFile();
    if (!database || !metadata) return;
    this.preparing.set(true);
    this.error.set('');
    try {
      const candidate = await this.desktop.prepareT3dbSource({
        databaseFileId: database.id,
        metadataFileId: metadata.id,
      });
      this.clearValidations();
      this.candidates.set([this.edit(candidate)]);
      await this.applicationRef.whenStable();
      this.stepper()?.next();
    } catch (error) {
      this.error.set(
        error instanceof Error ? error.message : 'The t3db source could not be prepared.',
      );
    } finally {
      this.preparing.set(false);
    }
  }

  protected changeName(selectionId: string, event: Event): void {
    const name = (event.target as HTMLInputElement).value;
    this.candidates.update((items) =>
      items.map((item) => (item.selectionId === selectionId ? { ...item, name } : item)),
    );
  }

  protected changeVersion(selectionId: string, version: number): void {
    this.removeValidation(selectionId);
    this.candidates.update((items) =>
      items.map((item) => (item.selectionId === selectionId ? { ...item, version } : item)),
    );
  }

  protected remove(selectionId: string): void {
    this.removeValidation(selectionId);
    this.candidates.update((items) => items.filter((item) => item.selectionId !== selectionId));
    if (this.format() === 't3db') {
      this.t3dbDatabaseFile.set(undefined);
      this.t3dbMetadataFile.set(undefined);
    }
  }

  protected validationMessages(candidate: EditableCandidate): string[] {
    const messages: string[] = [];
    const name = candidate.name.trim();
    const normalizedName = name.toLocaleLowerCase('en');
    const duplicateInQueue = this.candidates().some(
      (item) =>
        item.selectionId !== candidate.selectionId &&
        item.name.trim().toLocaleLowerCase('en') === normalizedName,
    );
    const duplicateInLibrary = this.store
      .importedDatasets()
      .some((dataset) => dataset.name.toLocaleLowerCase('en') === normalizedName);

    if (!name) messages.push('Enter a dataset name.');
    else if (name.length > 80) messages.push('Use at most 80 characters.');
    else if (duplicateInQueue || duplicateInLibrary)
      messages.push('A dataset with this name already exists.');
    if (!candidate.matchingVersions.includes(candidate.version))
      messages.push('Select a FIFA version that matches this source.');
    return messages;
  }

  protected firstValidationMessage(candidate: EditableCandidate): string {
    return this.validationMessages(candidate)[0] ?? '';
  }

  protected nameHasError(candidate: EditableCandidate): boolean {
    return this.validationMessages(candidate).some(
      (message) =>
        message.includes('name') || message.includes('characters') || message.includes('exists'),
    );
  }

  protected versionHasError(candidate: EditableCandidate): boolean {
    return !candidate.matchingVersions.includes(candidate.version);
  }

  protected reviewImport(): void {
    if (!this.reviewReady() || this.validationRunning()) return;
    this.stepper()?.next();
    void this.runValidations();
  }

  protected async runValidations(): Promise<void> {
    if (!this.reviewReady() || !this.candidates().length || this.validationRunning()) return;
    const candidates = this.candidates().map((candidate) => ({
      selectionId: candidate.selectionId,
      name: candidate.name,
      fifaVersion: candidate.version,
    }));
    this.validationStates.set(
      Object.fromEntries(
        candidates.map((candidate) => [
          candidate.selectionId,
          { fifaVersion: candidate.fifaVersion, status: 'pending' as const },
        ]),
      ),
    );
    this.validationRunning.set(true);
    this.error.set('');
    try {
      for (const [index, candidate] of candidates.entries()) {
        this.validationProgress.set({
          name: candidate.name,
          current: index + 1,
          total: candidates.length,
        });
        this.setValidationState(candidate.selectionId, {
          fifaVersion: candidate.fifaVersion,
          status: 'running',
        });
        try {
          const result = await this.desktop.validateImportSource({
            selectionId: candidate.selectionId,
            fifaVersion: candidate.fifaVersion,
          });
          this.setValidationState(candidate.selectionId, {
            fifaVersion: candidate.fifaVersion,
            status: 'completed',
            result,
          });
        } catch (error) {
          this.setValidationState(candidate.selectionId, {
            fifaVersion: candidate.fifaVersion,
            status: 'failed',
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    } finally {
      this.validationRunning.set(false);
      this.validationProgress.set(undefined);
    }
  }

  protected validationState(selectionId: string): CandidateValidationState | undefined {
    return this.validationStates()[selectionId];
  }

  protected async importAll(): Promise<void> {
    if (!this.canImport() || this.store.loading()) return;
    this.error.set('');
    const requests: DatasetImportRequest[] = this.candidates().map((candidate) => ({
      selectionId: candidate.selectionId,
      name: candidate.name.trim(),
      fifaVersion: candidate.version,
    }));

    try {
      const imported = await this.store.importDatasets(requests);
      this.results.update((current) => [
        ...current.filter(
          (result) => !imported.some((item) => item.selectionId === result.selectionId),
        ),
        ...imported,
      ]);
      this.candidates.update((current) =>
        current.filter(
          (candidate) =>
            !imported.some(
              (result) =>
                result.selectionId === candidate.selectionId && result.status === 'completed',
            ),
        ),
      );
      if (imported.some((result) => result.status === 'completed')) this.confetti.celebrate();
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Dataset import failed.');
    }
  }

  protected cancelImport(): void {
    void this.desktop.cancelImport();
  }

  protected resultLabel(result: DatasetImportResult): string {
    return (
      result.dataset?.name ??
      this.candidates().find((candidate) => candidate.selectionId === result.selectionId)?.name ??
      'Dataset'
    );
  }

  protected startAnotherImport(): void {
    this.resetSource();
    this.results.set([]);
    this.stepper()?.reset();
  }

  private async selectT3dbFile(kind: 'database' | 'metadata'): Promise<void> {
    this.preparing.set(true);
    this.error.set('');
    try {
      const selection =
        kind === 'database'
          ? await this.desktop.selectT3dbDatabaseFile()
          : await this.desktop.selectT3dbMetadataFile();
      if (!selection) return;
      const sourceWasPrepared = this.candidates().length > 0;
      this.clearValidations();
      this.candidates.set([]);
      if (kind === 'database') {
        this.t3dbDatabaseFile.set(selection);
        if (sourceWasPrepared) this.t3dbMetadataFile.set(undefined);
      } else {
        this.t3dbMetadataFile.set(selection);
        if (sourceWasPrepared) this.t3dbDatabaseFile.set(undefined);
      }
    } catch (error) {
      this.error.set(
        error instanceof Error ? error.message : 'The source file could not be selected.',
      );
    } finally {
      this.preparing.set(false);
    }
  }

  private edit(candidate: DatasetImportCandidate): EditableCandidate {
    return {
      ...candidate,
      name: candidate.suggestedName,
      version: candidate.detectedVersion ?? candidate.matchingVersions.at(-1) ?? 23,
    };
  }

  private resetSource(): void {
    this.clearValidations();
    this.candidates.set([]);
    this.t3dbDatabaseFile.set(undefined);
    this.t3dbMetadataFile.set(undefined);
    this.error.set('');
  }

  private setValidationState(selectionId: string, state: CandidateValidationState): void {
    this.validationStates.update((states) => ({ ...states, [selectionId]: state }));
  }

  private removeValidation(selectionId: string): void {
    this.validationStates.update((states) =>
      Object.fromEntries(Object.entries(states).filter(([id]) => id !== selectionId)),
    );
  }

  private clearValidations(): void {
    this.validationStates.set({});
    this.validationProgress.set(undefined);
  }
}
