import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { encodeFifaText, parseTextTable } from '../shared/text-format';
import { createConvertedDatasetSnapshot } from './conversion-engine';
import type { ImportedDatasetRecord } from './dataset-library';

describe('conversion engine', () => {
  it('converts every compatible source table into target-ordered UTF-16LE text', async () => {
    const root = await mkdtemp(join(tmpdir(), 'qdb-converter-'));
    const text = join(root, 'snapshot', 'text');
    const output = join(root, 'converted');
    await mkdir(text, { recursive: true });
    await writeFile(
      join(text, 'playernames.txt'),
      encodeFifaText(['playerid', 'name'], [{ playerid: 7, name: 'Converted player' }]),
    );
    const dataset: ImportedDatasetRecord = {
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Fixture',
      fifaVersion: 23,
      source: {
        kind: 'text-folder',
        originalPaths: ['/fixture'],
        hashes: {},
        importedAt: new Date(0).toISOString(),
      },
      status: 'available',
      tableNames: ['playernames', 'players', 'unknown'],
      tableCount: 3,
      rowCount: 1,
      warnings: [],
      snapshotDirectory: join(root, 'snapshot'),
    };
    const progress: string[] = [];

    const result = await createConvertedDatasetSnapshot(dataset, 23, output, (message) =>
      progress.push(message),
    );

    const parsed = parseTextTable(await readFile(join(output, 'playernames.txt')));
    expect(parsed.headers).toContain('nameid');
    expect(parsed.rows).toHaveLength(1);
    expect(result.tables[0]?.defaultSubstitutions).toBeGreaterThan(0);
    expect(result.warnings[0]).toMatch(/players.*skipped/);
    expect(progress[0]).toMatch(/Converting/);
  });

  it('normalizes values without extending dates and cleans cancelled snapshots', async () => {
    const root = await mkdtemp(join(tmpdir(), 'qdb-converter-'));
    const text = join(root, 'snapshot', 'text');
    await mkdir(text, { recursive: true });
    await writeFile(
      join(text, 'players.txt'),
      encodeFifaText(
        ['firstnameid', 'lastnameid', 'curve', 'contractvaliduntil', 'loandateend'],
        [
          {
            firstnameid: '4',
            lastnameid: 'invalid',
            curve: 200,
            contractvaliduntil: 1,
            loandateend: 1,
          },
        ],
      ),
    );
    const dataset: ImportedDatasetRecord = {
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Fixture',
      fifaVersion: 23,
      source: {
        kind: 'text-folder',
        originalPaths: ['/fixture'],
        hashes: {},
        importedAt: new Date(0).toISOString(),
      },
      status: 'available',
      tableNames: ['players'],
      tableCount: 1,
      rowCount: 1,
      warnings: [],
      snapshotDirectory: join(root, 'snapshot'),
    };
    const output = join(root, 'converted');
    const result = await createConvertedDatasetSnapshot(dataset, 23, output);
    const parsed = parseTextTable(await readFile(join(output, 'players.txt')));

    expect(result.tables[0]?.defaultSubstitutions).toBeGreaterThan(1);
    expect(parsed.rows[0]?.['contractvaliduntil']).toBe('1');

    const cancelledOutput = join(root, 'cancelled');
    await expect(
      createConvertedDatasetSnapshot(dataset, 23, cancelledOutput, undefined, () => true),
    ).rejects.toThrow(/CANCELLED/);
    expect(existsSync(cancelledOutput)).toBe(false);
  });

  it('rejects sources without target-compatible tables', async () => {
    const root = await mkdtemp(join(tmpdir(), 'qdb-converter-'));
    const snapshot = join(root, 'snapshot', 'text');
    await mkdir(snapshot, { recursive: true });
    const dataset: ImportedDatasetRecord = {
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Unsupported',
      fifaVersion: 23,
      source: {
        kind: 'text-folder',
        originalPaths: ['/fixture'],
        hashes: {},
        importedAt: new Date(0).toISOString(),
      },
      status: 'available',
      tableNames: ['unknown'],
      tableCount: 1,
      rowCount: 0,
      warnings: [],
      snapshotDirectory: join(root, 'snapshot'),
    };

    await expect(
      createConvertedDatasetSnapshot(dataset, 23, join(root, 'converted')),
    ).rejects.toThrow(/no tables compatible/);
  });
});
