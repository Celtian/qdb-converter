import { existsSync, mkdtempSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { type TableRow, encodeFifaText, parseTextTable } from '../shared/text-format';
import type { ImportedDatasetRecord } from './dataset-library';
import { sourceProvenance } from './dataset-library';
import { createPlayernameDatasetSnapshot } from './playername-engine';

const writeTable = async (
  directory: string,
  table: string,
  headers: string[],
  rows: TableRow[],
): Promise<void> => writeFile(join(directory, `${table}.txt`), encodeFifaText(headers, rows));

const fixture = async (
  fifaVersion: number,
  playernames: number[],
  dcplayernames: number[] | undefined,
  players: TableRow[],
): Promise<{ dataset: ImportedDatasetRecord; output: string }> => {
  const root = mkdtempSync(join(tmpdir(), 'qdb-playernames-'));
  const snapshotDirectory = join(root, 'source');
  const text = join(snapshotDirectory, 'text');
  const output = join(root, 'output');
  await mkdir(text, { recursive: true });
  await writeTable(
    text,
    'playernames',
    ['name', 'nameid'],
    playernames.map((nameid) => ({ name: `Name ${nameid}`, nameid })),
  );
  if (dcplayernames)
    await writeTable(
      text,
      'dcplayernames',
      ['name', 'nameid'],
      dcplayernames.map((nameid) => ({ name: `DC ${nameid}`, nameid })),
    );
  await writeTable(
    text,
    'players',
    ['firstnameid', 'lastnameid', 'playerjerseynameid', 'commonnameid'],
    players,
  );
  await writeTable(text, 'custom-table', ['value'], [{ value: 'preserved' }]);
  return {
    dataset: {
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Fixture',
      fifaVersion,
      source: sourceProvenance('text-folder', ['/fixture'], {}),
      managedFormat: 'text-folder',
      updatedAt: new Date(0).toISOString(),
      status: 'available',
      tableNames: ['playernames', ...(dcplayernames ? ['dcplayernames'] : []), 'players'],
      tableCount: dcplayernames ? 3 : 2,
      rowCount: playernames.length + (dcplayernames?.length ?? 0) + players.length,
      warnings: [],
      snapshotDirectory,
    },
    output,
  };
};

const rows = async (directory: string, table: string): Promise<TableRow[]> =>
  parseTextTable(await readFile(join(directory, `${table}.txt`))).rows;

describe('Playernames engine', () => {
  it('closes holes in both ID ranges and updates all player references', async () => {
    const { dataset, output } = await fixture(
      21,
      [10, 20],
      [44_100, 44_110],
      [{ firstnameid: 10, lastnameid: 20, playerjerseynameid: 44_100, commonnameid: 44_110 }],
    );

    const summary = await createPlayernameDatasetSnapshot(
      dataset,
      { minimize: true, removeUnused: false },
      output,
    );

    expect((await rows(output, 'playernames')).map((row) => row['nameid'])).toEqual(['0', '1']);
    expect((await rows(output, 'dcplayernames')).map((row) => row['nameid'])).toEqual([
      '44000',
      '44001',
    ]);
    expect(await rows(output, 'players')).toEqual([
      {
        firstnameid: '0',
        lastnameid: '1',
        playerjerseynameid: '44000',
        commonnameid: '44001',
      },
    ]);
    expect(summary.referencesUpdated).toBe(4);
    expect(parseTextTable(await readFile(join(output, 'custom-table.txt'))).rows).toEqual([
      { value: 'preserved' },
    ]);
  });

  it('removes unused rows without changing surviving IDs or player references', async () => {
    const { dataset, output } = await fixture(
      21,
      [0, 1, 2],
      [44_000, 44_001],
      [{ firstnameid: 0, lastnameid: 2, playerjerseynameid: 44_001, commonnameid: 2 }],
    );

    const summary = await createPlayernameDatasetSnapshot(
      dataset,
      { minimize: false, removeUnused: true },
      output,
    );

    expect((await rows(output, 'playernames')).map((row) => row['nameid'])).toEqual(['0', '2']);
    expect((await rows(output, 'dcplayernames')).map((row) => row['nameid'])).toEqual(['44001']);
    expect(await rows(output, 'players')).toEqual([
      {
        firstnameid: '0',
        lastnameid: '2',
        playerjerseynameid: '44001',
        commonnameid: '2',
      },
    ]);
    expect(summary).toMatchObject({
      referencesUpdated: 0,
      totalRowsBefore: 5,
      totalRowsAfter: 3,
    });
  });

  it('removes unused rows before minimizing when both operations are selected', async () => {
    const { dataset, output } = await fixture(
      21,
      [0, 5, 9],
      [44_000, 44_002],
      [{ firstnameid: 5, lastnameid: 9, playerjerseynameid: 44_002, commonnameid: 9 }],
    );

    const summary = await createPlayernameDatasetSnapshot(
      dataset,
      { minimize: true, removeUnused: true },
      output,
    );

    expect((await rows(output, 'playernames')).map((row) => row['nameid'])).toEqual(['0', '1']);
    expect((await rows(output, 'dcplayernames')).map((row) => row['nameid'])).toEqual(['44000']);
    expect(await rows(output, 'players')).toEqual([
      {
        firstnameid: '0',
        lastnameid: '1',
        playerjerseynameid: '44000',
        commonnameid: '1',
      },
    ]);
    expect(summary).toMatchObject({
      operations: { minimize: true, removeUnused: true },
      totalRowsBefore: 5,
      totalRowsAfter: 3,
      referencesUpdated: 4,
    });
  });

  it('removes unused out-of-range rows before allocating valid IDs', async () => {
    const { dataset, output } = await fixture(21, [50_001, 100], undefined, [
      { firstnameid: 100, lastnameid: 100, playerjerseynameid: 100, commonnameid: 100 },
    ]);

    const summary = await createPlayernameDatasetSnapshot(
      dataset,
      { minimize: true, removeUnused: true },
      output,
    );

    expect((await rows(output, 'playernames')).map((row) => row['nameid'])).toEqual(['0']);
    expect(summary.tables[0]).toMatchObject({
      beforeRows: 2,
      afterRows: 1,
      beforeIdProfile: { outOfRangeCount: 1 },
      afterIdProfile: { outOfRangeCount: 0, holeCount: 0 },
    });
  });

  it('uses one collision-free contiguous namespace for FIFA 11 overlapping ranges', async () => {
    const { dataset, output } = await fixture(
      11,
      [100, 200],
      [1_000, 2_000],
      [{ firstnameid: 100, lastnameid: 200, playerjerseynameid: 1_000, commonnameid: 2_000 }],
    );

    await createPlayernameDatasetSnapshot(dataset, { minimize: true, removeUnused: false }, output);

    expect((await rows(output, 'playernames')).map((row) => row['nameid'])).toEqual(['0', '1']);
    expect((await rows(output, 'dcplayernames')).map((row) => row['nameid'])).toEqual(['2', '3']);
  });

  it('supports FIFA 23 without a dcplayernames schema', async () => {
    const { dataset, output } = await fixture(23, [100, 200], undefined, [
      { firstnameid: 100, lastnameid: 200, playerjerseynameid: 100, commonnameid: 200 },
    ]);

    const summary = await createPlayernameDatasetSnapshot(
      dataset,
      { minimize: true, removeUnused: false },
      output,
    );

    expect(summary.tables.map((table) => table.table)).toEqual(['playernames']);
    expect((await rows(output, 'playernames')).map((row) => row['nameid'])).toEqual(['0', '1']);
  });

  it('fails safely for missing or ambiguous references and removes partial output', async () => {
    const missing = await fixture(21, [0], undefined, [
      { firstnameid: 0, lastnameid: 99, playerjerseynameid: 0, commonnameid: 0 },
    ]);
    await expect(
      createPlayernameDatasetSnapshot(
        missing.dataset,
        { minimize: true, removeUnused: false },
        missing.output,
      ),
    ).rejects.toThrow(/missing name IDs: 99/);
    expect(existsSync(missing.output)).toBe(false);

    const duplicate = await fixture(
      11,
      [0],
      [0],
      [{ firstnameid: 0, lastnameid: 0, playerjerseynameid: 0, commonnameid: 0 }],
    );
    await expect(
      createPlayernameDatasetSnapshot(
        duplicate.dataset,
        { minimize: false, removeUnused: true },
        duplicate.output,
      ),
    ).rejects.toThrow(/duplicated/);
    expect(existsSync(duplicate.output)).toBe(false);
  });

  it('rejects invalid and out-of-range IDs and honours cancellation without output', async () => {
    const invalid = await fixture(21, [0], undefined, [
      { firstnameid: 0, lastnameid: 'invalid', playerjerseynameid: 0, commonnameid: 0 },
    ]);
    await expect(
      createPlayernameDatasetSnapshot(
        invalid.dataset,
        { minimize: true, removeUnused: false },
        invalid.output,
      ),
    ).rejects.toThrow(/not a valid integer/);
    expect(existsSync(invalid.output)).toBe(false);

    const outOfRange = await fixture(21, [50_001], undefined, [
      { firstnameid: 50_001, lastnameid: 50_001, playerjerseynameid: 50_001, commonnameid: 50_001 },
    ]);
    await expect(
      createPlayernameDatasetSnapshot(
        outOfRange.dataset,
        { minimize: false, removeUnused: true },
        outOfRange.output,
      ),
    ).rejects.toThrow(/outside the FIFA 21 range/);
    expect(existsSync(outOfRange.output)).toBe(false);

    const repaired = await fixture(21, [50_001], undefined, [
      { firstnameid: 50_001, lastnameid: 50_001, playerjerseynameid: 50_001, commonnameid: 50_001 },
    ]);
    const repairedSummary = await createPlayernameDatasetSnapshot(
      repaired.dataset,
      { minimize: true, removeUnused: false },
      repaired.output,
    );
    expect((await rows(repaired.output, 'playernames')).map((row) => row['nameid'])).toEqual(['0']);
    expect(repairedSummary.tables[0]).toMatchObject({
      beforeIdProfile: { outOfRangeCount: 1 },
      afterIdProfile: { outOfRangeCount: 0 },
    });

    const cancelled = await fixture(21, [0], undefined, [
      { firstnameid: 0, lastnameid: 0, playerjerseynameid: 0, commonnameid: 0 },
    ]);
    await expect(
      createPlayernameDatasetSnapshot(
        cancelled.dataset,
        { minimize: true, removeUnused: false },
        cancelled.output,
        undefined,
        () => true,
      ),
    ).rejects.toThrow(/PLAYERNAMES_CANCELLED/);
    expect(existsSync(cancelled.output)).toBe(false);
  });
});
