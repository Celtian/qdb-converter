import { TestKey } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';

import axe from 'axe-core';

import { DatasetColumnEditor } from './dataset-column-editor';
import {
  type DatasetColumnPreference,
  columnsByDatasetTable,
  defaultDatasetColumnPreference,
} from './dataset-table-columns';

describe('DatasetColumnEditor', () => {
  const createEditor = async (preference = defaultDatasetColumnPreference('imported')) => {
    await TestBed.configureTestingModule({
      imports: [DatasetColumnEditor],
    }).compileComponents();
    const fixture = TestBed.createComponent(DatasetColumnEditor);
    fixture.componentRef.setInput('table', 'imported');
    fixture.componentRef.setInput('columns', columnsByDatasetTable.imported);
    fixture.componentRef.setInput('defaultPreference', defaultDatasetColumnPreference('imported'));
    fixture.componentRef.setInput('preference', preference);
    await fixture.whenStable();
    return {
      fixture,
      loader: TestbedHarnessEnvironment.loader(fixture),
    };
  };

  it('uses Records for converted datasets while imported datasets retain Rows', () => {
    expect(columnsByDatasetTable.imported.find(({ key }) => key === 'rows')?.label).toBe('Rows');
    expect(columnsByDatasetTable.converted.find(({ key }) => key === 'rows')?.label).toBe(
      'Records',
    );
  });

  it('keeps required columns enabled and changes optional visibility accessibly', async () => {
    const { fixture, loader } = await createEditor();
    const name = await loader.getHarness(MatCheckboxHarness.with({ label: 'Name' }));
    const actions = await loader.getHarness(MatCheckboxHarness.with({ label: 'Actions' }));
    const version = await loader.getHarness(MatCheckboxHarness.with({ label: 'Version' }));

    expect(await name.isChecked()).toBe(true);
    expect(await name.isDisabled()).toBe(true);
    expect(await actions.isChecked()).toBe(true);
    expect(await actions.isDisabled()).toBe(true);

    await version.uncheck();
    await fixture.whenStable();

    expect(fixture.componentInstance.preference().visible).not.toContain('version');
    expect((await axe.run(fixture.nativeElement as HTMLElement)).violations).toEqual([]);
  });

  it('supports keyboard ordering with a live announcement', async () => {
    const { fixture, loader } = await createEditor();
    const nameHandle = await loader.getHarness(
      MatButtonHarness.with({ selector: 'button[aria-label="Reorder Name column"]' }),
    );

    await (await nameHandle.host()).sendKeys(TestKey.DOWN_ARROW);
    await fixture.whenStable();

    const preference = fixture.componentInstance.preference();
    expect(preference.order.slice(0, 2)).toEqual(['version', 'name']);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Name moved to position 2 of 8.',
    );
  });

  it('restores the built-in layout', async () => {
    const custom: DatasetColumnPreference = {
      version: 1,
      order: ['actions', 'name', 'version', 'source', 'tables', 'rows', 'imported', 'status'],
      visible: ['actions', 'name'],
    };
    const { fixture } = await createEditor(custom);

    fixture.componentInstance.resetToDefaults();
    await fixture.whenStable();

    expect(fixture.componentInstance.preference()).toEqual(
      defaultDatasetColumnPreference('imported'),
    );
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Default column order and visibility restored.',
    );
  });
});
