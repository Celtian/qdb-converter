import { Component, computed, inject, signal } from '@angular/core';
import { FormField, form, maxLength, required, submit, validate } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-dataset-name-dialog',
  imports: [FormField, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule],
  templateUrl: './dataset-name-dialog.html',
  styleUrl: './dataset-name-dialog.css',
})
export class DatasetNameDialog {
  private readonly dialog = inject(MatDialogRef<DatasetNameDialog>);
  private readonly data = inject<{ name: string }>(MAT_DIALOG_DATA);
  private readonly originalName = this.data.name.trim();
  protected readonly model = signal({ name: this.data.name });
  protected readonly nameForm = form(this.model, (path) => {
    required(path.name, { message: 'Enter a dataset name.' });
    maxLength(path.name, 80, { message: 'Use 80 characters or fewer.' });
    validate(path.name, ({ value }) => {
      if (value().length > 0 && value().trim().length === 0)
        return { kind: 'whitespace', message: 'Enter a dataset name.' };
      return undefined;
    });
  });
  protected readonly trimmedName = computed(() => this.model().name.trim());
  protected readonly characterCount = computed(() => this.model().name.length);
  protected readonly canSave = computed(
    () => this.nameForm().valid() && this.trimmedName() !== this.originalName,
  );
  protected readonly nameError = computed(
    () => this.nameForm.name().errors()[0]?.message ?? 'Enter a valid dataset name.',
  );

  protected async save(): Promise<void> {
    await submit(this.nameForm, async () => {
      if (this.canSave()) this.dialog.close(this.trimmedName());
    });
  }
}
