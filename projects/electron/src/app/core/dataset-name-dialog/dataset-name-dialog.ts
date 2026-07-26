import { Component, inject, signal } from '@angular/core';
import { FormField, form, maxLength, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-dataset-name-dialog',
  imports: [FormField, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>Rename dataset</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline">
        <mat-label>Dataset name</mat-label>
        <input matInput [formField]="nameForm.name" autocomplete="off" />
        @if (nameForm.name().invalid() && nameForm.name().touched()) {
          <mat-error>Enter a name between 1 and 80 characters.</mat-error>
        }
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button matButton mat-dialog-close>Cancel</button>
      <button matButton="filled" [disabled]="nameForm().invalid()" (click)="save()">Save</button>
    </mat-dialog-actions>
  `,
  styles: ``,
})
export class DatasetNameDialog {
  private readonly dialog = inject(MatDialogRef<DatasetNameDialog>);
  private readonly data = inject<{ name: string }>(MAT_DIALOG_DATA);
  protected readonly model = signal({ name: this.data.name });
  protected readonly nameForm = form(this.model, (path) => {
    required(path.name);
    maxLength(path.name, 80);
  });

  protected save(): void {
    if (this.nameForm().valid()) this.dialog.close(this.model().name.trim());
  }
}
