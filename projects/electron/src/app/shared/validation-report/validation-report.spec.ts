import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import axe from 'axe-core';
import type { DatasetValidationReport } from '../../../../shared/contracts';
import { ValidationReport } from './validation-report';

const report: DatasetValidationReport = {
  validatedAt: new Date(0).toISOString(),
  tablesChecked: 1,
  rowsChecked: 3,
  errorCount: 0,
  warningCount: 3,
  errors: [],
  warnings: [
    {
      table: 'players',
      field: 'playerid',
      message: 'Value is outside the published range 0–300000.',
      occurrences: 3,
      samples: [{ row: 1, value: 300001 }],
    },
  ],
};

@Component({
  imports: [ValidationReport],
  template: `
    <app-validation-report
      mode="source"
      [report]="report"
      subject="First source"
      headingIdPrefix="first-source"
    />
    <app-validation-report
      mode="source"
      [report]="report"
      subject="Second source"
      headingIdPrefix="second-source"
    />
  `,
})
class ValidationReportHost {
  protected readonly report = report;
}

describe('ValidationReport', () => {
  it('renders reusable source reports with unique accessible headings', async () => {
    await TestBed.configureTestingModule({ imports: [ValidationReportHost] }).compileComponents();
    const fixture = TestBed.createComponent(ValidationReportHost);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Source ready to import');
    expect(element.querySelector('#first-source-warnings-heading')).toBeTruthy();
    expect(element.querySelector('#second-source-warnings-heading')).toBeTruthy();
    expect(
      element
        .querySelector('section[aria-labelledby="first-source-warnings-heading"]')
        ?.getAttribute('aria-labelledby'),
    ).toBe('first-source-warnings-heading');
    expect((await axe.run(element)).violations).toEqual([]);
  });
});
