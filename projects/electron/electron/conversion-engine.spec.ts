import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { ConversionRequest } from '../shared/contracts';
import { encodeFifaText, parseTextTable } from '../shared/text-format';
import { convertDataset } from './conversion-engine';
import type { DatasetRecord } from './dataset-library';

describe('conversion engine', () => {
  it('writes target-ordered UTF-16LE tables without overwriting output', async () => {
    const root = await mkdtemp(join(tmpdir(), 'qdb-converter-'));
    const text = join(root, 'snapshot', 'text');
    const output = join(root, 'output');
    await mkdir(text, { recursive: true });
    const source = encodeFifaText(
      ['playerid', 'name'],
      [{ playerid: 7, name: 'Converted player' }],
    );
    await writeFile(join(text, 'playernames.txt'), source);
    const dataset: DatasetRecord = {
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
      tableNames: ['playernames'],
      tableCount: 1,
      rowCount: 1,
      warnings: [],
      snapshotDirectory: join(root, 'snapshot'),
    };
    const request: ConversionRequest = {
      requestId: '22222222-2222-4222-8222-222222222222',
      datasetIds: [dataset.id],
      targetVersion: 23,
      tables: ['playernames'],
      outputParentPath: output,
      extendContracts: false,
    };
    request.tables.push('players');
    const progress: string[] = [];
    const result = await convertDataset(dataset, request, (message) => progress.push(message));
    const parsed = parseTextTable(await readFile(join(result.outputPath, 'playernames.txt')));
    expect(parsed.headers).toContain('nameid');
    expect(parsed.rows).toHaveLength(1);
    expect(result.tables[0]?.defaultSubstitutions).toBeGreaterThan(0);
    expect(result.warnings[0]).toMatch(/players.*skipped/);
    expect(progress[0]).toMatch(/Converting/);

    const collision = await convertDataset(dataset, request);
    expect(collision.outputPath).not.toBe(result.outputPath);
  });

  it('normalizes numeric values, extends dates, and removes cancelled temporary output', async () => {
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
    const dataset: DatasetRecord = {
      id: '11111111-1111-4111-8111-111111111111',
      name: '///',
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
    const request: ConversionRequest = {
      requestId: '22222222-2222-4222-8222-222222222222',
      datasetIds: [dataset.id],
      targetVersion: 23,
      tables: ['players'],
      outputParentPath: join(root, 'output'),
      extendContracts: true,
    };
    const result = await convertDataset(dataset, request);
    expect(result.outputPath).toContain('dataset-fifa23');
    expect(result.tables[0]?.defaultSubstitutions).toBeGreaterThan(1);
    await expect(convertDataset(dataset, request, undefined, () => true)).rejects.toThrow(
      /CANCELLED/,
    );
  });
});
