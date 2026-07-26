import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import type { DatasetDescriptor, DatasetValidationResult } from '../../../../shared/contracts';
import { DesktopApi } from '../../core/desktop-api';
import { ValidationReport } from '../../shared/validation-report/validation-report';

@Component({
  selector: 'app-dataset-validation-dialog',
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ValidationReport,
  ],
  templateUrl: './dataset-validation-dialog.html',
  styleUrl: './dataset-validation-dialog.css',
})
export class DatasetValidationDialog implements OnInit {
  protected readonly dataset = inject<DatasetDescriptor>(MAT_DIALOG_DATA);
  private readonly desktop = inject(DesktopApi);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly result = signal<DatasetValidationResult | undefined>(undefined);

  ngOnInit(): void {
    void this.run();
  }

  protected async run(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    this.result.set(undefined);
    try {
      this.result.set(await this.desktop.validateDataset(this.dataset.id));
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : String(error));
    } finally {
      this.loading.set(false);
    }
  }
}
