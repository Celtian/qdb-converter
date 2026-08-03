import { TestBed } from '@angular/core/testing';

import type { DatasetStatus, OperationStatus } from '../../../../shared/contracts';
import { StatusBadge } from './status-badge';

type StatusBadgeValue = DatasetStatus | OperationStatus;

describe('StatusBadge', () => {
  it.each<[StatusBadgeValue, string]>([
    ['available', 'Available'],
    ['completed', 'Completed'],
    ['corrupt', 'Corrupt'],
    ['failed', 'Failed'],
    ['cancelled', 'Cancelled'],
  ])('renders %s as a non-interactive badge', async (status, label) => {
    const fixture = TestBed.createComponent(StatusBadge);
    fixture.componentRef.setInput('status', status);
    await fixture.whenStable();

    const element = (fixture.nativeElement as HTMLElement).querySelector('span');
    expect(element?.textContent).toBe(label);
    expect(element?.classList.contains('inline-block')).toBe(true);
    expect(element?.getAttribute('role')).toBeNull();
    expect((fixture.nativeElement as HTMLElement).querySelector('button, mat-chip')).toBeNull();
  });
});
