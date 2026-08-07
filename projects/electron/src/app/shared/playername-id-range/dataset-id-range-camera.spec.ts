import {
  FIT_DATASET_ID_CAMERA,
  MAX_ID_WIDTH,
  clampDatasetIdRangeCamera,
  createDatasetIdRangeCameraLimits,
  datasetIdScreenToWorld,
  panDatasetIdRangeCamera,
  segmentAtScreenPosition,
  segmentTooltipPosition,
  zoomDatasetIdRangeCameraAt,
} from './dataset-id-range-camera';
import {
  CAPACITY_FRACTION,
  OVERFLOW_INDICATOR_WIDTH,
  createDatasetIdRangeLayout,
  createDatasetIdRuns,
  segmentAtPosition,
} from './dataset-id-range-layout';
import { datasetIdRangeProfileFixture as profile } from './dataset-id-range.fixture';

describe('dataset ID range layout and camera', () => {
  it('creates contiguous occupied, hole, capacity, and overflow runs', () => {
    expect(createDatasetIdRuns(profile)).toEqual([
      { state: 'below-range', startId: -1, endId: -1, count: 1, samples: [-1] },
      { state: 'occupied', startId: 0, endId: 0, count: 1 },
      { state: 'hole', startId: 1, endId: 194, count: 194 },
      { state: 'occupied', startId: 195, endId: 195, count: 1 },
      { state: 'hole', startId: 196, endId: 389, count: 194 },
      { state: 'occupied', startId: 390, endId: 390, count: 1 },
      { state: 'capacity', startId: 391, endId: 49_999, count: 49_609 },
      {
        state: 'above-range',
        startId: 50_001,
        endId: 50_001,
        count: 1,
        samples: [50_001],
      },
    ]);
  });

  it('lays out proportional active runs, a compact capacity tail, and overflow endcaps', () => {
    const width = 640;
    const layout = createDatasetIdRangeLayout(profile, width);
    const segments = layout.lanes[0]!.segments;
    const below = segments[0]!;
    const capacity = segments.at(-2)!;
    const above = segments.at(-1)!;

    expect(below.width).toBe(OVERFLOW_INDICATOR_WIDTH);
    expect(above.width).toBe(OVERFLOW_INDICATOR_WIDTH);
    expect(capacity.width).toBeCloseTo(width * CAPACITY_FRACTION);
    const inRange = segments.filter((segment) => !segment.state.includes('range'));
    for (let index = 1; index < inRange.length; index += 1)
      expect(inRange[index - 1]!.x + inRange[index - 1]!.width).toBeCloseTo(inRange[index]!.x);
    expect(segmentAtPosition(layout, 5)).toBe(0);
    expect(segmentAtPosition(layout, width - 5)).toBe(segments.length - 1);
  });

  it('uses the full inner canvas for an empty table or an active span without capacity', () => {
    const empty = createDatasetIdRangeLayout(
      {
        ...profile,
        activeMax: undefined,
        occupiedIds: [],
        occupiedCount: 0,
        holeCount: 0,
        capacityCount: 50_000,
        outOfRangeCount: 0,
        belowRange: { count: 0, samples: [] },
        aboveRange: { count: 0, samples: [] },
      },
      640,
    );
    expect(empty.lanes[0]!.segments).toEqual([
      { state: 'capacity', startId: 0, endId: 49_999, count: 50_000, x: 0, width: 640 },
    ]);

    const full = createDatasetIdRangeLayout(
      {
        ...profile,
        rangeMax: 2,
        activeMax: 2,
        occupiedIds: [0, 2],
        occupiedCount: 2,
        holeCount: 1,
        capacityCount: 0,
        outOfRangeCount: 0,
        belowRange: { count: 0, samples: [] },
        aboveRange: { count: 0, samples: [] },
      },
      600,
    );
    expect(full.lanes[0]!.segments.at(-1)!.x + full.lanes[0]!.segments.at(-1)!.width).toBeCloseTo(
      600,
    );
    expect(full.lanes[0]!.segments.some((segment) => segment.state === 'capacity')).toBe(false);
  });

  it('computes a fit-to-four-pixels camera and preserves a pointer zoom anchor', () => {
    const width = 640;
    const layout = createDatasetIdRangeLayout(profile, width);
    const limits = createDatasetIdRangeCameraLimits(profile, layout);
    const activeWidth = layout.axisSegments
      .filter((segment) => segment.state === 'active')
      .reduce((sum, segment) => sum + segment.width, 0);

    expect((activeWidth / 391) * limits.maxScale).toBeCloseTo(MAX_ID_WIDTH);
    const anchorBefore = datasetIdScreenToWorld(120, FIT_DATASET_ID_CAMERA, width);
    const zoomed = zoomDatasetIdRangeCameraAt(FIT_DATASET_ID_CAMERA, 2, 120, width, limits);
    expect(datasetIdScreenToWorld(120, zoomed, width)).toBeCloseTo(anchorBefore);
    expect(clampDatasetIdRangeCamera({ center: -1, scale: 100 }, limits)).toEqual({
      center: 1 / (limits.maxScale * 2),
      scale: limits.maxScale,
    });
  });

  it('pans within the world and hit-tests through the camera transform', () => {
    const width = 640;
    const layout = createDatasetIdRangeLayout(profile, width);
    const limits = createDatasetIdRangeCameraLimits(profile, layout);
    const zoomed = zoomDatasetIdRangeCameraAt(FIT_DATASET_ID_CAMERA, 2, width / 2, width, limits);
    const panned = panDatasetIdRangeCamera(zoomed, width, width, limits);

    expect(panned.center).toBe(0.75);
    expect(panDatasetIdRangeCamera(panned, width * 10, width, limits).center).toBe(
      1 - 1 / (panned.scale * 2),
    );
    const segments = layout.lanes[0]!.segments;
    const capacity = segments.findIndex((segment) => segment.state === 'capacity');
    const capacitySegment = segments[capacity]!;
    const capacityScreenX =
      (capacitySegment.x + capacitySegment.width / 2 - (panned.center * width - width / 4)) * 2;
    expect(segmentAtScreenPosition(layout, panned, width, capacityScreenX)).toBe(capacity);
  });

  it('clamps a measured tooltip within the chart at every segment position', () => {
    const width = 640;
    const layout = createDatasetIdRangeLayout(profile, width);
    const segments = layout.lanes[0]!.segments;
    const first = segments[0]!;
    const middle = segments.find((segment) => segment.startId === 196)!;
    const last = segments.at(-1)!;

    expect(segmentTooltipPosition(first, FIT_DATASET_ID_CAMERA, width, 200, 8)).toBe(108);
    expect(segmentTooltipPosition(last, FIT_DATASET_ID_CAMERA, width, 200, 8)).toBe(532);
    expect(segmentTooltipPosition(middle, FIT_DATASET_ID_CAMERA, width, 80, 8)).toBeGreaterThan(48);
    expect(segmentTooltipPosition(first, FIT_DATASET_ID_CAMERA, 160, 200, 8)).toBe(80);
  });
});
