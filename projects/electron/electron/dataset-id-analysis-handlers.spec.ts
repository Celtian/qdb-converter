import { describe, expect, it } from 'vitest';

import { validateDatasetIdAnalysisRequest } from './dataset-id-analysis-handlers';

describe('dataset ID analysis IPC validation', () => {
  it('accepts imported and converted requests with UUID identifiers', () => {
    expect(() =>
      validateDatasetIdAnalysisRequest({
        requestId: '22222222-2222-4222-8222-222222222222',
        datasetKind: 'imported',
        datasetId: '11111111-1111-4111-8111-111111111111',
      }),
    ).not.toThrow();
    expect(() =>
      validateDatasetIdAnalysisRequest({
        requestId: '22222222-2222-4222-8222-222222222222',
        datasetKind: 'converted',
        datasetId: '33333333-3333-4333-8333-333333333333',
      }),
    ).not.toThrow();
  });

  it('rejects malformed identifiers and dataset kinds before starting a worker', () => {
    expect(() =>
      validateDatasetIdAnalysisRequest({
        requestId: 'invalid',
        datasetKind: 'imported',
        datasetId: '11111111-1111-4111-8111-111111111111',
      }),
    ).toThrow(/identifier/);
    expect(() =>
      validateDatasetIdAnalysisRequest({
        requestId: '22222222-2222-4222-8222-222222222222',
        datasetKind: 'unknown' as 'imported',
        datasetId: '11111111-1111-4111-8111-111111111111',
      }),
    ).toThrow(/dataset type/);
  });
});
