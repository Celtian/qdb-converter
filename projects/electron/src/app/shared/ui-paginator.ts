import { MatPaginatorIntl } from '@angular/material/paginator';

const numberFormatter = new Intl.NumberFormat('en-US');

const formatNumber = (value: number): string => numberFormatter.format(value);

export function uiPaginatorIntlFactory(): MatPaginatorIntl {
  const paginator = new MatPaginatorIntl();
  paginator.getRangeLabel = (page: number, pageSize: number, length: number): string => {
    const normalizedLength = Math.max(length, 0);
    if (normalizedLength === 0 || pageSize <= 0) {
      return `0 of ${formatNumber(normalizedLength)}`;
    }

    const lastPageStart = Math.max(0, Math.ceil(normalizedLength / pageSize) - 1) * pageSize;
    const startIndex = Math.min(Math.max(0, page) * pageSize, lastPageStart);
    const endIndex = Math.min(startIndex + pageSize, normalizedLength);
    return `${formatNumber(startIndex + 1)} – ${formatNumber(endIndex)} of ${formatNumber(
      normalizedLength,
    )}`;
  };
  return paginator;
}
