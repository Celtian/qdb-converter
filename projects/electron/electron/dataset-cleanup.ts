import type { DatasetKind } from '../shared/contracts';

const isDatasetKind = (value: unknown): value is DatasetKind =>
  value === 'imported' || value === 'converted';

export const parseDatasetKinds = (value: unknown): DatasetKind[] => {
  if (
    !Array.isArray(value) ||
    value.length < 1 ||
    value.length > 2 ||
    !value.every(isDatasetKind) ||
    new Set(value).size !== value.length
  )
    throw new Error('Invalid dataset categories.');

  return value;
};
