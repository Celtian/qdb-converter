import { Component, computed, input } from '@angular/core';

import type { DatasetStatus, OperationStatus } from '../../../../shared/contracts';

type StatusBadgeValue = DatasetStatus | OperationStatus;

interface StatusBadgeDetails {
  className: string;
  label: string;
}

const statusBadgeDetails: Record<StatusBadgeValue, StatusBadgeDetails> = {
  available: {
    className: 'status-badge status-badge--success',
    label: 'Available',
  },
  completed: {
    className: 'status-badge status-badge--success',
    label: 'Completed',
  },
  corrupt: {
    className: 'status-badge status-badge--error',
    label: 'Corrupt',
  },
  failed: {
    className: 'status-badge status-badge--error',
    label: 'Failed',
  },
  cancelled: {
    className: 'status-badge status-badge--neutral',
    label: 'Cancelled',
  },
};

@Component({
  selector: 'app-status-badge',
  template: `<span [class]="details().className">{{ details().label }}</span>`,
  styleUrl: './status-badge.css',
})
export class StatusBadge {
  readonly status = input.required<StatusBadgeValue>();
  protected readonly details = computed(() => statusBadgeDetails[this.status()]);
}
