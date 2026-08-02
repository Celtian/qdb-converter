import { TestBed } from '@angular/core/testing';

import type { DatasetStatus, OperationStatus } from '../../../../shared/contracts';
import { StatusBadge } from './status-badge';

type StatusBadgeValue = DatasetStatus | OperationStatus;

describe('StatusBadge', () => {
  it.each<[StatusBadgeValue, string, string]>([
    ['available', 'Available', 'status-badge--success'],
    ['completed', 'Completed', 'status-badge--success'],
    ['corrupt', 'Corrupt', 'status-badge--error'],
    ['failed', 'Failed', 'status-badge--error'],
    ['cancelled', 'Cancelled', 'status-badge--neutral'],
  ])('renders %s as a non-interactive badge', async (status, label, className) => {
    const fixture = TestBed.createComponent(StatusBadge);
    fixture.componentRef.setInput('status', status);
    await fixture.whenStable();

    const element = (fixture.nativeElement as HTMLElement).querySelector('span');
    expect(element?.textContent).toBe(label);
    expect(element?.classList.contains(className)).toBe(true);
    expect(element?.getAttribute('role')).toBeNull();
    expect((fixture.nativeElement as HTMLElement).querySelector('button, mat-chip')).toBeNull();
  });
});
