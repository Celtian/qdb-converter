import type { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogHarness } from '@angular/material/dialog/testing';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { provideRouter } from '@angular/router';

import axe from 'axe-core';
import { of } from 'rxjs';

import type { ImportedDatasetDescriptor, QdbConverterApi } from '../../../../shared/contracts';
import { AppStore } from '../../core/app-store';
import { datasetColumnPreferenceKey } from '../../core/dataset-column-preferences';
import { DatasetNameDialog } from '../../core/dataset-name-dialog/dataset-name-dialog';
import { DatasetDetailsDialog } from './dataset-details-dialog';
import { ImportedDatasets } from './datasets';

const dataset: ImportedDatasetDescriptor = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Fixture',
  fifaVersion: 23,
  source: {
    kind: 'text-folder',
    originalPaths: ['/fixture'],
    hashes: {},
    importedAt: new Date(0).toISOString(),
  },
  status: 'available',
  tableNames: ['players'],
  tableCount: 1,
  rowCount: 1,
  warnings: [],
};

const secondDataset: ImportedDatasetDescriptor = {
  ...dataset,
  id: '44444444-4444-4444-8444-444444444444',
  name: 'Second',
  fifaVersion: 22,
  tableCount: 3,
  rowCount: 500,
  warnings: ['An optional table was not present.'],
  source: {
    ...dataset.source,
    kind: 't3db',
    originalPaths: ['/second'],
    importedAt: new Date(1).toISOString(),
  },
};

