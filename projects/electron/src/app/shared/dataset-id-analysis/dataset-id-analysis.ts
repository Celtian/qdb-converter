import { DecimalPipe } from '@angular/common';
import {
  Component,
  DestroyRef,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

import type {
  DatasetKind,
  DatasetStatus,
  DatasetTableIdAnalysis,
  TableConversionSummary,
} from '../../../../shared/contracts';
import { isSupportedTable } from '../../../../shared/table-config';
import { DesktopApi } from '../../core/desktop-api';
import { DatasetIdRange } from '../playername-id-range/playername-id-range';

interface TableDetails {
  name: string;
  analysis?: DatasetTableIdAnalysis;
  conversion?: TableConversionSummary;
}

@Component({
  selector: 'app-dataset-id-analysis',
  imports: [DatasetIdRange, DecimalPipe, MatButtonModule],
  templateUrl: './dataset-id-analysis.html',
  styleUrl: './dataset-id-analysis.css',
  host: { class: 'block' },
})
export class DatasetIdAnalysis {
  private readonly desktop = inject(DesktopApi);
  private readonly destroyRef = inject(DestroyRef);
  readonly datasetKind = input.required<DatasetKind>();
  readonly datasetId = input.required<string>();
  readonly status = input.required<DatasetStatus>();
  readonly tableNames = input.required<readonly string[]>();
  readonly conversionSummaries = input<readonly TableConversionSummary[]>([]);
  readonly heading = input('Table ID health');

  protected readonly loading = signal(false);
  protected readonly progress = signal('');
  protected readonly error = signal('');
  protected readonly analyses = signal<DatasetTableIdAnalysis[]>([]);
  protected readonly tables = computed<TableDetails[]>(() => {
    const analyses = new Map(this.analyses().map((analysis) => [analysis.table, analysis]));
    const conversions = new Map(
      this.conversionSummaries().map((summary) => [summary.table, summary]),
    );
    const names = this.tableNames().filter(isSupportedTable);
    for (const name of [...conversions.keys(), ...analyses.keys()])
      if (isSupportedTable(name) && !names.includes(name)) names.push(name);
    return names.map((name) => ({
      name,
      analysis: analyses.get(name),
      conversion: conversions.get(name),
    }));
  });

  private activeRequestId = '';
  private readonly removeProgressListener: () => void;

  constructor() {
    this.removeProgressListener = this.desktop.onDatasetIdAnalysisProgress((progress) => {
      if (progress.requestId === this.activeRequestId) this.progress.set(progress.message);
    });
    afterNextRender({ read: () => void this.analyze() });
    this.destroyRef.onDestroy(() => {
      this.removeProgressListener();
      const requestId = this.activeRequestId;
      this.activeRequestId = '';
      if (requestId) void this.desktop.cancelDatasetIdAnalysis(requestId);
    });
  }

  protected retry(): void {
    void this.analyze();
  }

  protected duplicateSamples(table: DatasetTableIdAnalysis): string {
    return table.duplicateSamples.join(', ');
  }

  protected invalidSamples(table: DatasetTableIdAnalysis): string {
    return table.invalidSamples
      .map((sample) => 'row ' + sample.row + ': ' + sample.value)
      .join('; ');
  }

  private async analyze(): Promise<void> {
    if (this.status() !== 'available' || this.loading()) return;
    const requestId = crypto.randomUUID();
    this.activeRequestId = requestId;
    this.loading.set(true);
    this.progress.set('Starting dataset ID analysis…');
    this.error.set('');
    this.analyses.set([]);
    try {
      const result = await this.desktop.analyzeDatasetIds({
        requestId,
        datasetKind: this.datasetKind(),
        datasetId: this.datasetId(),
      });
      if (this.activeRequestId !== requestId) return;
      if (result.status === 'completed') this.analyses.set(result.tables);
      else if (result.status !== 'cancelled')
        this.error.set(
          [result.error?.message, ...(result.error?.details ?? [])].filter(Boolean).join(' '),
        );
    } catch (error) {
      if (this.activeRequestId === requestId)
        this.error.set(error instanceof Error ? error.message : String(error));
    } finally {
      if (this.activeRequestId === requestId) {
        this.activeRequestId = '';
        this.loading.set(false);
        this.progress.set('');
      }
    }
  }
}
