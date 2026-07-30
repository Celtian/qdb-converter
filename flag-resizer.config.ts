import { defineConfig } from 'flag-resizer';

export default defineConfig({
  electron: {
    filter: {
      type: 'blacklist',
      values: ['us-*', 'ca-*', 'au-*', 'de-*', 'es-*', 'it-*'],
    },
    sizes: [
      [20, 15],
      [40, 30],
      [60, 45],
    ],
    quality: 100,
    formats: ['png'],
    output: {
      png: {
        dir: 'projects/electron/public/flags',
        publicPath: 'flags',
      },
      ts: 'projects/electron/src/app/shared/country-flag/country-flags.generated.ts',
    },
  },
});
