import type { DatasetIdProfile } from '../../../../shared/contracts';
import type {
  DatasetIdLayoutSegment,
  DatasetIdRangeLayout,
  DatasetIdRangeModel,
} from './dataset-id-range-layout';

export const MAX_ID_WIDTH = 4;
export const KEYBOARD_ZOOM_FACTOR = 1.5;
export const PAGE_PAN_FRACTION = 0.9;

export interface DatasetIdRangeCamera {
  /** Horizontal center in normalized world coordinates. */
  center: number;
  /** Horizontal magnification where 1 shows the complete bar. */
  scale: number;
}

export interface DatasetIdRangeCameraLimits {
  maxScale: number;
  minScale: number;
}

export const FIT_DATASET_ID_CAMERA: DatasetIdRangeCamera = { center: 0.5, scale: 1 };

export const createDatasetIdRangeCameraLimits = (
  _source: DatasetIdProfile | DatasetIdRangeModel,
  layout: DatasetIdRangeLayout,
): DatasetIdRangeCameraLimits => {
  const activeSegments = layout.segments.filter(
    (segment) => segment.state === 'occupied' || segment.state === 'hole',
  );
  const activeWidth = activeSegments.reduce((sum, segment) => sum + segment.width, 0);
  const activeIdCount = activeSegments.reduce((sum, segment) => sum + segment.count, 0);
  if (!activeIdCount) return { minScale: 1, maxScale: 1 };
  const maxScale = activeWidth > 0 ? Math.max(1, (activeIdCount * MAX_ID_WIDTH) / activeWidth) : 1;
  return { minScale: 1, maxScale };
};

export const clampDatasetIdRangeCamera = (
  camera: DatasetIdRangeCamera,
  limits: DatasetIdRangeCameraLimits,
): DatasetIdRangeCamera => {
  const scale = Math.min(limits.maxScale, Math.max(limits.minScale, camera.scale));
  const halfVisibleWorld = 1 / (scale * 2);
  const center = Math.min(1 - halfVisibleWorld, Math.max(halfVisibleWorld, camera.center));
  return { center, scale };
};

export const datasetIdWorldOffset = (camera: DatasetIdRangeCamera, width: number): number =>
  camera.center * width - width / (camera.scale * 2);

export const datasetIdWorldToScreen = (
  worldX: number,
  camera: DatasetIdRangeCamera,
  width: number,
): number => (worldX - datasetIdWorldOffset(camera, width)) * camera.scale;

export const datasetIdScreenToWorld = (
  screenX: number,
  camera: DatasetIdRangeCamera,
  width: number,
): number => datasetIdWorldOffset(camera, width) + screenX / camera.scale;

export const zoomDatasetIdRangeCameraAt = (
  camera: DatasetIdRangeCamera,
  targetScale: number,
  screenX: number,
  width: number,
  limits: DatasetIdRangeCameraLimits,
): DatasetIdRangeCamera => {
  const scale = Math.min(limits.maxScale, Math.max(limits.minScale, targetScale));
  const anchorWorld = datasetIdScreenToWorld(screenX, camera, width);
  const center = (anchorWorld - screenX / scale + width / (scale * 2)) / width;
  return clampDatasetIdRangeCamera({ center, scale }, limits);
};

/** Positive screen distance moves the visible window towards the end of the world. */
export const panDatasetIdRangeCamera = (
  camera: DatasetIdRangeCamera,
  screenDistance: number,
  width: number,
  limits: DatasetIdRangeCameraLimits,
): DatasetIdRangeCamera =>
  clampDatasetIdRangeCamera(
    { ...camera, center: camera.center + screenDistance / camera.scale / width },
    limits,
  );

export const segmentAtScreenPosition = (
  layout: DatasetIdRangeLayout,
  camera: DatasetIdRangeCamera,
  width: number,
  screenX: number,
): number | undefined => {
  const worldX = datasetIdScreenToWorld(screenX, camera, width);
  const index = layout.segments.findIndex(
    (segment, segmentIndex) =>
      worldX >= segment.x &&
      (worldX < segment.x + segment.width ||
        (segmentIndex === layout.segments.length - 1 && worldX <= segment.x + segment.width)),
  );
  return index < 0 ? undefined : index;
};

export const revealDatasetIdRangeSegment = (
  camera: DatasetIdRangeCamera,
  segment: DatasetIdLayoutSegment,
  width: number,
  limits: DatasetIdRangeCameraLimits,
): DatasetIdRangeCamera => {
  const left = datasetIdWorldToScreen(segment.x, camera, width);
  const right = datasetIdWorldToScreen(segment.x + segment.width, camera, width);
  if (left >= 0 && right <= width) return camera;
  const segmentCenter = segment.x + segment.width / 2;
  return clampDatasetIdRangeCamera({ ...camera, center: segmentCenter / width }, limits);
};

export const segmentTooltipPosition = (
  segment: DatasetIdLayoutSegment,
  camera: DatasetIdRangeCamera,
  width: number,
  tooltipWidth: number,
  margin: number,
): number => {
  const left = Math.max(0, datasetIdWorldToScreen(segment.x, camera, width));
  const right = Math.min(width, datasetIdWorldToScreen(segment.x + segment.width, camera, width));
  const segmentCenter = left + Math.max(0, right - left) / 2;
  const safeMargin = Math.max(0, Math.min(margin, width / 2));
  const renderedTooltipWidth = Math.min(Math.max(0, tooltipWidth), width - safeMargin * 2);
  const minimum = safeMargin + renderedTooltipWidth / 2;
  const maximum = width - minimum;
  return Math.min(maximum, Math.max(minimum, segmentCenter));
};
