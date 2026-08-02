import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

import type { ImportedDatasetDescriptor } from '../../../../shared/contracts';
import { StatusBadge } from '../../shared/status-badge/status-badge';

export type DatasetDetailsDialogResult = 'rename';

@Component({
  selector: 'app-dataset-details-dialog',
  imports: [DatePipe, DecimalPipe, MatButtonModule, MatDialogModule, StatusBadge],
  templateUrl: './dataset-details-dialog.html',
  styleUrl: './dataset-details-dialog.css',
})
export class DatasetDetailsDialog {
  protected readonly dataset = inject<ImportedDatasetDescriptor>(MAT_DIALOG_DATA);
  protected readonly closeResult: undefined = undefined;
  protected readonly renameResult: DatasetDetailsDialogResult = 'rename';
}