describe('ImportedDatasets', () => {
  let component: ImportedDatasets;
  let fixture: ComponentFixture<ImportedDatasets>;
  let loader: HarnessLoader;
  let documentLoader: HarnessLoader;

  beforeEach(async () => {
    localStorage.removeItem(datasetColumnPreferenceKey('imported'));
    localStorage.removeItem(datasetColumnPreferenceKey('converted'));
    window.qdbConverter = {
      listImportedDatasets: vi.fn(async () => [dataset, secondDataset]),
      listConvertedDatasets: vi.fn(async () => []),
      validateDataset: vi.fn(),
      renameImportedDataset: vi.fn(async () => dataset),
      removeImportedDataset: vi.fn(async () => true),
      removeImportedDatasets: vi.fn(async (ids) => ids.length),
      onImportProgress: vi.fn(() => () => undefined),
      onConversionProgress: vi.fn(() => () => undefined),
    } as unknown as QdbConverterApi;
    await TestBed.configureTestingModule({
      imports: [ImportedDatasets],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ImportedDatasets);
    component = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
    documentLoader = TestbedHarnessEnvironment.documentRootLoader(fixture);
    await fixture.whenStable();
  });

  it('keeps validation out of the dataset actions menu', async () => {
    await TestBed.inject(AppStore).refresh();
    await fixture.whenStable();
    const menus = await loader.getAllHarnesses(MatMenuHarness);
    await menus[0]!.open();
    const items = await menus[0]!.getItems();
    const labels = await Promise.all(items.map((item) => item.getText()));
    expect(labels).toEqual(['editRename', 'deleteDelete']);
    expect(labels.every((label) => !label.includes('Run validations'))).toBe(true);
  });

  it('opens compact details for the selected dataset name', async () => {
    await TestBed.inject(AppStore).refresh();
    await fixture.whenStable();
    const nameButton = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      'button[aria-haspopup="dialog"]',
    )!;

    expect(nameButton.textContent).toContain(secondDataset.name);
    expect(nameButton.getAttribute('aria-haspopup')).toBe('dialog');
    expect(nameButton.getAttribute('aria-label')).toBe(`View details for ${secondDataset.name}`);
    expect(nameButton.closest('td')?.textContent).not.toContain('warning(s)');

    nameButton.click();
    await fixture.whenStable();

    const dialog = await documentLoader.getHarness(MatDialogHarness);
    expect(await dialog.getTitleText()).toBe(secondDataset.name);
    expect(await dialog.getText()).toContain(secondDataset.source.originalPaths[0]);
    expect(await dialog.getText()).toContain(secondDataset.warnings[0]);
    expect(window.qdbConverter!.validateDataset).not.toHaveBeenCalled();
  });

  it('opens rename after a details request and ignores ordinary details dismissal', async () => {
    await TestBed.inject(AppStore).refresh();
    const controls = component as unknown as {
      showDetails(value: ImportedDatasetDescriptor): void;
    };
    const open = vi.spyOn(TestBed.inject(MatDialog), 'open');

    open
      .mockReturnValueOnce({ afterClosed: () => of('rename') } as never)
      .mockReturnValueOnce({ afterClosed: () => of(undefined) } as never);
    controls.showDetails(dataset);

    expect(open).toHaveBeenNthCalledWith(1, DatasetDetailsDialog, {
      data: dataset,
      width: '520px',
      maxWidth: 'calc(100vw - 2rem)',
      autoFocus: 'dialog',
    });
    expect(open).toHaveBeenNthCalledWith(2, DatasetNameDialog, {
      data: { name: dataset.name },
      width: '440px',
      maxWidth: 'calc(100vw - 2rem)',
      ariaDescribedBy: 'dataset-name-dialog-description',
      autoFocus: '[data-dialog-primary-field]',
      restoreFocus: true,
    });

    open.mockClear();
    open.mockReturnValueOnce({ afterClosed: () => of(undefined) } as never);
    controls.showDetails(dataset);
    expect(open).toHaveBeenCalledTimes(1);
  });

  it('paginates rows and resets or clamps the page when the result changes', async () => {
    await TestBed.inject(AppStore).refresh();
    await fixture.whenStable();
    const controls = component as unknown as {
      setQuery(event: Event): void;
      pageChanged(event: { pageIndex: number; pageSize: number; length: number }): void;
      pageIndex(): number;
      effectivePageIndex(): number;
      paged(): ImportedDatasetDescriptor[];
    };

    expect((fixture.nativeElement as HTMLElement).querySelector('mat-paginator')).toBeTruthy();
    controls.pageChanged({ pageIndex: 1, pageSize: 1, length: 2 });
    expect(controls.paged()).toEqual([dataset]);

    const input = document.createElement('input');
    input.value = 'fixture';
    controls.setQuery({ target: input } as unknown as Event);
    expect(controls.pageIndex()).toBe(0);
    expect(controls.paged()).toEqual([dataset]);

    controls.pageChanged({ pageIndex: 1, pageSize: 1, length: 2 });
    input.value = 'missing';
    controls.setQuery({ target: input } as unknown as Event);
    expect(controls.effectivePageIndex()).toBe(0);
    expect(controls.paged()).toEqual([]);
  });

  it('splits table and row counts into sortable numeric columns', async () => {
    await TestBed.inject(AppStore).refresh();
    await fixture.whenStable();
    const controls = component as unknown as {
      sortChanged(sort: { active: string; direction: 'asc' | 'desc' }): void;
      paged(): ImportedDatasetDescriptor[];
      sortAnnouncement(): string;
    };
    const element = fixture.nativeElement as HTMLElement;
    const headers = [...element.querySelectorAll('th')].map((header) => header.textContent?.trim());

    expect(headers).toContain('Tables');
    expect(headers).toContain('Rows');
    expect(headers).not.toContain('Contents');
    expect(element.querySelectorAll('th.mat-column-tables.mat-sort-header')).toHaveLength(1);
    expect(element.querySelectorAll('th.mat-column-rows.mat-sort-header')).toHaveLength(1);

    controls.sortChanged({ active: 'tables', direction: 'asc' });
    await fixture.whenStable();
    expect(controls.paged()).toEqual([dataset, secondDataset]);

    controls.sortChanged({ active: 'rows', direction: 'desc' });
    await fixture.whenStable();
    expect(controls.paged()).toEqual([secondDataset, dataset]);
    expect(controls.sortAnnouncement()).toBe('Sorted by Rows descending.');
    expect((await axe.run(element)).violations).toEqual([]);
  });

  it('selects the visible page with accessible row and indeterminate header checkboxes', async () => {
    await TestBed.inject(AppStore).refresh();
    await fixture.whenStable();
    const rowCheckboxes = await loader.getAllHarnesses(
      MatCheckboxHarness.with({ selector: 'tbody mat-checkbox' }),
    );
    const selectAll = await loader.getHarness(
      MatCheckboxHarness.with({ selector: 'thead mat-checkbox' }),
    );
    const element = fixture.nativeElement as HTMLElement;

    expect(rowCheckboxes).toHaveLength(2);
    expect(
      element
        .querySelector<HTMLInputElement>('tbody mat-checkbox input')
        ?.getAttribute('aria-label'),
    ).toBe('Select Second');
    expect(element.querySelector('aside[aria-label^="Selected"]')).toBeNull();

    await rowCheckboxes[0]!.check();
    await fixture.whenStable();

    expect(await selectAll.isIndeterminate()).toBe(true);
    expect(element.querySelector('aside[aria-label^="Selected"]')?.textContent).toContain(
      '1 dataset selected',
    );
    expect(element.querySelectorAll('tr.bg-secondary-container')).toHaveLength(1);
    expect((await axe.run(element)).violations).toEqual([]);

    await selectAll.check();
    await fixture.whenStable();

    expect(await selectAll.isChecked()).toBe(true);
    expect(element.querySelector('aside[aria-label^="Selected"]')?.textContent).toContain(
      '2 datasets selected',
    );

    const controls = component as unknown as {
      setQuery(event: Event): void;
      selectedCount(): number;
    };
    const input = document.createElement('input');
    input.value = 'fixture';
    controls.setQuery({ target: input } as unknown as Event);
    await fixture.whenStable();

    expect(controls.selectedCount()).toBe(0);
    expect(element.querySelector('aside[aria-label^="Selected"]')).toBeNull();
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
      'Converted datasets and exported folders remain untouched.',
    );
    await (await dialog.getHarness(MatButtonHarness.with({ text: 'Delete 2 datasets' }))).click();

    await vi.waitFor(() =>
      expect(window.qdbConverter!.removeImportedDatasets).toHaveBeenCalledWith([
        secondDataset.id,
        dataset.id,
      ]),
    );
    await fixture.whenStable();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('aside[aria-label^="Selected"]'),
    ).toBeNull();
  });

  it('disables selection controls while deleting and retains selection after a failure', async () => {
    await TestBed.inject(AppStore).refresh();
    await fixture.whenStable();
    let rejectDeletion!: (error: Error) => void;
    vi.mocked(window.qdbConverter!.removeImportedDatasets).mockImplementationOnce(
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
    expect(await selectAll.isDisabled()).toBe(true);
    expect(await rowCheckbox.isDisabled()).toBe(true);
    expect(await deleteButton.isDisabled()).toBe(true);

    rejectDeletion(new Error('Selected datasets could not be deleted.'));
    await deletion;
    await fixture.whenStable();

    expect(controls.selectedCount()).toBe(1);
    expect(await deleteButton.isDisabled()).toBe(false);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Selected datasets could not be deleted.',
    );
  });

  it('replaces an empty table with an accessible onboarding state after loading', async () => {
    vi.mocked(window.qdbConverter!.listImportedDatasets).mockResolvedValueOnce([]);
    const store = TestBed.inject(AppStore);
    await store.refresh();
    store.loading.set(true);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('div[role="status"]')).toBeNull();

    store.loading.set(false);
    await fixture.whenStable();

    expect(element.querySelector('div[role="status"] h2')?.textContent).toBe(
      'No imported datasets found',
    );
    expect(element.querySelector('table')).toBeNull();
    expect(element.querySelector('mat-paginator')).toBeNull();
    expect((await axe.run(element)).violations).toEqual([]);
  });

  it('shows a no-match state and clears every dataset filter', async () => {
    await TestBed.inject(AppStore).refresh();
    const controls = component as unknown as {
      setQuery(event: Event): void;
      pageChanged(event: { pageIndex: number; pageSize: number; length: number }): void;
      query(): string;
      pageIndex(): number;
    };
    const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
      'input[type="search"]',
    )!;
    input.value = 'missing';
    controls.setQuery({ target: input } as unknown as Event);
    controls.pageChanged({ pageIndex: 1, pageSize: 1, length: 0 });
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('div[role="status"] h2')?.textContent).toBe(
      'No datasets match your filters',
    );
    expect(element.querySelector('table')).toBeNull();
    expect(element.querySelector('mat-paginator')).toBeNull();
    expect((await axe.run(element)).violations).toEqual([]);

    const clearButton = element.querySelector<HTMLButtonElement>('div[role="status"] + button')!;
    expect(clearButton.textContent).toContain('Clear filters');
    clearButton.click();
    await fixture.whenStable();

    expect(controls.query()).toBe('');
    expect(controls.pageIndex()).toBe(0);
    expect(input.value).toBe('');
    const filterButton = await loader.getHarness(
      MatButtonHarness.with({ selector: 'button[aria-label^="Open filters"]' }),
    );
    expect(await (await filterButton.host()).getAttribute('aria-label')).toBe('Open filters');
    expect(element.querySelector('table')).toBeTruthy();
    expect(element.querySelector('mat-paginator')).toBeTruthy();
  });
});
