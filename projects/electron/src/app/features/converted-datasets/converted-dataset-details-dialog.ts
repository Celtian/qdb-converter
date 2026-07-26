import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import type { ConvertedDatasetDescriptor } from '../../../../shared/contracts';
import { StatusBadge } from '../../shared/status-badge/status-badge';

export type ConvertedDatasetDetailsDialogResult = 'rename';

@Component({
  selector: 'app-converted-dataset-details-dialog',
  imports: [DatePipe, DecimalPipe, MatButtonModule, MatDialogModule, StatusBadge],
  templateUrl: './converted-dataset-details-dialog.html',
  styleUrl: './converted-dataset-details-dialog.css',
})
export class ConvertedDatasetDetailsDialog {
  protected readonly dataset = inject<ConvertedDatasetDescriptor>(MAT_DIALOG_DATA);
  protected readonly closeResult: undefined = undefined;
  protected readonly renameResult: ConvertedDatasetDetailsDialogResult = 'rename';
}
