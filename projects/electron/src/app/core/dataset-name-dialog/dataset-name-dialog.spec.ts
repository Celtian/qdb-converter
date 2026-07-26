import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { DatasetNameDialog } from './dataset-name-dialog';

describe('DatasetNameDialog', () => {
  let component: DatasetNameDialog;
  let fixture: ComponentFixture<DatasetNameDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatasetNameDialog],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { name: 'Fixture' } },
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DatasetNameDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('closes with a valid trimmed name', () => {
    const dialog = TestBed.inject(MatDialogRef);
    const controls = component as unknown as {
      model: { set(value: { name: string }): void };
      save(): void;
    };
    controls.model.set({ name: ' Renamed ' });
    controls.save();
    expect(dialog.close).toHaveBeenCalledWith('Renamed');
  });
});
