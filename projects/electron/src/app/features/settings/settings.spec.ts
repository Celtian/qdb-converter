import type { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';
import { MatDialogHarness } from '@angular/material/dialog/testing';
import { MatTabGroupHarness } from '@angular/material/tabs/testing';

import axe from 'axe-core';

import type {
  ConvertedDatasetDescriptor,
  ImportedDatasetDescriptor,
  QdbConverterApi,
} from '../../../../shared/contracts';
import { AppStore } from '../../core/app-store';
import {
  DatasetColumnPreferences,
  datasetColumnPreferenceKey,
} from '../../core/dataset-column-preferences';
import { Settings } from './settings';

const normalizedLabel = async (checkbox: MatCheckboxHarness): Promise<string> =>
  (await checkbox.getLabelText()).replace(/\s+/g, ' ').trim();

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
  rowCount: 2,
  warnings: [],
};

const convertedDataset: ConvertedDatasetDescriptor = {
  id: '33333333-3333-4333-8333-333333333333',
  name: 'Fixture — FIFA 22',
  sourceDatasetId: dataset.id,
  sourceDatasetName: dataset.name,
  sourceVersion: 23,
  fifaVersion: 22,
  createdAt: new Date(1).toISOString(),
  status: 'available',
  tableNames: ['players'],
  tableCount: 1,
  rowCount: 2,
  tableSummaries: [],
  warnings: [],
};

