import { MatPaginatorIntl } from '@angular/material/paginator';

import { uiPaginatorIntlFactory } from './ui-paginator';

describe('uiPaginatorIntlFactory', () => {
  let paginator: MatPaginatorIntl;

  beforeEach(() => {
    paginator = uiPaginatorIntlFactory();
  });

  it('formats a normal range with localized numbers', () => {
    expect(paginator.getRangeLabel(0, 100, 12_345)).toBe('1 – 100 of 12,345');
    expect(paginator.getRangeLabel(1, 100, 12_345)).toBe('101 – 200 of 12,345');
  });

  it('formats empty and zero-page-size ranges', () => {
    expect(paginator.getRangeLabel(0, 100, 0)).toBe('0 of 0');
    expect(paginator.getRangeLabel(0, 0, 12_345)).toBe('0 of 12,345');
  });

  it('clamps an out-of-range page to the last result range', () => {
    expect(paginator.getRangeLabel(20, 100, 250)).toBe('201 – 250 of 250');
  });
});
