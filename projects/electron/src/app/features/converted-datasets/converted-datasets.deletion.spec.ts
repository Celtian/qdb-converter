import type { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';
import { MatDialogHarness } from '@angular/material/dialog/testing';
import { provideRouter } from '@angular/router';

import axe from 'axe-core';

import type { ConvertedDatasetDescriptor, QdbConverterApi } from '../../../../shared/contracts';
import { AppStore } from '../../core/app-store';
import { datasetColumnPreferenceKey } from '../../core/dataset-column-preferences';
import { ConvertedDatasets } from './converted-datasets';

const dataset: ConvertedDatasetDescriptor = {
  id: '33333333-3333-4333-8333-333333333333',
  name: 'Fixture — FIFA 22',
  resultKind: 'conversion',
  sourceDatasetKind: 'imported',
  sourceDatasetId: '11111111-1111-4111-8111-111111111111',
  sourceDatasetName: 'Fixture',
  sourceVersion: 23,
  fifaVersion: 22,
  createdAt: new Date(1).toISOString(),
  updatedAt: new Date(1).toISOString(),
  status: 'available',
  tableNames: ['players'],
  tableCount: 1,
  rowCount: 2,
  tableSummaries: [],
  warnings: [],
};

const secondDataset: ConvertedDatasetDescriptor = {
  ...dataset,
  id: '55555555-5555-4555-8555-555555555555',
  name: 'Second',
  sourceDatasetName: 'Other',
  sourceVersion: 21,
  fifaVersion: 20,
  createdAt: new Date(2).toISOString(),
  updatedAt: new Date(2).toISOString(),
  status: 'corrupt',
};

describe('ConvertedDatasets', () => {
  let component: ConvertedDatasets;
  let fixture: ComponentFixture<ConvertedDatasets>;
  let loader: HarnessLoader;
  let documentLoader: HarnessLoader;

  beforeEach(async () => {
    localStorage.removeItem(datasetColumnPreferenceKey('imported'));
    localStorage.removeItem(datasetColumnPreferenceKey('converted'));
    window.qdbConverter = {
      listImportedDatasets: vi.fn(async () => []),
      listConvertedDatasets: vi.fn(async () => [dataset, secondDataset]),
      renameConvertedDataset: vi.fn(async () => dataset),
      removeConvertedDataset: vi.fn(async () => true),
      removeConvertedDatasets: vi.fn(async (ids) => ids.length),
      onImportProgress: vi.fn(() => () => undefined),
      onConversionProgress: vi.fn(() => () => undefined),
    } as unknown as QdbConverterApi;
    await TestBed.configureTestingModule({
      imports: [ConvertedDatasets],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ConvertedDatasets);
    component = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
    documentLoader = TestbedHarnessEnvironment.documentRootLoader(fixture);
    await fixture.whenStable();
  });

  it('confirms and bulk deletes selected datasets through one bridge call', async () => {
    await TestBed.inject(AppStore).refresh();
    await fixture.whenStable();
    await (
      await loader.getHarness(MatCheckboxHarness.with({ selector: 'thead mat-checkbox' }))
    ).check();
    await (
      await loader.getHarness(
        MatButtonHarness.with({ selector: 'aside[aria-label^="Selected"] button' }),
      )
    ).click();

    const dialog = await documentLoader.getHarness(MatDialogHarness);
    expect(await dialog.getRole()).toBe('alertdialog');
    expect(await dialog.getTitleText()).toBe('Delete selected datasets?');
    expect(await dialog.getText()).toContain(
      'Imported datasets and previously exported folders remain untouched.',
    );
    await (await dialog.getHarness(MatButtonHarness.with({ text: 'Delete 2 datasets' }))).click();

    await vi.waitFor(() =>
      expect(window.qdbConverter!.removeConvertedDatasets).toHaveBeenCalledWith([
        secondDataset.id,
        dataset.id,
      ]),
    );
    await fixture.whenStable();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('aside[aria-label^="Selected"]'),
    ).toBeNull();
  });

  it('disables dataset actions while deleting and retains selection after a failure', async () => {
    await TestBed.inject(AppStore).refresh();
    await fixture.whenStable();
    let rejectDeletion!: (error: Error) => void;
    vi.mocked(window.qdbConverter!.removeConvertedDatasets).mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          rejectDeletion = reject;
        }),
    );
    const rowCheckbox = await loader.getHarness(
      MatCheckboxHarness.with({ selector: 'tbody mat-checkbox' }),
    );
    await rowCheckbox.check();
    const controls = component as unknown as {
      deleteSelectedDatasets(): Promise<void>;
      selectedCount(): number;
    };

    const deletion = controls.deleteSelectedDatasets();
    await Promise.resolve();
    await fixture.whenStable();

    const selectAll = await loader.getHarness(
      MatCheckboxHarness.with({ selector: 'thead mat-checkbox' }),
    );
    const deleteButton = await loader.getHarness(
      MatButtonHarness.with({ selector: 'aside[aria-label^="Selected"] button' }),
    );
    const actionButtons = (
      fixture.nativeElement as HTMLElement
    ).querySelectorAll<HTMLButtonElement>('button[aria-label^="Actions for"]');
    expect(await selectAll.isDisabled()).toBe(true);
    expect(await rowCheckbox.isDisabled()).toBe(true);
    expect(await deleteButton.isDisabled()).toBe(true);
    expect([...actionButtons].every((button) => button.disabled)).toBe(true);

    rejectDeletion(new Error('Selected converted datasets could not be deleted.'));
    await deletion;
    await fixture.whenStable();

    expect(controls.selectedCount()).toBe(1);
    expect(await deleteButton.isDisabled()).toBe(false);
    expect([...actionButtons].every((button) => !button.disabled)).toBe(true);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Selected converted datasets could not be deleted.',
    );
  });

  it('shows an accessible empty state without conversion history terminology', async () => {
    vi.mocked(window.qdbConverter!.listConvertedDatasets).mockResolvedValueOnce([]);
    await TestBed.inject(AppStore).refresh();
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('div[role="status"] h2')?.textContent).toBe(
      'No generated datasets',
    );
    expect(element.textContent).not.toContain('history');
    expect((await axe.run(element)).violations).toEqual([]);
  });
});
