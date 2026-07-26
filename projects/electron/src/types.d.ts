import type { QdbConverterApi } from '../shared/contracts';

declare global {
  interface Window {
    qdbConverter?: QdbConverterApi;
  }
}

export {};
