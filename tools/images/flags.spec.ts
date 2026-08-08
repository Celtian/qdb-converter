import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { FLAGS } from '../../projects/electron/src/app/shared/country-flag/country-flags.generated';

describe('generated flag assets', () => {
  it.each([
    [20, 15],
    [40, 30],
    [60, 45],
  ])('generates %i×%i PNGs with exact dimensions', async (width, height) => {
    const image = await readFile(
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

    expect(image.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    expect(image.toString('ascii', 12, 16)).toBe('IHDR');
    expect(image.readUInt32BE(16)).toBe(width);
    expect(image.readUInt32BE(20)).toBe(height);
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
