import type { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogHarness } from '@angular/material/dialog/testing';
import { MatSelectHarness } from '@angular/material/select/testing';
import { provideRouter } from '@angular/router';
import axe from 'axe-core';
import { of } from 'rxjs';
import type { ConvertedDatasetDescriptor, QdbConverterApi } from '../../../../shared/contracts';
import { AppStore } from '../../core/app-store';
import {
  DatasetColumnPreferences,
  datasetColumnPreferenceKey,
} from '../../core/dataset-column-preferences';
import { DatasetNameDialog } from '../../core/dataset-name-dialog/dataset-name-dialog';

import { ConvertedDatasetDetailsDialog } from './converted-dataset-details-dialog';
import { ConvertedDatasets } from './converted-datasets';

const dataset: ConvertedDatasetDescriptor = {
  id: '33333333-3333-4333-8333-333333333333',
  name: 'Fixture — FIFA 22',
  sourceDatasetId: '11111111-1111-4111-8111-111111111111',
  sourceDatasetName: 'Fixture',
  sourceVersion: 23,
  fifaVersion: 22,
  createdAt: new Date(1).toISOString(),
  status: 'available',
  tableNames: ['players', 'teams'],
  tableCount: 2,
  rowCount: 2,
  tableSummaries: [
    {
      table: 'players',
      rows: 2,
      defaultSubstitutions: 0,
      ratingDifferences: 0,
      warnings: [],
    },
    {
      table: 'teams',
      rows: 0,
      defaultSubstitutions: 0,
      ratingDifferences: 0,
      warnings: [],
    },
  ],
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
  status: 'corrupt',
  tableNames: ['leagues'],
  tableCount: 1,
  rowCount: 500,
  tableSummaries: [
    {
      table: 'leagues',
      rows: 500,
      defaultSubstitutions: 0,
      ratingDifferences: 0,
      warnings: [],
    },
  ],
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

  it('lists converted metadata with an accessible table', async () => {
    await TestBed.inject(AppStore).refresh();
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('th.mat-column-source')?.textContent?.trim()).toBe('Source');
    expect(
      [...element.querySelectorAll('td.mat-column-source')].map((cell) => cell.textContent?.trim()),
    ).toEqual(['FIFA 21', 'FIFA 23']);
    expect(element.querySelector('th.mat-column-target')?.textContent?.trim()).toBe('Target');
    expect(
      [...element.querySelectorAll('td.mat-column-target')].map((cell) => cell.textContent?.trim()),
    ).toEqual(['FIFA 20', 'FIFA 22']);
    expect(element.querySelector('.source-name')).toBeNull();
    expect(element.textContent).not.toContain('From Fixture');
    const nameButtons = element.querySelectorAll<HTMLButtonElement>('.dataset-name-button');
    expect(nameButtons).toHaveLength(2);
    expect(nameButtons[0]?.getAttribute('aria-haspopup')).toBe('dialog');
    expect(nameButtons[0]?.getAttribute('aria-label')).toBe('View details for Second');
    expect(
      [...element.querySelectorAll('app-status-badge')].map((badge) => badge.textContent?.trim()),
    ).toEqual(['Corrupt', 'Available']);
    expect((await axe.run(element)).violations).toEqual([]);
  });

  it('opens the selected converted dataset in a responsive details dialog', async () => {
    await TestBed.inject(AppStore).refresh();
    await fixture.whenStable();
    const open = vi
      .spyOn(TestBed.inject(MatDialog), 'open')
      .mockReturnValueOnce({ afterClosed: () => of('rename') } as never)
      .mockReturnValueOnce({ afterClosed: () => of(undefined) } as never);
    const nameButton = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(
        '.dataset-name-button',
      ),
    ].find((button) => button.textContent?.trim() === dataset.name);

    expect(nameButton).toBeDefined();
    nameButton!.click();

    expect(open).toHaveBeenNthCalledWith(1, ConvertedDatasetDetailsDialog, {
      data: dataset,
      width: '720px',
      maxWidth: 'calc(100vw - 2rem)',
      autoFocus: 'dialog',
      restoreFocus: true,
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
    nameButton!.click();
    expect(open).toHaveBeenCalledTimes(1);
  });

  it('expands one accessible per-table record summary at a time', async () => {
    await TestBed.inject(AppStore).refresh();
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const fixtureToggle = element.querySelector<HTMLButtonElement>(
      `button[aria-label="Expand record counts for ${dataset.name}"]`,
    )!;
    const secondToggle = element.querySelector<HTMLButtonElement>(
      `button[aria-label="Expand record counts for ${secondDataset.name}"]`,
    )!;

    expect(fixtureToggle.getAttribute('aria-expanded')).toBe('false');
    expect(element.querySelector('.record-detail-row--expanded')).toBeNull();

    fixtureToggle.click();
    await fixture.whenStable();

    const fixtureDetails = document.getElementById(`converted-dataset-records-${dataset.id}`)!;
    expect(fixtureToggle.getAttribute('aria-expanded')).toBe('true');
    expect(fixtureToggle.getAttribute('aria-controls')).toBe(fixtureDetails.id);
    expect(
      [...fixtureDetails.querySelectorAll('.record-count-grid > div')].map((metric) => ({
        table: metric.querySelector('dt')?.textContent?.trim(),
        records: metric.querySelector('dd')?.textContent?.trim(),
      })),
    ).toEqual([
      { table: 'players', records: '2' },
      { table: 'teams', records: '0' },
    ]);
    expect((await axe.run(element)).violations).toEqual([]);

    secondToggle.click();
    await fixture.whenStable();

    expect(fixtureToggle.getAttribute('aria-expanded')).toBe('false');
    expect(secondToggle.getAttribute('aria-expanded')).toBe('true');
    expect(element.querySelectorAll('.record-detail-row--expanded')).toHaveLength(1);
    expect(
      document
        .getElementById(`converted-dataset-records-${secondDataset.id}`)
        ?.querySelector('dd')
        ?.textContent?.trim(),
    ).toBe('500');

    secondToggle.click();
    await fixture.whenStable();
    expect(secondToggle.getAttribute('aria-expanded')).toBe('false');
    expect(element.querySelector('.record-detail-row--expanded')).toBeNull();
  });

  it('lists known tables when legacy per-table record counts are unavailable', async () => {
    const legacyDataset: ConvertedDatasetDescriptor = {
      ...dataset,
      tableSummaries: [],
    };
    vi.mocked(window.qdbConverter!.listConvertedDatasets).mockResolvedValueOnce([legacyDataset]);
    await TestBed.inject(AppStore).refresh();
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    element
      .querySelector<HTMLButtonElement>(
        `button[aria-label="Expand record counts for ${legacyDataset.name}"]`,
      )!
      .click();
    await fixture.whenStable();

    const details = document.getElementById(`converted-dataset-records-${legacyDataset.id}`)!;
    expect(details.querySelector('.record-count-fallback')?.textContent).toContain(
      'Per-table record counts were not recorded',
    );
    expect(
      [...details.querySelectorAll('.record-count-grid--unavailable > div')].map((metric) => ({
        table: metric.querySelector('dt')?.textContent?.trim(),
        records: metric.querySelector('dd')?.textContent?.trim(),
      })),
    ).toEqual([
      { table: 'players', records: 'Unavailable' },
      { table: 'teams', records: 'Unavailable' },
    ]);
    expect((await axe.run(element)).violations).toEqual([]);
  });

  it('collapses record details when the table context changes or a deletion succeeds', async () => {
    await TestBed.inject(AppStore).refresh();
    await fixture.whenStable();
    const controls = component as unknown as {
      expandedDatasetId(): string | undefined;
      toggleExpanded(value: ConvertedDatasetDescriptor): void;
      setQuery(event: Event): void;
      pageChanged(event: { pageIndex: number; pageSize: number; length: number }): void;
      applyFilters(filters: { sourceVersion: 'all'; targetVersion: 'all'; status: 'all' }): void;
      deleteDataset(id: string): Promise<void>;
    };

    controls.toggleExpanded(dataset);
    controls.setQuery({
      target: Object.assign(document.createElement('input'), { value: '' }),
    } as unknown as Event);
    expect(controls.expandedDatasetId()).toBeUndefined();

    controls.toggleExpanded(dataset);
    controls.pageChanged({ pageIndex: 0, pageSize: 10, length: 2 });
    expect(controls.expandedDatasetId()).toBeUndefined();

    controls.toggleExpanded(dataset);
    controls.applyFilters({ sourceVersion: 'all', targetVersion: 'all', status: 'all' });
    expect(controls.expandedDatasetId()).toBeUndefined();

    controls.toggleExpanded(dataset);
    await controls.deleteDataset(dataset.id);
    expect(controls.expandedDatasetId()).toBeUndefined();
  });

  it('searches, renames, and removes converted datasets independently', async () => {
    await TestBed.inject(AppStore).refresh();
    const controls = component as unknown as {
      setQuery(event: Event): void;
      rename(value: ConvertedDatasetDescriptor): void;
      remove(value: ConvertedDatasetDescriptor): void;
      filtered(): ConvertedDatasetDescriptor[];
    };
    const input = Object.assign(document.createElement('input'), { value: 'fixture' });
    controls.setQuery({ target: input } as unknown as Event);
    expect(controls.filtered()).toEqual([dataset]);

    const open = vi.spyOn(TestBed.inject(MatDialog), 'open');
    open.mockReturnValueOnce({ afterClosed: () => of('Renamed') } as never);
    controls.rename(dataset);
    expect(open).toHaveBeenCalledWith(DatasetNameDialog, {
      data: { name: dataset.name },
      width: '440px',
      maxWidth: 'calc(100vw - 2rem)',
      ariaDescribedBy: 'dataset-name-dialog-description',
      autoFocus: '[data-dialog-primary-field]',
      restoreFocus: true,
    });
    await vi.waitFor(() =>
      expect(window.qdbConverter!.renameConvertedDataset).toHaveBeenCalledWith(
        dataset.id,
        'Renamed',
      ),
    );

    open.mockReturnValueOnce({ afterClosed: () => of(true) } as never);
    controls.remove(dataset);
    await vi.waitFor(() =>
      expect(window.qdbConverter!.removeConvertedDatasets).toHaveBeenCalledWith([dataset.id]),
    );
  });

  it('filters converted datasets from an accessible right drawer and clears every filter', async () => {
    await TestBed.inject(AppStore).refresh();
    await fixture.whenStable();
    const controls = component as unknown as {
      filtered(): ConvertedDatasetDescriptor[];
      query(): string;
      setQuery(event: Event): void;
    };
    const filterButton = await loader.getHarness(
      MatButtonHarness.with({ selector: '.filter-button' }),
    );

    expect(await filterButton.getAppearance()).toBe('tonal');
    expect(await (await filterButton.host()).getAttribute('aria-label')).toBe('Open filters');
    await filterButton.click();

    const drawer = await documentLoader.getHarness(MatDialogHarness);
    expect(await drawer.getRole()).toBe('dialog');
    expect(await drawer.getAriaLabelledby()).toBe('dataset-filter-title');
    const panel = document.querySelector<HTMLElement>('.dataset-filter-drawer-panel')!;
    expect(panel.style.height).toBe('100vh');
    expect(panel.parentElement?.style.justifyContent).toBe('flex-end');
    expect((await axe.run(panel)).violations).toEqual([]);

    const sourceVersion = await documentLoader.getHarness(
      MatSelectHarness.with({
        selector: '[aria-label="Filter converted datasets by source FIFA version"]',
      }),
    );
    const targetVersion = await documentLoader.getHarness(
      MatSelectHarness.with({
        selector: '[aria-label="Filter converted datasets by target FIFA version"]',
      }),
    );
    const status = await documentLoader.getHarness(
      MatSelectHarness.with({
        selector: '[aria-label="Filter converted datasets by status"]',
      }),
    );
    await sourceVersion.open();
    await sourceVersion.clickOptions({ text: 'FIFA 23' });
    await targetVersion.open();
    await targetVersion.clickOptions({ text: 'FIFA 22' });
    await status.open();
    await status.clickOptions({ text: 'Available' });

    expect(controls.filtered()).toEqual([secondDataset, dataset]);
    await (await documentLoader.getHarness(MatButtonHarness.with({ text: 'Apply' }))).click();
    await fixture.whenStable();

    await vi.waitFor(() => expect(controls.filtered()).toEqual([dataset]));
    expect(await (await filterButton.host()).getAttribute('aria-label')).toBe(
      'Open filters, 3 active',
    );

    const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
      'input[type="search"]',
    )!;
    input.value = 'missing';
    controls.setQuery({ target: input } as unknown as Event);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.empty-state h2')?.textContent).toBe(
      'No datasets match your filters',
    );
    expect(element.querySelector('.empty-state button')?.textContent).toContain('Clear filters');
    expect((await axe.run(element)).violations).toEqual([]);

    element.querySelector<HTMLButtonElement>('.empty-state button')!.click();
    await fixture.whenStable();
    expect(controls.query()).toBe('');
    expect(controls.filtered()).toEqual([secondDataset, dataset]);
    expect(await (await filterButton.host()).getAttribute('aria-label')).toBe('Open filters');

    await filterButton.click();
    const sourceOnly = await documentLoader.getHarness(
      MatSelectHarness.with({
        selector: '[aria-label="Filter converted datasets by source FIFA version"]',
      }),
    );
    await sourceOnly.open();
    await sourceOnly.clickOptions({ text: 'FIFA 23' });
    await (await documentLoader.getHarness(MatButtonHarness.with({ text: 'Apply' }))).click();
    await fixture.whenStable();
    await vi.waitFor(() => expect(controls.filtered()).toEqual([dataset]));

    await filterButton.click();
    await (await documentLoader.getHarness(MatButtonHarness.with({ text: 'Clear all' }))).click();
    await (await documentLoader.getHarness(MatButtonHarness.with({ text: 'Apply' }))).click();
    await fixture.whenStable();
    await vi.waitFor(() => expect(controls.filtered()).toEqual([secondDataset, dataset]));
    expect(await (await filterButton.host()).getAttribute('aria-label')).toBe('Open filters');
  });

  it('customizes converted columns independently in an accessible right drawer', async () => {
    await TestBed.inject(AppStore).refresh();
    await fixture.whenStable();
    const saveColumns = vi.spyOn(TestBed.inject(DatasetColumnPreferences), 'save');
    const columnButton = await loader.getHarness(
      MatButtonHarness.with({ selector: '.column-button' }),
    );

    expect(await (await columnButton.host()).getAttribute('aria-label')).toBe(
      'Choose columns, 0 hidden',
    );
    await columnButton.click();

    const drawer = await documentLoader.getHarness(MatDialogHarness);
    expect(await drawer.getAriaLabelledby()).toBe('dataset-column-title');
    const panel = document.querySelector<HTMLElement>('.dataset-column-drawer-panel')!;
    const target = await documentLoader.getHarness(MatCheckboxHarness.with({ label: 'Target' }));
    expect((await axe.run(panel)).violations).toEqual([]);

    await target.uncheck();
    await fixture.whenStable();
    await (await documentLoader.getHarness(MatButtonHarness.with({ text: 'Apply' }))).click();
    await vi.waitFor(() => expect(saveColumns).toHaveBeenCalledOnce());
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(saveColumns).toHaveBeenCalledWith(
      'converted',
      expect.objectContaining({ visible: expect.not.arrayContaining(['target']) }),
    );
    expect(element.querySelector('th.mat-column-target')).toBeNull();
    expect(await (await columnButton.host()).getAttribute('aria-label')).toBe(
      'Choose columns, 1 hidden',
    );
    expect(
      JSON.parse(localStorage.getItem(datasetColumnPreferenceKey('converted')) ?? '{}'),
    ).toMatchObject({
      visible: expect.not.arrayContaining(['target']),
    });
    expect(localStorage.getItem(datasetColumnPreferenceKey('imported'))).toBeNull();
  });

  it('selects the visible page with accessible row and indeterminate header checkboxes', async () => {
    await TestBed.inject(AppStore).refresh();
    await fixture.whenStable();
    const rowCheckboxes = await loader.getAllHarnesses(
      MatCheckboxHarness.with({ selector: '.row-select-checkbox' }),
    );
    const selectAll = await loader.getHarness(
      MatCheckboxHarness.with({ selector: '.select-all-checkbox' }),
    );
    const element = fixture.nativeElement as HTMLElement;

    expect(rowCheckboxes).toHaveLength(2);
    expect(
      element
        .querySelector<HTMLInputElement>('.row-select-checkbox input')
        ?.getAttribute('aria-label'),
    ).toBe('Select Second');
    expect(element.querySelector('.selection-footer')).toBeNull();

    await rowCheckboxes[0]!.check();
    await fixture.whenStable();

    expect(await selectAll.isIndeterminate()).toBe(true);
    expect(element.querySelector('.selection-footer')?.textContent).toContain('1 dataset selected');
    expect(element.querySelectorAll('.selected-row')).toHaveLength(1);
    expect((await axe.run(element)).violations).toEqual([]);

    await selectAll.check();
    await fixture.whenStable();

    expect(await selectAll.isChecked()).toBe(true);
    expect(element.querySelector('.selection-footer')?.textContent).toContain(
      '2 datasets selected',
    );

    const controls = component as unknown as {
      setQuery(event: Event): void;
      pageChanged(event: { pageIndex: number; pageSize: number; length: number }): void;
      selectedCount(): number;
    };
    const input = document.createElement('input');
    input.value = 'fixture';
    controls.setQuery({ target: input } as unknown as Event);
    await fixture.whenStable();

    expect(controls.selectedCount()).toBe(0);
    expect(element.querySelector('.selection-footer')).toBeNull();

    await (
      await loader.getHarness(MatCheckboxHarness.with({ selector: '.row-select-checkbox' }))
    ).check();
    controls.pageChanged({ pageIndex: 0, pageSize: 1, length: 1 });
    await fixture.whenStable();

    expect(controls.selectedCount()).toBe(0);
  });

  it('confirms and bulk deletes selected datasets through one bridge call', async () => {
    await TestBed.inject(AppStore).refresh();
    await fixture.whenStable();
    await (
      await loader.getHarness(MatCheckboxHarness.with({ selector: '.select-all-checkbox' }))
    ).check();
    await (
      await loader.getHarness(MatButtonHarness.with({ selector: '.bulk-delete-button' }))
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

    expect((fixture.nativeElement as HTMLElement).querySelector('.selection-footer')).toBeNull();
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
      MatCheckboxHarness.with({ selector: '.row-select-checkbox' }),
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
      MatCheckboxHarness.with({ selector: '.select-all-checkbox' }),
    );
    const deleteButton = await loader.getHarness(
      MatButtonHarness.with({ selector: '.bulk-delete-button' }),
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

    expect(element.querySelector('.empty-state h2')?.textContent).toBe('No converted datasets');
    expect(element.textContent).not.toContain('history');
    expect((await axe.run(element)).violations).toEqual([]);
  });
});
