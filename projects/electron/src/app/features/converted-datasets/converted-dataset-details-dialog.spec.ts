import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import axe from 'axe-core';

import type { ConvertedDatasetDescriptor } from '../../../../shared/contracts';
import { ConvertedDatasetDetailsDialog } from './converted-dataset-details-dialog';

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
  rowCount: 1_235,
  tableSummaries: [
    {
      table: 'players',
      rows: 1_234,
      defaultSubstitutions: 2,
      ratingDifferences: 3,
      warnings: ['A player value used its target-version default.'],
    },
    {
      table: 'teams',
      rows: 1,
      defaultSubstitutions: 0,
      ratingDifferences: 0,
      warnings: [],
    },
  ],
  warnings: ['One source field was not available in the target version.'],
};

describe('ConvertedDatasetDetailsDialog', () => {
  it('presents conversion metadata, table statistics, and warnings accessibly', async () => {
    const close = vi.fn();
    await TestBed.configureTestingModule({
      imports: [ConvertedDatasetDetailsDialog],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: dataset },
        { provide: MatDialogRef, useValue: { close } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ConvertedDatasetDetailsDialog);
    const loader = TestbedHarnessEnvironment.loader(fixture);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const details = [...element.querySelectorAll('.details dt')].map((term) => ({
      label: term.textContent?.trim(),
      value: term.nextElementSibling?.textContent?.trim(),
    }));
    const tableSummaries = element.querySelectorAll('.table-summary-list > li');

    expect(element.querySelector('h2')?.textContent).toContain(dataset.name);
    expect(details).toContainEqual({ label: 'Source dataset', value: 'Fixture' });
    expect(details).toContainEqual({ label: 'Source version', value: 'FIFA 23' });
    expect(details).toContainEqual({ label: 'Target version', value: 'FIFA 22' });
    expect(details).toContainEqual({ label: 'Tables', value: '2' });
    expect(details).toContainEqual({ label: 'Rows', value: '1,235' });
    expect(element.querySelector('time')?.getAttribute('datetime')).toBe(dataset.createdAt);
    expect(tableSummaries).toHaveLength(2);
    expect(tableSummaries[0]?.textContent).toContain('players');
    expect(tableSummaries[0]?.textContent).toContain('1,234');
    expect(tableSummaries[0]?.textContent).toContain('Default substitutions');
    expect(tableSummaries[0]?.textContent).toContain('2');
    expect(tableSummaries[0]?.textContent).toContain('Rating differences');
    expect(tableSummaries[0]?.textContent).toContain('3');
    expect(tableSummaries[0]?.textContent).toContain(dataset.tableSummaries[0]!.warnings[0]);
    expect(element.querySelector('#converted-dataset-warnings-heading')?.textContent).toContain(
      'Conversion warning (1)',
    );
    expect(element.textContent).toContain(dataset.warnings[0]);
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

  it('shows an error and table-name fallback for older converted datasets', async () => {
    await TestBed.configureTestingModule({
      imports: [ConvertedDatasetDetailsDialog],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            ...dataset,
            status: 'corrupt',
            error: 'The managed converted snapshot is missing.',
            tableSummaries: [],
            warnings: [],
          } satisfies ConvertedDatasetDescriptor,
        },
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ConvertedDatasetDetailsDialog);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.notice--error')?.textContent).toContain(
      'The managed converted snapshot is missing.',
    );
    expect(element.querySelector('.fallback-message')?.textContent).toContain(
      'Detailed conversion statistics were not recorded',
    );
    expect(
      [...element.querySelectorAll('.table-name-list code')].map((item) => item.textContent),
    ).toEqual(dataset.tableNames);
    expect(element.querySelector('.table-summary-list')).toBeNull();
    expect(element.querySelector('button[aria-haspopup="dialog"]')?.textContent).toContain(
      'Rename',
    );
    expect((await axe.run(element)).violations).toEqual([]);
  });

  it('explains when no table details are available', async () => {
    await TestBed.configureTestingModule({
      imports: [ConvertedDatasetDetailsDialog],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            ...dataset,
            tableNames: [],
            tableCount: 0,
            rowCount: 0,
            tableSummaries: [],
            warnings: [],
          } satisfies ConvertedDatasetDescriptor,
        },
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ConvertedDatasetDetailsDialog);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.fallback-message')?.textContent).toContain(
      'No table details were recorded for this dataset.',
    );
    expect(element.querySelector('.table-name-list')).toBeNull();
    expect((await axe.run(element)).violations).toEqual([]);
  });
});
