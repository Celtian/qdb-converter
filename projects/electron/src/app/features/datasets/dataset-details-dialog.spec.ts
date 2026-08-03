import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import axe from 'axe-core';

import type { ImportedDatasetDescriptor } from '../../../../shared/contracts';
import { DatasetDetailsDialog } from './dataset-details-dialog';

const dataset: ImportedDatasetDescriptor = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Fixture',
  fifaVersion: 23,
  source: {
    kind: 't3db',
    originalPaths: ['/fixture/database.db', '/fixture/metadata.xml'],
    hashes: {},
    importedAt: new Date(0).toISOString(),
  },
  status: 'available',
  tableNames: ['players', 'teams'],
  tableCount: 2,
  rowCount: 1_234,
  warnings: ['A source value was normalized.', 'An optional table was not present.'],
};

describe('DatasetDetailsDialog', () => {
  it('presents summary details, source paths, and warnings accessibly', async () => {
    const close = vi.fn();
    await TestBed.configureTestingModule({
      imports: [DatasetDetailsDialog],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: dataset },
        { provide: MatDialogRef, useValue: { close } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(DatasetDetailsDialog);
    const loader = TestbedHarnessEnvironment.loader(fixture);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const details = [...element.querySelectorAll('mat-dialog-content > dl dt')].map((term) => ({
      label: term.textContent?.trim(),
      value: term.nextElementSibling?.textContent?.trim(),
    }));

    expect(element.querySelector('h2')?.textContent).toContain(dataset.name);
    expect(element.querySelector('mat-dialog-content > dl')?.textContent).toContain('FIFA 23');
    expect(details).toContainEqual({ label: 'Tables', value: '2' });
    expect(details).toContainEqual({ label: 'Rows', value: '1,234' });
    expect(element.querySelector('time')?.getAttribute('datetime')).toBe(dataset.source.importedAt);
    expect(
      [...element.querySelectorAll('section[aria-labelledby="dataset-source-heading"] code')].map(
        (item) => item.textContent,
      ),
    ).toEqual(dataset.source.originalPaths);
    expect(
      element.querySelector('section[aria-labelledby$="warnings-heading"] ul')?.textContent,
    ).toContain(dataset.warnings[0]);
    expect((await axe.run(element)).violations).toEqual([]);

    const renameButton = await loader.getHarness(MatButtonHarness.with({ text: 'Rename' }));
    expect(await renameButton.getAppearance()).toBe('filled');
    expect(await (await renameButton.host()).getAttribute('aria-haspopup')).toBe('dialog');
    await renameButton.click();
    expect(close).toHaveBeenLastCalledWith('rename');

    close.mockClear();
    await (await loader.getHarness(MatButtonHarness.with({ text: 'Close' }))).click();
    expect(close).toHaveBeenLastCalledWith(undefined);
  });

  it('shows the corruption error when the dataset is unavailable', async () => {
    await TestBed.configureTestingModule({
      imports: [DatasetDetailsDialog],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            ...dataset,
            status: 'corrupt',
            error: 'The managed source snapshot is missing.',
            warnings: [],
          } satisfies ImportedDatasetDescriptor,
        },
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(DatasetDetailsDialog);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector('section[aria-labelledby$="error-heading"]')?.textContent,
    ).toContain('The managed source snapshot is missing.');
    expect(element.querySelector('section[aria-labelledby$="warnings-heading"] ul')).toBeNull();
    expect(element.querySelector('button[aria-haspopup="dialog"]')?.textContent).toContain(
      'Rename',
    );
    expect((await axe.run(element)).violations).toEqual([]);
  });
});
