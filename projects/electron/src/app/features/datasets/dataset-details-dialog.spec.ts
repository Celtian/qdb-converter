import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import axe from 'axe-core';
import type { DatasetDescriptor } from '../../../../shared/contracts';
import { DatasetDetailsDialog } from './dataset-details-dialog';

const dataset: DatasetDescriptor = {
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

    expect(element.querySelector('h2')?.textContent).toContain(dataset.name);
    expect(element.querySelector('.details')?.textContent).toContain('FIFA 23');
    expect(element.querySelector('.details')?.textContent).toContain('1,234 rows');
    expect(element.querySelector('time')?.getAttribute('datetime')).toBe(dataset.source.importedAt);
    expect(
      [...element.querySelectorAll('.path-list code')].map((item) => item.textContent),
    ).toEqual(dataset.source.originalPaths);
    expect(element.querySelector('.warning-list')?.textContent).toContain(dataset.warnings[0]);
    expect((await axe.run(element)).violations).toEqual([]);

    await (await loader.getHarness(MatButtonHarness.with({ text: 'Close' }))).click();
    expect(close).toHaveBeenCalled();
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
          } satisfies DatasetDescriptor,
        },
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(DatasetDetailsDialog);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.notice--error')?.textContent).toContain(
      'The managed source snapshot is missing.',
    );
    expect(element.querySelector('.warning-list')).toBeNull();
    expect((await axe.run(element)).violations).toEqual([]);
  });
});
