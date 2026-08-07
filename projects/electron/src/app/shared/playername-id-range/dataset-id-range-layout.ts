import type { DatasetIdProfile } from '../../../../shared/contracts';

export const OVERFLOW_INDICATOR_WIDTH = 14;
export const CAPACITY_FRACTION = 0.15;
export const DATASET_ID_CANVAS_HEIGHT = 96;
export const SINGLE_LANE_HEIGHT = 52;
export const MULTI_LANE_HEIGHT = 32;
export const LANE_GAP = 6;

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

export interface DatasetIdRangeLane {
  label?: string;
  min: number;
  max: number;
  runs: DatasetIdRun[];
}

export interface DatasetIdRangeLaneLayout extends Omit<DatasetIdRangeLane, 'runs'> {
  segments: DatasetIdLayoutSegment[];
  x: number;
  width: number;
}

export interface DatasetIdAxisSegment {
  state: 'active' | 'capacity';
  startId: number;
  endId: number;
  count: number;
  x: number;
  width: number;
}

export interface DatasetIdRangeLayout {
  axisSegments: DatasetIdAxisSegment[];
  lanes: DatasetIdRangeLaneLayout[];
}

export interface DatasetIdRangeSelection {
  lane: number;
  segment: number;
}

export interface DatasetIdLaneGeometry {
  height: number;
  y: number;
}

export const datasetIdLaneGeometry = (
  laneIndex: number,
  laneCount: number,
): DatasetIdLaneGeometry => {
  if (laneCount <= 1) return { y: 18, height: SINGLE_LANE_HEIGHT };
  const totalHeight = laneCount * MULTI_LANE_HEIGHT + (laneCount - 1) * LANE_GAP;
  return {
    y: (DATASET_ID_CANVAS_HEIGHT - totalHeight) / 2 + laneIndex * (MULTI_LANE_HEIGHT + LANE_GAP),
    height: MULTI_LANE_HEIGHT,
  };
};

export const laneAtCanvasPosition = (laneCount: number, y: number): number | undefined => {
  for (let laneIndex = 0; laneIndex < laneCount; laneIndex += 1) {
    const geometry = datasetIdLaneGeometry(laneIndex, laneCount);
    if (y >= geometry.y && y <= geometry.y + geometry.height) return laneIndex;
  }
  return undefined;
};

