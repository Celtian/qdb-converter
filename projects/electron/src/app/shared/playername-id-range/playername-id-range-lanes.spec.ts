import type { PlayernameIdProfile } from '../../../../shared/contracts';
import { createDatasetIdRangeLayout, datasetIdLaneGeometry } from './dataset-id-range-layout';
import {
  type PlayernameIdRangeSource,
  createPlayernameIdRangeLanes,
} from './playername-id-range-lanes';

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

describe('Playernames ID range lanes', () => {
  it('places adjacent ranges in ordered table lanes on one shared axis', () => {
    const model = createPlayernameIdRangeLanes([
      { table: 'dcplayernames', profile: profile(6, 9, [6, 8]) },
      { table: 'playernames', profile: profile(0, 5, [0, 2]) },
    ]);
    const layout = createDatasetIdRangeLayout(model, 600);

    expect(model).toMatchObject({
      exact: true,
      occupiedCount: 4,
      holeCount: 2,
      capacityCount: 4,
      outOfRangeCount: 0,
    });
    expect(model.lanes.map((lane) => lane.label)).toEqual(['playernames', 'dcplayernames']);
    expect(layout.lanes[0]!.x + layout.lanes[0]!.width).toBeCloseTo(layout.lanes[1]!.x);
    expect(datasetIdLaneGeometry(0, 2)).toEqual({ y: 13, height: 32 });
    expect(datasetIdLaneGeometry(1, 2)).toEqual({ y: 51, height: 32 });
    expect(model.lanes[1]!.runs).toContainEqual({
      state: 'occupied',
      startId: 6,
      endId: 6,
      count: 1,
      sourceLabels: ['dcplayernames'],
    });
  });

  it('collapses invalid gaps between disjoint schema ranges', () => {
    const model = createPlayernameIdRangeLanes([
      { table: 'playernames', profile: profile(900_000, 900_002, [900_000, 900_002]) },
      { table: 'dcplayernames', profile: profile(44_000, 44_001, [44_000]) },
    ]);
    const layout = createDatasetIdRangeLayout(model, 600);
    const dcLane = layout.lanes[1]!;
    const playerLane = layout.lanes[0]!;

    expect(dcLane.x + dcLane.width).toBeCloseTo(playerLane.x);
    expect(layout.axisSegments.some((span) => span.startId > 44_001 && span.endId < 900_000)).toBe(
      false,
    );
  });

  it('keeps overlapping IDs in separate aligned lanes and sums their totals', () => {
    const model = createPlayernameIdRangeLanes([
      { table: 'playernames', profile: profile(0, 5, [0, 2]) },
      { table: 'dcplayernames', profile: profile(0, 5, [1, 4]) },
    ]);
    const layout = createDatasetIdRangeLayout(model, 600);

    expect(model).toMatchObject({ occupiedCount: 4, holeCount: 4, capacityCount: 4 });
    expect(layout.lanes[0]).toMatchObject({ x: 0, width: 600 });
    expect(layout.lanes[1]).toMatchObject({ x: 0, width: 600 });
    expect(layout.lanes[0]!.segments).toContainEqual(
      expect.objectContaining({ state: 'hole', startId: 1, endId: 1 }),
    );
    expect(layout.lanes[1]!.segments).toContainEqual(
      expect.objectContaining({ state: 'occupied', startId: 1, endId: 1 }),
    );
  });

  it('keeps source-relative overflow and supports a single available table', () => {
    const sources: PlayernameIdRangeSource[] = [
      { table: 'playernames', profile: profile(10, 12, [9, 10, 13]) },
    ];
    const model = createPlayernameIdRangeLanes(sources);

    expect(model.ranges).toEqual([{ label: 'playernames', min: 10, max: 12 }]);
    expect(model.lanes[0]!.runs.filter((run) => run.state.includes('range'))).toEqual([
      expect.objectContaining({ state: 'below-range', sourceLabels: ['playernames'] }),
      expect.objectContaining({ state: 'above-range', sourceLabels: ['playernames'] }),
    ]);
  });

  it('retains per-table numeric totals when historical exact IDs are unavailable', () => {
    const legacy = { ...profile(0, 5, [0, 2]), occupiedIds: undefined };
    const model = createPlayernameIdRangeLanes([
      { table: 'playernames', profile: legacy },
      { table: 'dcplayernames', profile: { ...legacy, rangeMin: 6, rangeMax: 11 } },
    ]);

    expect(model.exact).toBe(false);
    expect(model.lanes.every((lane) => lane.runs.length === 0)).toBe(true);
    expect(model.breakdowns).toHaveLength(2);
    expect(model.occupiedCount).toBe(4);
  });
});
