import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import type { DatasetImportCandidate, DatasetImportRequest } from '../../../../shared/contracts';
import { AppStore } from '../../core/app-store';
import { DesktopApi } from '../../core/desktop-api';

interface EditableCandidate extends DatasetImportCandidate {
  name: string;
  version: number;
}

@Component({
  selector: 'app-import-datasets-dialog',
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
  ],
  templateUrl: './import-datasets-dialog.html',
  styleUrl: './import-datasets-dialog.css',
})
export class ImportDatasetsDialog {
  protected readonly store = inject(AppStore);
  private readonly desktop = inject(DesktopApi);
  private readonly dialog = inject(MatDialogRef<ImportDatasetsDialog>);
  protected readonly candidates = signal<EditableCandidate[]>([]);
  protected readonly selecting = signal(false);
  protected readonly results = signal<string[]>([]);

  protected async addTextFolders(): Promise<void> {
    await this.select(async () => this.desktop.selectTextSources());
  }

  protected async addT3db(): Promise<void> {
    await this.select(async () => {
      const candidate = await this.desktop.selectT3dbSource();
      return candidate ? [candidate] : [];
    });
  }

  private async select(loader: () => Promise<DatasetImportCandidate[]>): Promise<void> {
    this.selecting.set(true);
    try {
      const selected = await loader();
      this.candidates.update((current) => [
        ...current,
        ...selected.map((candidate) => ({
          ...candidate,
          name: candidate.suggestedName,
          version: candidate.detectedVersion ?? candidate.matchingVersions.at(-1) ?? 23,
        })),
      ]);
    } finally {
      this.selecting.set(false);
    }
  }

  protected changeName(selectionId: string, event: Event): void {
    const name = (event.target as HTMLInputElement).value;
    this.candidates.update((items) =>
      items.map((item) => (item.selectionId === selectionId ? { ...item, name } : item)),
    );
  }

  protected changeVersion(selectionId: string, version: number): void {
    this.candidates.update((items) =>
      items.map((item) => (item.selectionId === selectionId ? { ...item, version } : item)),
    );
  }

  protected remove(selectionId: string): void {
    this.candidates.update((items) => items.filter((item) => item.selectionId !== selectionId));
  }

  protected async importAll(): Promise<void> {
    const requests: DatasetImportRequest[] = this.candidates().map((candidate) => ({
      selectionId: candidate.selectionId,
      name: candidate.name.trim(),
      fifaVersion: candidate.version,
    }));
    const results = await this.store.importDatasets(requests);
    const messages = results.map((result) =>
      result.status === 'completed'
        ? `${result.dataset?.name ?? 'Dataset'} imported`
        : (result.error?.message ?? 'Import failed'),
    );
    this.results.set(messages);
    if (results.every((result) => result.status === 'completed')) this.dialog.close(true);
  }

  protected cancelImport(): void {
    void this.desktop.cancelImport();
  }
}
