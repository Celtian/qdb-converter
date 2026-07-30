import { access } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

import { FLAGS } from '../../projects/electron/src/app/shared/country-flag/country-flags.generated';

describe('generated flag assets', () => {
  it.each([
    [20, 15],
    [40, 30],
    [60, 45],
  ])('generates %i×%i PNGs with exact dimensions', async (width, height) => {
    const image = sharp(
      resolve(
        process.cwd(),
        'projects',
        'electron',
        'public',
        'flags',
        `${width}x${height}`,
        'cz.png',
      ),
    );

    await expect(image.metadata()).resolves.toMatchObject({ width, height, format: 'png' });
  });

  it.each(['au', 'ca', 'de', 'es', 'it', 'us'])('keeps national flag %s', (code) => {
    expect(Object.hasOwn(FLAGS, code)).toBe(true);
  });

  it.each(['us-ca', 'ca-on', 'au-nsw', 'de-be', 'es-ct', 'it-62'])(
    'excludes blacklisted subdivision %s',
    async (code) => {
      await expect(
        access(
          resolve(process.cwd(), 'projects', 'electron', 'public', 'flags', '40x30', `${code}.png`),
        ),
      ).rejects.toThrow();
      expect(Object.hasOwn(FLAGS, code)).toBe(false);
    },
  );
});
