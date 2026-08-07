import type { PlayernameIdProfile } from '../../../../shared/contracts';
import { createDatasetIdRangeLayout } from './dataset-id-range-layout';
import {
  type PlayernameIdRangeSource,
  createPlayernameIdRangeUnion,
} from './playername-id-range-union';

const profile = (
  rangeMin: number,
  rangeMax: number,
  values: readonly number[],
): PlayernameIdProfile => {
  const occupiedIds = [...new Set(values)].sort((left, right) => left - right);
  const valid = occupiedIds.filter((id) => id >= rangeMin && id <= rangeMax);
  const below = occupiedIds.filter((id) => id < rangeMin);
  const above = occupiedIds.filter((id) => id > rangeMax);
  const activeMax = valid.at(-1);
  return {
    rangeMin,
    rangeMax,
    activeMax,
    occupiedIds,
    occupiedCount: valid.length,
    holeCount: activeMax === undefined ? 0 : activeMax - rangeMin + 1 - valid.length,
    capacityCount: activeMax === undefined ? rangeMax - rangeMin + 1 : rangeMax - activeMax,
    outOfRangeCount: below.length + above.length,
    belowRange: {
      count: below.length,
      min: below.at(0),
      max: below.at(-1),
      samples: below,
    },
    aboveRange: {
      count: above.length,
      min: above.at(0),
      max: above.at(-1),
      samples: above,
    },
    buckets: [],
  };
};

describe('Playernames ID range union', () => {
  it('joins adjacent FIFA 16 ranges without losing table ownership', () => {
    const model = createPlayernameIdRangeUnion([
      { table: 'playernames', profile: profile(0, 5, [0, 2]) },
      { table: 'dcplayernames', profile: profile(6, 9, [6, 8]) },
    ]);

    expect(model).toMatchObject({
      exact: true,
      occupiedCount: 4,
      holeCount: 2,
      capacityCount: 4,
      outOfRangeCount: 0,
    });
    expect(model.ranges.map(({ label, min, max }) => ({ label, min, max }))).toEqual([
      { label: 'playernames', min: 0, max: 5 },
      { label: 'dcplayernames', min: 6, max: 9 },
    ]);
    expect(model.runs).toContainEqual({
      state: 'occupied',
      startId: 6,
      endId: 6,
      count: 1,
      sourceLabels: ['dcplayernames'],
    });
  });

  it('collapses invalid gaps between disjoint schema ranges', () => {
    const model = createPlayernameIdRangeUnion([
      { table: 'playernames', profile: profile(900_000, 900_002, [900_000, 900_002]) },
      { table: 'dcplayernames', profile: profile(44_000, 44_001, [44_000]) },
    ]);
    const layout = createDatasetIdRangeLayout(model, 600);

    expect(model.ranges.map((range) => range.label)).toEqual(['dcplayernames', 'playernames']);
    expect(model.runs.some((run) => run.startId > 44_001 && run.endId < 900_000)).toBe(false);
    for (let index = 1; index < layout.segments.length; index += 1)
      expect(layout.segments[index - 1]!.x + layout.segments[index - 1]!.width).toBeCloseTo(
        layout.segments[index]!.x,
      );
  });

  it('merges FIFA 11 overlapping ranges into one collision-free namespace', () => {
    const model = createPlayernameIdRangeUnion([
      { table: 'playernames', profile: profile(0, 5, [0, 2]) },
      { table: 'dcplayernames', profile: profile(0, 5, [1, 4]) },
    ]);

    expect(model).toMatchObject({
      occupiedCount: 4,
      holeCount: 1,
      capacityCount: 1,
    });
    expect(model.runs).toContainEqual({
      state: 'hole',
      startId: 3,
      endId: 3,
      count: 1,
      sourceLabels: ['playernames', 'dcplayernames'],
    });
    expect(model.runs).toContainEqual({
      state: 'capacity',
      startId: 5,
      endId: 5,
      count: 1,
      sourceLabels: ['playernames', 'dcplayernames'],
    });
  });

  it('keeps source-relative overflow and supports a single available table', () => {
    const sources: PlayernameIdRangeSource[] = [
      { table: 'playernames', profile: profile(10, 12, [9, 10, 13]) },
    ];
    const model = createPlayernameIdRangeUnion(sources);

    expect(model.ranges).toEqual([{ label: 'playernames', min: 10, max: 12 }]);
    expect(model.runs.filter((run) => run.state.includes('range'))).toEqual([
      expect.objectContaining({ state: 'below-range', sourceLabels: ['playernames'] }),
      expect.objectContaining({ state: 'above-range', sourceLabels: ['playernames'] }),
    ]);
  });

  it('retains per-table numeric totals when historical exact IDs are unavailable', () => {
    const legacy = { ...profile(0, 5, [0, 2]), occupiedIds: undefined };
    const model = createPlayernameIdRangeUnion([
      { table: 'playernames', profile: legacy },
      { table: 'dcplayernames', profile: { ...legacy, rangeMin: 6, rangeMax: 11 } },
    ]);

    expect(model.exact).toBe(false);
    expect(model.runs).toEqual([]);
    expect(model.breakdowns).toHaveLength(2);
    expect(model.occupiedCount).toBe(4);
  });
});
