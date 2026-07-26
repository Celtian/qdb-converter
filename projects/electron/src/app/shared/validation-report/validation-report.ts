import { DecimalPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import type { DatasetValidationIssue, DatasetValidationReport } from '../../../../shared/contracts';

@Component({
  selector: 'app-validation-report',
  imports: [DecimalPipe, MatIconModule],
  templateUrl: './validation-report.html',
  styleUrl: './validation-report.css',
})
export class ValidationReport {
  readonly report = input.required<DatasetValidationReport>();
  readonly mode = input<'dataset' | 'source'>('dataset');
  readonly subject = input.required<string>();
  readonly headingIdPrefix = input.required<string>();
  protected readonly summaryTitle = computed(() => {
    const report = this.report();
    if (report.errorCount) return 'Blocking validation errors found';
    if (this.mode() === 'source') return 'Source ready to import';
    return report.warningCount ? 'Dataset is ready to use' : 'All validations passed';
  });
  protected readonly summaryIcon = computed(() =>
    this.report().errorCount ? 'error' : 'verified',
  );
  protected readonly errorsHeadingId = computed(() => `${this.headingIdPrefix()}-errors-heading`);
  protected readonly warningsHeadingId = computed(
    () => `${this.headingIdPrefix()}-warnings-heading`,
  );

  protected issueLabel(issue: DatasetValidationIssue): string {
    if (issue.field) return `${issue.table}.txt · ${issue.field}`;
    return issue.table === 'Dataset' || issue.table === 'Source'
      ? issue.table
      : `${issue.table}.txt`;
  }
}
