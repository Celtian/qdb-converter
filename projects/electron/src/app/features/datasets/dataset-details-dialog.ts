import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import type { DatasetDescriptor } from '../../../../shared/contracts';
import { StatusBadge } from '../../shared/status-badge/status-badge';

@Component({
  selector: 'app-dataset-details-dialog',
  imports: [DatePipe, DecimalPipe, MatButtonModule, MatDialogModule, StatusBadge],
  templateUrl: './dataset-details-dialog.html',
  styleUrl: './dataset-details-dialog.css',
})
export class DatasetDetailsDialog {
  protected readonly dataset = inject<DatasetDescriptor>(MAT_DIALOG_DATA);
}