export const selectionInAdjacentLane = (
  layout: DatasetIdRangeLayout,
  current: DatasetIdRangeSelection,
  direction: -1 | 1,
): DatasetIdRangeSelection => {
  const targetLane = Math.min(layout.lanes.length - 1, Math.max(0, current.lane + direction));
  if (targetLane === current.lane) return current;
  const currentSegment = layout.lanes[current.lane]!.segments[current.segment]!;
  const referenceId = (currentSegment.startId + currentSegment.endId) / 2;
  const targetSegments = layout.lanes[targetLane]!.segments;
  let nearestSegment = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;
  for (const [segmentIndex, segment] of targetSegments.entries()) {
    const distance =
      referenceId < segment.startId
        ? segment.startId - referenceId
        : referenceId > segment.endId
          ? referenceId - segment.endId
          : 0;
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestSegment = segmentIndex;
    }
  }
  return { lane: targetLane, segment: nearestSegment };
};

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
  lanes: DatasetIdRangeLane[];
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
  lanes: [
    {
      min: profile.rangeMin,
      max: profile.rangeMax,
      runs: createDatasetIdRuns(profile),
    },
  ],
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
  const model = 'lanes' in source ? source : createDatasetIdRangeModel(source);
  const width = Math.max(1, canvasWidth);
  const lanes = model.lanes;
  const boundaries = new Set<number>();
  for (const lane of lanes) {
    boundaries.add(lane.min);
    boundaries.add(lane.max + 1);
    for (const run of lane.runs) {
      if (run.state === 'below-range' || run.state === 'above-range') continue;
      boundaries.add(Math.max(lane.min, run.startId));
      boundaries.add(Math.min(lane.max, run.endId) + 1);
    }
  }
  const sortedBoundaries = [...boundaries].sort((left, right) => left - right);
  const spans: Omit<DatasetIdAxisSegment, 'x' | 'width'>[] = [];
  for (let index = 0; index < sortedBoundaries.length - 1; index += 1) {
    const startId = sortedBoundaries[index]!;
    const endId = sortedBoundaries[index + 1]! - 1;
    const applicable = lanes.filter((lane) => startId >= lane.min && startId <= lane.max);
    if (!applicable.length) continue;
    const active = applicable.some((lane) =>
      lane.runs.some(
        (run) =>
          (run.state === 'occupied' || run.state === 'hole') &&
          startId >= run.startId &&
          startId <= run.endId,
      ),
    );
    spans.push({
      state: active ? 'active' : 'capacity',
      startId,
      endId,
      count: endId - startId + 1,
    });
  }
  const activeSize = spans
    .filter((span) => span.state === 'active')
    .reduce((total, span) => total + span.count, 0);
  const capacitySize = spans
    .filter((span) => span.state === 'capacity')
    .reduce((total, span) => total + span.count, 0);
  const activeWidth =
    activeSize && capacitySize ? width * (1 - CAPACITY_FRACTION) : activeSize ? width : 0;
  const capacityWidth = capacitySize ? width - activeWidth : 0;
  const axisSegments: DatasetIdAxisSegment[] = [];
  let x = 0;
  for (const span of spans) {
    const segmentWidth =
      span.state === 'active'
        ? activeSize
          ? (span.count / activeSize) * activeWidth
          : 0
        : capacitySize
          ? (span.count / capacitySize) * capacityWidth
          : 0;
    axisSegments.push({ ...span, x, width: segmentWidth });
    x += segmentWidth;
  }

  const boundaryPosition = (id: number): number => {
    const span = axisSegments.find(
      (candidate) => id >= candidate.startId && id <= candidate.endId + 1,
    );
    if (!span) return id <= (axisSegments[0]?.startId ?? id) ? 0 : width;
    return span.x + ((id - span.startId) / span.count) * span.width;
  };
  const laneLayouts = lanes.map((lane): DatasetIdRangeLaneLayout => {
    const laneX = boundaryPosition(lane.min);
    const laneEndX = boundaryPosition(lane.max + 1);
    const laneWidth = Math.max(0, laneEndX - laneX);
    const overflowWidth = Math.min(OVERFLOW_INDICATOR_WIDTH, laneWidth / 2);
    return {
      label: lane.label,
      min: lane.min,
      max: lane.max,
      x: laneX,
      width: laneWidth,
      segments: lane.runs.map((run) => {
        if (run.state === 'below-range') return { ...run, x: laneX, width: overflowWidth };
        if (run.state === 'above-range')
          return { ...run, x: laneEndX - overflowWidth, width: overflowWidth };
        const runX = boundaryPosition(run.startId);
        return {
          ...run,
          x: runX,
          width: Math.max(0, boundaryPosition(run.endId + 1) - runX),
        };
      }),
    };
  });
  return { axisSegments, lanes: laneLayouts };
};

export const segmentAtPosition = (
  layout: DatasetIdRangeLayout,
  x: number,
  laneIndex = 0,
): number | undefined => {
  const segments = layout.lanes[laneIndex]?.segments ?? [];
  const matches = segments
    .map((segment, segmentIndex) => ({ segment, segmentIndex }))
    .filter(
      ({ segment, segmentIndex }) =>
        x >= segment.x &&
        (x < segment.x + segment.width ||
          (segmentIndex === segments.length - 1 && x <= segment.x + segment.width)),
    );
  return (matches.find(({ segment }) => segment.state.includes('range')) ?? matches[0])
    ?.segmentIndex;
};
