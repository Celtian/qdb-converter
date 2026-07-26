import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { Router } from '@angular/router';
import { fieldsFor } from '../../../../shared/table-config';
import { AppStore } from '../../core/app-store';
import { DesktopApi } from '../../core/desktop-api';

@Component({
  selector: 'app-convert',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatIconModule,
    MatProgressBarModule,
    MatSelectModule,
    MatStepperModule,
  ],
  templateUrl: './convert.html',
  styleUrl: './convert.css',
})
export class Convert {
  protected readonly store = inject(AppStore);
  private readonly desktop = inject(DesktopApi);
  private readonly router = inject(Router);
  protected readonly selectedDatasetIds = signal<string[]>([]);
  protected readonly targetVersion = signal(23);
  protected readonly selectedTables = signal<string[]>([]);
  protected readonly outputParentPath = signal('');
  protected readonly extendContracts = signal(false);
  protected readonly runningRequestId = signal('');
  protected readonly resultMessages = signal<string[]>([]);

  protected readonly compatibleTables = computed(() => {
    const available = new Set(
      this.store
        .availableDatasets()
        .filter((dataset) => this.selectedDatasetIds().includes(dataset.id))
        .flatMap((dataset) => dataset.tableNames),
    );
    return [...available]
      .filter((table) => {
        try {
          return fieldsFor(this.targetVersion(), table).length > 0;
        } catch {
          return false;
        }
      })
      .sort();
  });

  protected toggleDataset(id: string, selected: boolean): void {
    this.selectedDatasetIds.update((ids) =>
      selected ? [...new Set([...ids, id])] : ids.filter((candidate) => candidate !== id),
    );
    this.selectCompatibleTables();
  }

  protected setTarget(version: number): void {
    this.targetVersion.set(version);
    this.selectCompatibleTables();
  }

  protected selectCompatibleTables(): void {
    queueMicrotask(() => this.selectedTables.set(this.compatibleTables()));
  }

  protected toggleTable(table: string, selected: boolean): void {
    this.selectedTables.update((tables) =>
      selected
        ? [...new Set([...tables, table])]
        : tables.filter((candidate) => candidate !== table),
    );
  }

  protected async chooseOutput(): Promise<void> {
    const path = await this.desktop.selectOutputDirectory();
    if (path) this.outputParentPath.set(path);
  }

  protected async run(): Promise<void> {
    const requestId = crypto.randomUUID();
    this.runningRequestId.set(requestId);
    const results = await this.store.runConversion({
      requestId,
      datasetIds: this.selectedDatasetIds(),
      targetVersion: this.targetVersion(),
      tables: this.selectedTables(),
      outputParentPath: this.outputParentPath(),
      extendContracts: this.extendContracts(),
    });
    this.resultMessages.set(
      results.map((result) =>
        result.status === 'completed'
          ? `Converted to ${result.outputPath}`
          : (result.error?.message ?? 'Conversion failed'),
      ),
    );
    this.runningRequestId.set('');
  }

  protected cancel(): void {
    const requestId = this.runningRequestId();
    if (requestId) void this.desktop.cancelConversion(requestId);
  }

  protected showHistory(): void {
    void this.router.navigate(['/conversions']);
  }
}
