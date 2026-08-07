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

import type { ImportedDatasetDescriptor, QdbConverterApi } from '../../../../shared/contracts';
import { AppStore } from '../../core/app-store';
import {
  DatasetColumnPreferences,
  datasetColumnPreferenceKey,
} from '../../core/dataset-column-preferences';
import { DatasetNameDialog } from '../../core/dataset-name-dialog/dataset-name-dialog';
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
  managedFormat: 'text-folder',
  updatedAt: new Date(0).toISOString(),
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

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the total filtered row count independently of pagination', async () => {
    await TestBed.inject(AppStore).refresh();
    await fixture.whenStable();
    const controls = component as unknown as {
      applyFilters(filters: {
        kind: 'imported';
        fifaVersion: number | 'all';
        sourceKind: 'text-folder' | 't3db' | 'all';
        playernameResult: 'all';
      }): void;
      clearFilters(): void;
      pageChanged(event: { pageIndex: number; pageSize: number; length: number }): void;
      setQuery(event: Event): void;
    };
    const element = fixture.nativeElement as HTMLElement;
    const rowCount = (): HTMLElement =>
      element.querySelector<HTMLElement>('p[aria-atomic="true"]')!;
    const search = (value: string): void => {
      controls.setQuery({
        target: Object.assign(document.createElement('input'), { value }),
      } as unknown as Event);
    };

    expect(rowCount().textContent?.trim()).toBe('2 rows');
    expect(rowCount().getAttribute('role')).toBe('status');
    expect(rowCount().getAttribute('aria-live')).toBe('polite');
    expect(rowCount().getAttribute('aria-atomic')).toBe('true');

    controls.pageChanged({ pageIndex: 1, pageSize: 1, length: 2 });
    await fixture.whenStable();
    expect(rowCount().textContent?.trim()).toBe('2 rows');

    search('fixture');
    await fixture.whenStable();
    expect(rowCount().textContent?.trim()).toBe('1 row');

    controls.clearFilters();
    controls.applyFilters({
      kind: 'imported',
      fifaVersion: 22,
      sourceKind: 'all',
      playernameResult: 'all',
    });
    await fixture.whenStable();
    expect(rowCount().textContent?.trim()).toBe('1 row');

    search('missing');
    await fixture.whenStable();
    expect(rowCount().textContent?.trim()).toBe('0 rows');

    controls.clearFilters();
    await fixture.whenStable();
    expect(rowCount().textContent?.trim()).toBe('2 rows');
  });

  it('renders dataset statuses as non-interactive badges', async () => {
    await TestBed.inject(AppStore).refresh();
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('app-status-badge span')?.textContent).toBe('Available');
    expect(element.querySelector('mat-chip')).toBeNull();
  });

  it('searches, renames, and removes catalog datasets', async () => {
    await TestBed.inject(AppStore).refresh();
    const controls = component as unknown as {
      setQuery(event: Event): void;
      rename(value: ImportedDatasetDescriptor): void;
      remove(value: ImportedDatasetDescriptor): void;
      filtered(): ImportedDatasetDescriptor[];
    };
    const input = document.createElement('input');
    input.value = 'fixture';
    controls.setQuery({ target: input } as unknown as Event);
    expect(controls.filtered()).toEqual([dataset]);

    const dialog = TestBed.inject(MatDialog);
    const open = vi.spyOn(dialog, 'open');
    open.mockReturnValueOnce({ afterClosed: () => of('Renamed') } as never);
    controls.rename(dataset);
    expect(open).toHaveBeenNthCalledWith(1, DatasetNameDialog, {
      data: { name: dataset.name },
      width: '440px',
      maxWidth: 'calc(100vw - 2rem)',
      ariaDescribedBy: 'dataset-name-dialog-description',
      autoFocus: '[data-dialog-primary-field]',
      restoreFocus: true,
    });
    await vi.waitFor(() =>
      expect(window.qdbConverter!.renameImportedDataset).toHaveBeenCalledWith(
        dataset.id,
        'Renamed',
      ),
    );
    open.mockReturnValueOnce({ afterClosed: () => of(true) } as never);
    controls.remove(dataset);
    await Promise.resolve();
    open.mockRestore();
    expect((fixture.nativeElement as HTMLElement).querySelector('a[href="/import"]')).toBeTruthy();
  });

  it('stages imported filters in an accessible right drawer and applies or clears them', async () => {
    await TestBed.inject(AppStore).refresh();
    await fixture.whenStable();
    const controls = component as unknown as {
      filtered(): ImportedDatasetDescriptor[];
      pageChanged(event: { pageIndex: number; pageSize: number; length: number }): void;
      pageIndex(): number;
      selectedCount(): number;
    };
    const filterButton = await loader.getHarness(
      MatButtonHarness.with({ selector: 'button[aria-label^="Open filters"]' }),
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
    expect(panel.querySelector('button[aria-label="Close filters"]')).toBeTruthy();
    expect((await axe.run(panel)).violations).toEqual([]);

    const version = await documentLoader.getHarness(
      MatSelectHarness.with({
        selector: '[aria-label="Filter imported datasets by FIFA version"]',
      }),
    );
    const source = await documentLoader.getHarness(
      MatSelectHarness.with({ selector: '[aria-label="Filter imported datasets by source"]' }),
    );
    await version.open();
    await version.clickOptions({ text: 'FIFA 23' });
    await source.open();
    await source.clickOptions({ text: 'Text folder' });

    expect(controls.filtered()).toEqual([secondDataset, dataset]);
    await (await documentLoader.getHarness(MatButtonHarness.with({ text: 'Cancel' }))).click();
    await fixture.whenStable();
    expect(controls.filtered()).toEqual([secondDataset, dataset]);

    controls.pageChanged({ pageIndex: 1, pageSize: 1, length: 2 });
    await fixture.whenStable();
    await (
      await loader.getHarness(MatCheckboxHarness.with({ selector: 'tbody mat-checkbox' }))
    ).check();
    expect(controls.selectedCount()).toBe(1);

    await filterButton.click();
    const appliedVersion = await documentLoader.getHarness(
      MatSelectHarness.with({
        selector: '[aria-label="Filter imported datasets by FIFA version"]',
      }),
    );
    const appliedSource = await documentLoader.getHarness(
      MatSelectHarness.with({ selector: '[aria-label="Filter imported datasets by source"]' }),
    );
    await appliedVersion.open();
    await appliedVersion.clickOptions({ text: 'FIFA 23' });
    await appliedSource.open();
    await appliedSource.clickOptions({ text: 'Text folder' });
    await (await documentLoader.getHarness(MatButtonHarness.with({ text: 'Apply' }))).click();
    await fixture.whenStable();

    await vi.waitFor(() => expect(controls.filtered()).toEqual([dataset]));
    expect(controls.pageIndex()).toBe(0);
    expect(controls.selectedCount()).toBe(0);
    expect(await (await filterButton.host()).getAttribute('aria-label')).toBe(
      'Open filters, 2 active',
    );

    await filterButton.click();
    await (await documentLoader.getHarness(MatButtonHarness.with({ text: 'Clear all' }))).click();
    await (await documentLoader.getHarness(MatButtonHarness.with({ text: 'Cancel' }))).click();
    await fixture.whenStable();
    expect(controls.filtered()).toEqual([dataset]);

    await filterButton.click();
    await (await documentLoader.getHarness(MatButtonHarness.with({ text: 'Clear all' }))).click();
    await (await documentLoader.getHarness(MatButtonHarness.with({ text: 'Apply' }))).click();
    await fixture.whenStable();
    await vi.waitFor(() => expect(controls.filtered()).toEqual([secondDataset, dataset]));
    expect(await (await filterButton.host()).getAttribute('aria-label')).toBe('Open filters');
  });

  it('customizes persistent imported columns in an accessible right drawer', async () => {
    await TestBed.inject(AppStore).refresh();
    await fixture.whenStable();
    const saveColumns = vi.spyOn(TestBed.inject(DatasetColumnPreferences), 'save');
    const controls = component as unknown as {
      pageChanged(event: { pageIndex: number; pageSize: number; length: number }): void;
      pageIndex(): number;
      sort(): { active: string; direction: string };
      sortChanged(sort: { active: string; direction: 'asc' | 'desc' }): void;
    };
    controls.sortChanged({ active: 'version', direction: 'desc' });
    controls.pageChanged({ pageIndex: 1, pageSize: 1, length: 2 });
    const columnButton = await loader.getHarness(
      MatButtonHarness.with({ selector: 'button[aria-label^="Choose columns"]' }),
    );
    const element = fixture.nativeElement as HTMLElement;
    const columnButtonElement = element.querySelector<HTMLButtonElement>(
      'button[aria-label^="Choose columns"]',
    )!;

    expect(await (await columnButton.host()).getAttribute('aria-label')).toBe(
      'Choose columns, 0 hidden',
    );
    columnButtonElement.focus();
    await columnButton.click();

    const drawer = await documentLoader.getHarness(MatDialogHarness);
    expect(await drawer.getRole()).toBe('dialog');
    expect(await drawer.getAriaLabelledby()).toBe('dataset-column-title');
    const panel = document.querySelector<HTMLElement>('.dataset-column-drawer-panel')!;
    expect(panel.style.height).toBe('100vh');
    expect(panel.parentElement?.style.justifyContent).toBe('flex-end');
    expect(panel.querySelector('button[aria-label="Close columns"]')).toBeTruthy();
    const name = await documentLoader.getHarness(MatCheckboxHarness.with({ label: 'Name' }));
    const actions = await documentLoader.getHarness(MatCheckboxHarness.with({ label: 'Actions' }));
    const version = await documentLoader.getHarness(MatCheckboxHarness.with({ label: 'Version' }));
    expect(await name.isDisabled()).toBe(true);
    expect(await actions.isDisabled()).toBe(true);
    expect((await axe.run(panel)).violations).toEqual([]);

    await version.uncheck();
    await fixture.whenStable();
    await (await documentLoader.getHarness(MatButtonHarness.with({ text: 'Apply' }))).click();
    await vi.waitFor(() => expect(saveColumns).toHaveBeenCalledOnce());
    await fixture.whenStable();

    expect(saveColumns).toHaveBeenCalledWith(
      'imported',
      expect.objectContaining({ visible: expect.not.arrayContaining(['version']) }),
    );
    expect(element.querySelector('th.mat-column-version')).toBeNull();
    expect(await (await columnButton.host()).getAttribute('aria-label')).toBe(
      'Choose columns, 1 hidden',
    );
    expect(controls.sort()).toEqual({ active: 'name', direction: 'asc' });
    expect(controls.pageIndex()).toBe(0);
    expect(
      JSON.parse(localStorage.getItem(datasetColumnPreferenceKey('imported')) ?? '{}'),
    ).toMatchObject({
      visible: expect.not.arrayContaining(['version']),
    });
    expect(localStorage.getItem(datasetColumnPreferenceKey('converted'))).toBeNull();
    expect(document.activeElement).toBe(columnButtonElement);

    await columnButton.click();
    await (
      await documentLoader.getHarness(MatButtonHarness.with({ text: 'Reset to defaults' }))
    ).click();
    await (await documentLoader.getHarness(MatButtonHarness.with({ text: 'Cancel' }))).click();
    await vi.waitFor(() =>
      expect(document.querySelector('.dataset-column-drawer-panel')).toBeNull(),
    );
    await fixture.whenStable();

    expect(saveColumns).toHaveBeenCalledOnce();
    expect(element.querySelector('th.mat-column-version')).toBeNull();

    await columnButton.click();
    await (
      await documentLoader.getHarness(MatButtonHarness.with({ text: 'Reset to defaults' }))
    ).click();
    await (await documentLoader.getHarness(MatButtonHarness.with({ text: 'Apply' }))).click();
    await vi.waitFor(() => expect(saveColumns).toHaveBeenCalledTimes(2));
    await fixture.whenStable();

    expect(element.querySelector('th.mat-column-version')).toBeTruthy();
    expect(await (await columnButton.host()).getAttribute('aria-label')).toBe(
      'Choose columns, 0 hidden',
    );
  });
});
