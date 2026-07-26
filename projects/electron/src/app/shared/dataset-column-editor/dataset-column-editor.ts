import {
  CdkDrag,
  type CdkDragDrop,
  CdkDragHandle,
  CdkDragPreview,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { Component, computed, input, linkedSignal, model, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import {
  fromDatasetColumnVisibility,
  toDatasetColumnVisibility,
  type DatasetColumnDefinition,
  type DatasetColumnPreference,
  type DatasetColumnVisibility,
  type DatasetTableKind,
} from './dataset-table-columns';

@Component({
  selector: 'app-dataset-column-editor',
  imports: [
    CdkDrag,
    CdkDragHandle,
    CdkDragPreview,
    CdkDropList,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
  ],
  templateUrl: './dataset-column-editor.html',
  styleUrl: './dataset-column-editor.css',
})
export class DatasetColumnEditor {
  readonly table = input.required<DatasetTableKind>();
  readonly columns = input.required<readonly DatasetColumnDefinition[]>();
  readonly preference = model.required<DatasetColumnPreference>();
  readonly defaultPreference = input.required<DatasetColumnPreference>();
  private readonly visibilityModel = linkedSignal(() =>
    toDatasetColumnVisibility(this.columns(), this.preference().visible),
  );
  protected readonly announcement = signal('');
  protected readonly tableLabel = computed(() =>
    this.table() === 'imported' ? 'imported datasets' : 'converted datasets',
  );
  protected readonly instructionsId = computed(() => `${this.table()}-column-order-instructions`);
  protected readonly orderedColumns = computed(() => {
    const definitions = new Map(this.columns().map((column) => [column.key, column]));
    return this.preference().order.flatMap((key) => {
      const definition = definitions.get(key);
      return definition ? [definition] : [];
    });
  });

  resetToDefaults(): void {
    this.preference.set(this.defaultPreference());
    this.announcement.set('Default column order and visibility restored.');
  }

  protected setColumnVisibility(column: DatasetColumnDefinition, checked: boolean): void {
    const visibility: DatasetColumnVisibility = {
      ...this.visibilityModel(),
      [column.key]: checked,
    };
    this.visibilityModel.set(visibility);
    this.preference.set({
      version: 1,
      order: this.preference().order,
      visible: fromDatasetColumnVisibility(this.orderedColumns(), visibility),
    });
  }

  protected isColumnVisible(column: DatasetColumnDefinition): boolean {
    return column.required || Boolean(this.visibilityModel()[column.key]);
  }

  protected drop(event: CdkDragDrop<DatasetColumnDefinition[]>): void {
    this.reorder(event.previousIndex, event.currentIndex);
  }

  protected moveColumn(column: DatasetColumnDefinition, offset: -1 | 1): void {
    const previousIndex = this.preference().order.indexOf(column.key);
    const currentIndex = previousIndex + offset;
    if (currentIndex < 0 || currentIndex >= this.preference().order.length) {
      this.announcement.set(
        `${column.label} is already the ${offset < 0 ? 'first' : 'last'} column.`,
      );
      return;
    }
    this.reorder(previousIndex, currentIndex);
  }

  private reorder(previousIndex: number, currentIndex: number): void {
    if (previousIndex === currentIndex) return;
    const order = [...this.preference().order];
    moveItemInArray(order, previousIndex, currentIndex);
    const visible = new Set(this.preference().visible);
    this.preference.set({
      version: 1,
      order,
      visible: order.filter((key) => visible.has(key)),
    });
    const column = this.columns().find(({ key }) => key === order[currentIndex]);
    if (column) {
      this.announcement.set(
        `${column.label} moved to position ${currentIndex + 1} of ${order.length}.`,
      );
    }
  }
}
