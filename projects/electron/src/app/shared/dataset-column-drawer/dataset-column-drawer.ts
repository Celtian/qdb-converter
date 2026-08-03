import { CdkScrollable } from '@angular/cdk/scrolling';
import { Component, inject, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { DatasetColumnEditor } from '../dataset-column-editor/dataset-column-editor';
import type {
  DatasetColumnDefinition,
  DatasetColumnPreference,
  DatasetTableKind,
} from '../dataset-column-editor/dataset-table-columns';

export interface DatasetColumnDrawerData {
  table: DatasetTableKind;
  columns: readonly DatasetColumnDefinition[];
  preference: DatasetColumnPreference;
  defaultPreference: DatasetColumnPreference;
}

@Component({
  selector: 'app-dataset-column-drawer',
  imports: [CdkScrollable, DatasetColumnEditor, MatButtonModule, MatIconModule],
  templateUrl: './dataset-column-drawer.html',
  styleUrl: './dataset-column-drawer.css',
})
export class DatasetColumnDrawer {
  protected readonly data = inject<DatasetColumnDrawerData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<DatasetColumnDrawer, DatasetColumnPreference>);
  private readonly editor = viewChild.required(DatasetColumnEditor);
  protected readonly draftPreference = signal(this.data.preference);

  protected resetDefaults(): void {
    this.editor().resetToDefaults();
  }

  protected apply(): void {
    this.dialogRef.close(this.draftPreference());
  }

  protected cancel(): void {
    this.dialogRef.close();
  }
}
