import type { DatasetIdProfile } from '../../../../shared/contracts';

export const OVERFLOW_INDICATOR_WIDTH = 14;
export const CAPACITY_FRACTION = 0.15;

export type DatasetIdRunState = 'occupied' | 'hole' | 'capacity' | 'below-range' | 'above-range';

export interface DatasetIdRun {
  state: DatasetIdRunState;
  startId: number;
  endId: number;
  count: number;
  samples?: number[];
  sourceLabels?: string[];
}

export interface DatasetIdLayoutSegment extends DatasetIdRun {
  x: number;
  width: number;
}

export interface DatasetIdRangeLayout {
  segments: DatasetIdLayoutSegment[];
}

export interface DatasetIdPublishedRange {
  label?: string;
  min: number;
  max: number;
}

export interface DatasetIdRangeBreakdown {
  label: string;
  occupiedCount: number;
  holeCount: number;
  capacityCount: number;
  outOfRangeCount: number;
}

/** Renderer-ready data. A model may contain multiple collapsed numeric ranges. */
export interface DatasetIdRangeModel {
  exact: boolean;
  runs: DatasetIdRun[];
  ranges: DatasetIdPublishedRange[];
  breakdowns: DatasetIdRangeBreakdown[];
  occupiedCount: number;
  holeCount: number;
  capacityCount: number;
  outOfRangeCount: number;
}

export const createDatasetIdRuns = (profile: DatasetIdProfile): DatasetIdRun[] => {
  const occupiedIds = [...new Set(profile.occupiedIds ?? [])]
    .filter((id) => id >= profile.rangeMin && id <= profile.rangeMax)
    .sort((left, right) => left - right);
  const activeRuns: DatasetIdRun[] = [];

  if (profile.activeMax !== undefined) {
    let cursor = profile.rangeMin;
    for (let index = 0; index < occupiedIds.length;) {
      const startId = occupiedIds[index]!;
      let endId = startId;
      index += 1;
      while (index < occupiedIds.length && occupiedIds[index] === endId + 1) {
        endId = occupiedIds[index]!;
        index += 1;
      }
      if (startId > cursor)
        activeRuns.push({
          state: 'hole',
          startId: cursor,
          endId: startId - 1,
          count: startId - cursor,
        });
      activeRuns.push({
        state: 'occupied',
        startId,
        endId,
        count: endId - startId + 1,
      });
      cursor = endId + 1;
    }
    if (cursor <= profile.activeMax)
      activeRuns.push({
        state: 'hole',
        startId: cursor,
        endId: profile.activeMax,
        count: profile.activeMax - cursor + 1,
      });
  }

  const runs: DatasetIdRun[] = [];
  if (profile.belowRange.count)
    runs.push({
      state: 'below-range',
      startId: profile.belowRange.min ?? profile.rangeMin - 1,
      endId: profile.belowRange.max ?? profile.rangeMin - 1,
      count: profile.belowRange.count,
      samples: profile.belowRange.samples,
    });
  runs.push(...activeRuns);

  const capacityStart = profile.activeMax === undefined ? profile.rangeMin : profile.activeMax + 1;
  if (capacityStart <= profile.rangeMax)
    runs.push({
      state: 'capacity',
      startId: capacityStart,
      endId: profile.rangeMax,
      count: profile.rangeMax - capacityStart + 1,
    });

  if (profile.aboveRange.count)
    runs.push({
      state: 'above-range',
      startId: profile.aboveRange.min ?? profile.rangeMax + 1,
      endId: profile.aboveRange.max ?? profile.rangeMax + 1,
      count: profile.aboveRange.count,
      samples: profile.aboveRange.samples,
    });
  return runs;
};

export const createDatasetIdRangeModel = (profile: DatasetIdProfile): DatasetIdRangeModel => ({
  exact: profile.occupiedIds !== undefined,
  runs: createDatasetIdRuns(profile),
  ranges: [{ min: profile.rangeMin, max: profile.rangeMax }],
  breakdowns: [],
  occupiedCount: profile.occupiedCount,
  holeCount: profile.holeCount,
  capacityCount: profile.capacityCount,
  outOfRangeCount: profile.outOfRangeCount,
});

export const createDatasetIdRangeLayout = (
  source: DatasetIdProfile | DatasetIdRangeModel,
  canvasWidth: number,
): DatasetIdRangeLayout => {
  const model = 'runs' in source ? source : createDatasetIdRangeModel(source);
  const width = Math.max(1, canvasWidth);
  const runs = model.runs;
  const overflowCount = runs.filter(
    (run) => run.state === 'below-range' || run.state === 'above-range',
  ).length;
  const overflowWidth = overflowCount
    ? Math.min(OVERFLOW_INDICATOR_WIDTH, width / (overflowCount * 2))
    : 0;
  const innerWidth = Math.max(0, width - overflowCount * overflowWidth);
  const activeSize = runs
    .filter((run) => run.state === 'occupied' || run.state === 'hole')
    .reduce((total, run) => total + run.count, 0);
  const capacitySize = runs
    .filter((run) => run.state === 'capacity')
    .reduce((total, run) => total + run.count, 0);
  const activeWidth =
    activeSize && capacitySize ? innerWidth * (1 - CAPACITY_FRACTION) : activeSize ? innerWidth : 0;
  const capacityWidth = capacitySize ? innerWidth - activeWidth : 0;
  const segments: DatasetIdLayoutSegment[] = [];
  let x = 0;
  for (const run of runs) {
    const segmentWidth =
      run.state === 'below-range' || run.state === 'above-range'
        ? overflowWidth
        : run.state === 'capacity'
          ? capacitySize
            ? (run.count / capacitySize) * capacityWidth
            : 0
          : activeSize
            ? (run.count / activeSize) * activeWidth
            : 0;
    segments.push({ ...run, x, width: segmentWidth });
    x += segmentWidth;
  }
  return { segments };
};

export const segmentAtPosition = (layout: DatasetIdRangeLayout, x: number): number | undefined => {
  const index = layout.segments.findIndex(
    (segment, segmentIndex) =>
      x >= segment.x &&
      (x < segment.x + segment.width ||
        (segmentIndex === layout.segments.length - 1 && x <= segment.x + segment.width)),
  );
  return index < 0 ? undefined : index;
};
