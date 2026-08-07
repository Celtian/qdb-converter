import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

import type { ImportedDatasetDescriptor, PlayernameOperations } from '../../../../shared/contracts';
import { DatasetIdAnalysis } from '../../shared/dataset-id-analysis/dataset-id-analysis';
import {
  PlayernameIdUnion,
  playernameSummaryProfiles,
} from '../../shared/playername-id-range/playername-id-union';
import { StatusBadge } from '../../shared/status-badge/status-badge';

export type DatasetDetailsDialogResult = 'rename';

@Component({
  selector: 'app-dataset-details-dialog',
  imports: [
    DatePipe,
    DatasetIdAnalysis,
    DecimalPipe,
    MatButtonModule,
    MatDialogModule,
    PlayernameIdUnion,
    StatusBadge,
  ],
  templateUrl: './dataset-details-dialog.html',
  styleUrl: './dataset-details-dialog.css',
})
export class DatasetDetailsDialog {
  protected readonly dataset = inject<ImportedDatasetDescriptor>(MAT_DIALOG_DATA);
  protected readonly closeResult: undefined = undefined;
  protected readonly renameResult: DatasetDetailsDialogResult = 'rename';
  protected readonly playernameBeforeProfiles = playernameSummaryProfiles(
    this.dataset.playernameSummary?.tables ?? [],
    'before',
  );
  protected readonly playernameAfterProfiles = playernameSummaryProfiles(
    this.dataset.playernameSummary?.tables ?? [],
    'after',
  );

  protected operationsLabel(operations: PlayernameOperations): string {
    if (operations.minimize && operations.removeUnused)
      return 'Remove unused names, then minimize ID holes';
    return operations.minimize ? 'Minimize ID holes' : 'Remove unused names';
  }
}