describe('Settings', () => {
  let component: Settings;
  let fixture: ComponentFixture<Settings>;
  let loader: HarnessLoader;
  let documentLoader: HarnessLoader;
  let managedImportedDatasets: ImportedDatasetDescriptor[];
  let managedConvertedDatasets: ConvertedDatasetDescriptor[];

  beforeEach(async () => {
    localStorage.removeItem(datasetColumnPreferenceKey('imported'));
    localStorage.removeItem(datasetColumnPreferenceKey('converted'));
    managedImportedDatasets = [dataset, { ...dataset, id: '44444444-4444-4444-8444-444444444444' }];
    managedConvertedDatasets = [convertedDataset];
    window.qdbConverter = {
      listImportedDatasets: vi.fn(async () => managedImportedDatasets),
      listConvertedDatasets: vi.fn(async () => managedConvertedDatasets),
      removeAllDatasets: vi.fn(async (kinds) => {
        const result = {
          imported: kinds.includes('imported') ? managedImportedDatasets.length : 0,
          converted: kinds.includes('converted') ? managedConvertedDatasets.length : 0,
        };
        if (kinds.includes('imported')) managedImportedDatasets = [];
        if (kinds.includes('converted')) managedConvertedDatasets = [];
        return result;
      }),
      onImportProgress: vi.fn(() => () => undefined),
      onConversionProgress: vi.fn(() => () => undefined),
    } as unknown as QdbConverterApi;
    await TestBed.configureTestingModule({
      imports: [Settings],
    }).compileComponents();

    fixture = TestBed.createComponent(Settings);
    component = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
    documentLoader = TestbedHarnessEnvironment.documentRootLoader(fixture);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('changes the application theme', () => {
    const settings = component as unknown as { setTheme(value: 'dark'): void };
    settings.setTheme('dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });

  it('edits and resets independent default layouts for both dataset tables', async () => {
    const element = fixture.nativeElement as HTMLElement;
    const tabGroup = await loader.getHarness(
      MatTabGroupHarness.with({ selector: 'mat-tab-group' }),
    );
    const tabs = await tabGroup.getTabs();
    const [importedTab, convertedTab] = tabs;

    expect(element.textContent).toContain('Dataset column layouts');
    expect(await Promise.all(tabs.map((tab) => tab.getLabel()))).toEqual(['Imported', 'Converted']);
    expect(await importedTab.isSelected()).toBe(true);

    const version = await importedTab.getHarness(MatCheckboxHarness.with({ label: 'Version' }));
    const importedName = await importedTab.getHarness(MatCheckboxHarness.with({ label: 'Name' }));
    const importedActions = await importedTab.getHarness(
      MatCheckboxHarness.with({ label: 'Actions' }),
    );
    expect(await importedName.isDisabled()).toBe(true);
    expect(await importedActions.isDisabled()).toBe(true);

    await version.uncheck();
    await fixture.whenStable();

    expect(TestBed.inject(DatasetColumnPreferences).load('imported').visible).not.toContain(
      'version',
    );

    await convertedTab.select();
    await fixture.whenStable();
    const target = await convertedTab.getHarness(MatCheckboxHarness.with({ label: 'Target' }));
    const convertedName = await convertedTab.getHarness(MatCheckboxHarness.with({ label: 'Name' }));
    const convertedActions = await convertedTab.getHarness(
      MatCheckboxHarness.with({ label: 'Actions' }),
    );
    expect(await convertedName.isDisabled()).toBe(true);
    expect(await convertedActions.isDisabled()).toBe(true);

    await target.uncheck();
    await fixture.whenStable();

    expect(TestBed.inject(DatasetColumnPreferences).load('converted').visible).not.toContain(
      'target',
    );

    await importedTab.select();
    await fixture.whenStable();
    await (
      await importedTab.getHarness(MatButtonHarness.with({ text: 'Reset imported columns' }))
    ).click();
    await fixture.whenStable();

    expect(localStorage.getItem(datasetColumnPreferenceKey('imported'))).toBeNull();
    expect(localStorage.getItem(datasetColumnPreferenceKey('converted'))).not.toBeNull();
    expect(await version.isChecked()).toBe(true);
    expect(await target.isChecked()).toBe(false);
    expect((await axe.run(element)).violations).toEqual([]);
  });

  it('shows unchecked cleanup categories with live counts and accessible guidance', async () => {
    await TestBed.inject(AppStore).refresh();
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    const imported = await loader.getHarness(
      MatCheckboxHarness.with({ selector: 'fieldset mat-checkbox:nth-of-type(1)' }),
    );
    const converted = await loader.getHarness(
      MatCheckboxHarness.with({ selector: 'fieldset mat-checkbox:nth-of-type(2)' }),
    );
    const button = await loader.getHarness(
      MatButtonHarness.with({ selector: 'fieldset + div button' }),
    );
    const storageCard = [...element.querySelectorAll('mat-card')].find((card) =>
      card.textContent?.includes('Dataset storage'),
    );

    expect(element.textContent).toContain('Dataset storage');
    expect(element.textContent).toContain(
      'Original source files and exported folders will not be deleted.',
    );
    expect(await normalizedLabel(imported)).toContain('Imported datasets (2)');
    expect(await normalizedLabel(converted)).toContain('Converted datasets (1)');
    expect(await imported.isChecked()).toBe(false);
    expect(await converted.isChecked()).toBe(false);
    expect(await imported.isDisabled()).toBe(false);
    expect(await converted.isDisabled()).toBe(false);
    expect(await button.isDisabled()).toBe(true);
    expect(storageCard?.querySelector('mat-icon[mat-card-avatar]')?.textContent).toContain(
      'storage',
    );
    expect((await axe.run(element)).violations).toEqual([]);
  });

  it('keeps empty cleanup categories visible and disabled', async () => {
    managedImportedDatasets = [];
    managedConvertedDatasets = [];
    await TestBed.inject(AppStore).refresh();
    await fixture.whenStable();

    const imported = await loader.getHarness(
      MatCheckboxHarness.with({ selector: 'fieldset mat-checkbox:nth-of-type(1)' }),
    );
    const converted = await loader.getHarness(
      MatCheckboxHarness.with({ selector: 'fieldset mat-checkbox:nth-of-type(2)' }),
    );
    const button = await loader.getHarness(
      MatButtonHarness.with({ selector: 'fieldset + div button' }),
    );

    expect(await normalizedLabel(imported)).toContain('Imported datasets (0)');
    expect(await normalizedLabel(converted)).toContain('Converted datasets (0)');
    expect(await imported.isDisabled()).toBe(true);
    expect(await converted.isDisabled()).toBe(true);
    expect(await button.isDisabled()).toBe(true);
  });

  it('confirms imported cleanup and preserves the selection when cancelled', async () => {
    await TestBed.inject(AppStore).refresh();
    await fixture.whenStable();
    const imported = await loader.getHarness(
      MatCheckboxHarness.with({ selector: 'fieldset mat-checkbox:nth-of-type(1)' }),
    );
    await imported.check();
    await (
      await loader.getHarness(MatButtonHarness.with({ selector: 'fieldset + div button' }))
    ).click();

    const dialog = await documentLoader.getHarness(MatDialogHarness);
    expect(await dialog.getRole()).toBe('alertdialog');
    expect(await dialog.getTitleText()).toBe('Delete all imported datasets?');
    expect(await dialog.getText()).toContain('all 2 managed imported datasets');
    expect(await dialog.getText()).toContain(
      'Converted datasets, original source files, and exported folders will not be deleted.',
    );
    await (await dialog.getHarness(MatButtonHarness.with({ text: 'Cancel' }))).click();

    expect(window.qdbConverter!.removeAllDatasets).not.toHaveBeenCalled();
    expect(await imported.isChecked()).toBe(true);
  });

  it('deletes only converted datasets and preserves imported datasets', async () => {
    await TestBed.inject(AppStore).refresh();
    await fixture.whenStable();
    const converted = await loader.getHarness(
      MatCheckboxHarness.with({ selector: 'fieldset mat-checkbox:nth-of-type(2)' }),
    );
    await converted.check();
    const button = await loader.getHarness(
      MatButtonHarness.with({ selector: 'fieldset + div button' }),
    );
    await button.click();
    const dialog = await documentLoader.getHarness(MatDialogHarness);
    expect(await dialog.getTitleText()).toBe('Delete all converted datasets?');
    expect(await dialog.getText()).toContain('all 1 managed converted dataset');
    expect(await dialog.getText()).toContain(
      'Imported datasets, original source files, and exported folders will not be deleted.',
    );
    await (
      await dialog.getHarness(MatButtonHarness.with({ text: 'Delete all converted datasets' }))
    ).click();

    await vi.waitFor(() =>
      expect(window.qdbConverter!.removeAllDatasets).toHaveBeenCalledWith(['converted']),
    );
    await fixture.whenStable();

    const imported = await loader.getHarness(
      MatCheckboxHarness.with({ selector: 'fieldset mat-checkbox:nth-of-type(1)' }),
    );
    expect(await normalizedLabel(imported)).toContain('Imported datasets (2)');
    expect(await imported.isDisabled()).toBe(false);
    expect(await normalizedLabel(converted)).toContain('Converted datasets (0)');
    expect(await converted.isChecked()).toBe(false);
    expect(await converted.isDisabled()).toBe(true);
    expect(await button.isDisabled()).toBe(true);
  });

  it('deletes both selected categories through one bridge call and clears the selection', async () => {
    await TestBed.inject(AppStore).refresh();
    await fixture.whenStable();
    const imported = await loader.getHarness(
      MatCheckboxHarness.with({ selector: 'fieldset mat-checkbox:nth-of-type(1)' }),
    );
    const converted = await loader.getHarness(
      MatCheckboxHarness.with({ selector: 'fieldset mat-checkbox:nth-of-type(2)' }),
    );
    await imported.check();
    await converted.check();
    const button = await loader.getHarness(
      MatButtonHarness.with({ selector: 'fieldset + div button' }),
    );
    await button.click();

    const dialog = await documentLoader.getHarness(MatDialogHarness);
    expect(await dialog.getTitleText()).toBe('Delete all selected datasets?');
    expect(await dialog.getText()).toContain('all 2 imported datasets and 1 converted dataset');
    expect(await dialog.getText()).toContain(
      'Original source files and exported folders will not be deleted.',
    );
    await (
      await dialog.getHarness(MatButtonHarness.with({ text: 'Delete selected datasets' }))
    ).click();

    await vi.waitFor(() =>
      expect(window.qdbConverter!.removeAllDatasets).toHaveBeenCalledWith([
        'imported',
        'converted',
      ]),
    );
    await fixture.whenStable();

    expect(await normalizedLabel(imported)).toContain('Imported datasets (0)');
    expect(await normalizedLabel(converted)).toContain('Converted datasets (0)');
    expect(await imported.isChecked()).toBe(false);
    expect(await converted.isChecked()).toBe(false);
    expect(await button.isDisabled()).toBe(true);
  });

  it('disables cleanup controls while pending and retains selection after failure', async () => {
    await TestBed.inject(AppStore).refresh();
    await fixture.whenStable();
    let rejectDeletion!: (error: Error) => void;
    vi.mocked(window.qdbConverter!.removeAllDatasets).mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          rejectDeletion = reject;
        }),
    );
    const imported = await loader.getHarness(
      MatCheckboxHarness.with({ selector: 'fieldset mat-checkbox:nth-of-type(1)' }),
    );
    const converted = await loader.getHarness(
      MatCheckboxHarness.with({ selector: 'fieldset mat-checkbox:nth-of-type(2)' }),
    );
    await imported.check();
    await converted.check();
    const button = await loader.getHarness(
      MatButtonHarness.with({ selector: 'fieldset + div button' }),
    );
    await button.click();
    const dialog = await documentLoader.getHarness(MatDialogHarness);
    await (
      await dialog.getHarness(MatButtonHarness.with({ text: 'Delete selected datasets' }))
    ).click();
    await vi.waitFor(() => expect(window.qdbConverter!.removeAllDatasets).toHaveBeenCalledOnce());

    expect(await imported.isDisabled()).toBe(true);
    expect(await converted.isDisabled()).toBe(true);
    expect(await button.isDisabled()).toBe(true);

    rejectDeletion(new Error('Managed datasets could not be deleted.'));
    await vi.waitFor(() =>
      expect(
        (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')?.textContent,
      ).toContain('Managed datasets could not be deleted.'),
    );
    await fixture.whenStable();

    expect(await imported.isChecked()).toBe(true);
    expect(await converted.isChecked()).toBe(true);
    expect(await imported.isDisabled()).toBe(false);
    expect(await converted.isDisabled()).toBe(false);
    expect(await button.isDisabled()).toBe(false);
  });
});
