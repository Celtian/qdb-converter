import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import axe from 'axe-core';

import { DatasetNameDialog } from './dataset-name-dialog';

interface DialogControls {
  model: { set(value: { name: string }): void };
  canSave(): boolean;
  save(): Promise<void>;
}

describe('DatasetNameDialog', () => {
  let component: DatasetNameDialog;
  let fixture: ComponentFixture<DatasetNameDialog>;
  let dialogRef: { close: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    dialogRef = { close: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [DatasetNameDialog],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { name: 'Fixture' } },
        { provide: MatDialogRef, useValue: dialogRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DatasetNameDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders guidance, a character counter, and clear actions', () => {
    const content = fixture.nativeElement as HTMLElement;
    const buttons = Array.from(content.querySelectorAll<HTMLButtonElement>('button'));

    expect(content.querySelector('p#dataset-name-dialog-description')?.textContent?.trim()).toBe(
      'Choose a clear name to help you find this dataset later.',
    );
    expect(content.querySelector('mat-hint')?.textContent?.replace(/\s/g, '')).toBe('7/80');
    expect(buttons.map((button) => button.textContent?.trim())).toEqual(['Cancel', 'Save changes']);
    expect(buttons[1]?.disabled).toBe(true);
  });

  it('closes with a valid trimmed name', async () => {
    const controls = component as unknown as DialogControls;
    controls.model.set({ name: ' Renamed ' });
    await fixture.whenStable();

    expect(controls.canSave()).toBe(true);
    expect(
      (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
        'button[type="submit"]',
      )?.disabled,
    ).toBe(false);

    await controls.save();

    expect(dialogRef.close).toHaveBeenCalledWith('Renamed');
  });

  it('does not submit an unchanged name', async () => {
    const controls = component as unknown as DialogControls;

    await controls.save();

    expect(controls.canSave()).toBe(false);
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it.each([
    { value: '', error: 'Enter a dataset name.' },
    { value: '   ', error: 'Enter a dataset name.' },
    { value: 'x'.repeat(81), error: 'Use 80 characters or fewer.' },
  ])('rejects the invalid name "$value"', async ({ value, error }) => {
    const controls = component as unknown as DialogControls;
    controls.model.set({ name: value });

    await controls.save();
    await fixture.whenStable();

    const content = fixture.nativeElement as HTMLElement;
    const input = content.querySelector<HTMLInputElement>('input');
    const fieldError = content.querySelector<HTMLElement>('mat-error');

    expect(dialogRef.close).not.toHaveBeenCalled();
    expect(fieldError?.textContent?.trim()).toBe(error);
    expect(input?.getAttribute('aria-describedby')).toContain(fieldError?.id);
  });

  it('submits a valid changed name through the native form', async () => {
    const controls = component as unknown as DialogControls;
    controls.model.set({ name: 'Keyboard rename' });
    await fixture.whenStable();

    const form = (fixture.nativeElement as HTMLElement).querySelector<HTMLFormElement>('form');
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
    form?.dispatchEvent(submitEvent);

    await vi.waitFor(() => expect(dialogRef.close).toHaveBeenCalledWith('Keyboard rename'));
    expect(submitEvent.defaultPrevented).toBe(true);
  });

  it('has no automatically detectable accessibility violations', async () => {
    const result = await axe.run(fixture.nativeElement as HTMLElement);
    expect(result.violations).toEqual([]);
  });
});
