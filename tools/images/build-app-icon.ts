import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const APP_ICON_SIZE = 256;
const CORNER_RADIUS_RATIO = 52 / APP_ICON_SIZE;
const FAVICON_SIZES = [16, 32, 48] as const;

interface IconImage {
  readonly data: Buffer;
  readonly size: number;
}

const renderPng = async (source: Buffer, size: number): Promise<Buffer> => {
  const cornerRadius = size * CORNER_RADIUS_RATIO;
  const mask = Buffer.from(
    `<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${cornerRadius}" fill="#fff"/></svg>`,
  );

  return sharp(source)
    .resize(size, size)
    .composite([{ input: mask, blend: 'dest-in' }])
    .png({ adaptiveFiltering: true, compressionLevel: 9 })
    .toBuffer();
};

const createIco = (images: readonly IconImage[]): Buffer => {
  const headerSize = 6;
  const entrySize = 16;
  const imageOffset = headerSize + entrySize * images.length;
  const header = Buffer.alloc(imageOffset);

  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  let offset = imageOffset;
  images.forEach(({ data, size }, index) => {
    const entryOffset = headerSize + index * entrySize;
    header.writeUInt8(size === 256 ? 0 : size, entryOffset);
    header.writeUInt8(size === 256 ? 0 : size, entryOffset + 1);
    header.writeUInt8(0, entryOffset + 2);
    header.writeUInt8(0, entryOffset + 3);
    header.writeUInt16LE(1, entryOffset + 4);
    header.writeUInt16LE(32, entryOffset + 6);
    header.writeUInt32LE(data.length, entryOffset + 8);
    header.writeUInt32LE(offset, entryOffset + 12);
    offset += data.length;
  });

  return Buffer.concat([header, ...images.map(({ data }) => data)]);
};

const validatePng = async (data: Buffer, size: number): Promise<void> => {
  const metadata = await sharp(data).metadata();
  if (
    metadata.format !== 'png' ||
    metadata.width !== size ||
    metadata.height !== size ||
    !metadata.hasAlpha
  ) {
    throw new Error(`Expected a ${size}x${size} PNG with transparency.`);
  }
};

const validateIco = (data: Buffer, sizes: readonly number[]): void => {
  if (data.readUInt16LE(0) !== 0 || data.readUInt16LE(2) !== 1) {
    throw new Error('Generated file is not a Windows icon.');
  }
  if (data.readUInt16LE(4) !== sizes.length) {
    throw new Error('Generated icon has an unexpected image count.');
  }

  sizes.forEach((size, index) => {
    const entryOffset = 6 + index * 16;
    const width = data.readUInt8(entryOffset) || 256;
    const height = data.readUInt8(entryOffset + 1) || 256;
    if (width !== size || height !== size) {
      throw new Error(`Generated icon is missing its ${size}x${size} image.`);
    }
  });
};

const writeOutput = async (path: string, data: Buffer): Promise<void> => {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, data);
};

const buildAppIcon = async (): Promise<void> => {
  const root = process.cwd();
  const sourcePath = join(root, 'resources', 'icons', 'qdb-converter-source.png');
  const source = await readFile(sourcePath);
  const appPng = await renderPng(source, APP_ICON_SIZE);
  const faviconImages = await Promise.all(
    FAVICON_SIZES.map(async (size) => ({ data: await renderPng(source, size), size })),
  );
  const appIco = createIco([{ data: appPng, size: APP_ICON_SIZE }]);
  const favicon = createIco(faviconImages);

  await Promise.all([
    validatePng(appPng, APP_ICON_SIZE),
    ...faviconImages.map(({ data, size }) => validatePng(data, size)),
  ]);
  validateIco(appIco, [APP_ICON_SIZE]);
  validateIco(favicon, FAVICON_SIZES);

  await Promise.all([
    writeOutput(join(root, 'resources', 'icons', 'qdb-converter.png'), appPng),
    writeOutput(join(root, 'resources', 'icons', 'qdb-converter.ico'), appIco),
    writeOutput(join(root, 'projects', 'electron', 'public', 'qdb-converter-icon.png'), appPng),
    writeOutput(join(root, 'projects', 'electron', 'public', 'favicon.ico'), favicon),
  ]);
};

void buildAppIcon()
  .then(() =>
    console.log(
      `Generated ${APP_ICON_SIZE}px application icons and ${FAVICON_SIZES.join('/')}px favicons.`,
    ),
  )
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
