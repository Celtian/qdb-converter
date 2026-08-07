import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

import type {
  ConvertedDatasetDescriptor,
  DatasetResultKind,
  PlayernameOperations,
} from '../../../../shared/contracts';
import { DatasetIdAnalysis } from '../../shared/dataset-id-analysis/dataset-id-analysis';
import {
  PlayernameIdUnion,
  playernameSummaryProfiles,
} from '../../shared/playername-id-range/playername-id-union';
import { StatusBadge } from '../../shared/status-badge/status-badge';

export type ConvertedDatasetDetailsDialogResult = 'rename';

@Component({
  selector: 'app-converted-dataset-details-dialog',
  imports: [
    DatePipe,
    DatasetIdAnalysis,
    DecimalPipe,
    MatButtonModule,
    MatDialogModule,
    PlayernameIdUnion,
    StatusBadge,
  ],
  templateUrl: './converted-dataset-details-dialog.html',
  styleUrl: './converted-dataset-details-dialog.css',
})
export class ConvertedDatasetDetailsDialog {
  protected readonly dataset = inject<ConvertedDatasetDescriptor>(MAT_DIALOG_DATA);
  protected readonly closeResult: undefined = undefined;
  protected readonly renameResult: ConvertedDatasetDetailsDialogResult = 'rename';
  protected readonly playernameBeforeProfiles = playernameSummaryProfiles(
    this.dataset.playernameSummary?.tables ?? [],
    'before',
  );
  protected readonly playernameAfterProfiles = playernameSummaryProfiles(
    this.dataset.playernameSummary?.tables ?? [],
    'after',
  );

  protected resultKindLabel(kind: DatasetResultKind): string {
    switch (kind) {
      case 'conversion':
        return 'Conversion';
      case 'playernames-minimize':
        return 'Playernames minimize';
      case 'playernames-remove-unused':
        return 'Remove unused playernames';
      case 'playernames-combined':
        return 'Remove unused and minimize playernames';
    }
  }

  protected operationsLabel(operations: PlayernameOperations): string {
    if (operations.minimize && operations.removeUnused)
      return 'Remove unused names, then minimize ID holes';
    return operations.minimize ? 'Minimize ID holes' : 'Remove unused names';
  }
}
