import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['projects/electron/{electron,shared}/**/*.spec.ts', 'tools/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'cobertura'],
      include: ['projects/electron/{electron,shared}/**/*.ts'],
      exclude: ['**/*.spec.ts', '**/main/index.ts', '**/preload.ts', '**/*-worker.ts'],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});
