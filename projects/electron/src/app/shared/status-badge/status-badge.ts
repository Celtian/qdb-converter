import { Component, computed, input } from '@angular/core';

import type { DatasetStatus, OperationStatus } from '../../../../shared/contracts';

type StatusBadgeValue = DatasetStatus | OperationStatus;

interface StatusBadgeDetails {
  label: string;
  tone: 'success' | 'error' | 'neutral';
}

const statusBadgeDetails: Record<StatusBadgeValue, StatusBadgeDetails> = {
  available: {
    label: 'Available',
    tone: 'success',
  },
  completed: {
    label: 'Completed',
    tone: 'success',
  },
  corrupt: {
    label: 'Corrupt',
    tone: 'error',
  },
  failed: {
    label: 'Failed',
    tone: 'error',
  },
  cancelled: {
    label: 'Cancelled',
    tone: 'neutral',
  },
};

@Component({
  selector: 'app-status-badge',
  template: `
    <span
      class="inline-block rounded-full px-chip text-xs leading-6 font-bold whitespace-nowrap"
      [class.bg-tertiary-container]="details().tone === 'success'"
      [class.text-on-tertiary-container]="details().tone === 'success'"
      [class.bg-error-container]="details().tone === 'error'"
      [class.text-on-error-container]="details().tone === 'error'"
      [class.bg-secondary-container]="details().tone === 'neutral'"
      [class.text-on-secondary-container]="details().tone === 'neutral'"
      >{{ details().label }}</span
    >
  `,
  styleUrl: './status-badge.css',
})
export class StatusBadge {
  readonly status = input.required<StatusBadgeValue>();
  protected readonly details = computed(() => statusBadgeDetails[this.status()]);
}
