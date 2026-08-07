import { datasetIdWorldToScreen } from './dataset-id-range-camera';
import {
  type DatasetIdRangeModel,
  createDatasetIdRangeLayout,
  datasetIdLaneGeometry,
} from './dataset-id-range-layout';
import { type DatasetIdRangeColors, type DatasetIdRangeView } from './playername-id-range-renderer';

/** Browser-native compatibility renderer for software-only Electron systems. */
export class DatasetIdRangeCanvasRenderer {
  private readonly context: CanvasRenderingContext2D;
  private width = 1;
  private height = 1;
  private resolution = 1;

  constructor(readonly canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D is unavailable.');
    this.context = context;
  }

  resize(width: number, height: number, resolution: number): void {
    this.width = Math.max(1, Math.round(width));
    this.height = Math.max(1, Math.round(height));
    this.resolution = Math.max(1, resolution);
    this.canvas.width = Math.max(1, Math.round(this.width * this.resolution));
    this.canvas.height = Math.max(1, Math.round(this.height * this.resolution));
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
  }

  render(model: DatasetIdRangeModel, colors: DatasetIdRangeColors, view: DatasetIdRangeView): void {
    const context = this.context;
    const layout = createDatasetIdRangeLayout(model, this.width);
    context.setTransform(this.resolution, 0, 0, this.resolution, 0, 0);
    context.clearRect(0, 0, this.width, this.height);
    for (const [laneIndex, lane] of layout.lanes.entries()) {
      const geometry = datasetIdLaneGeometry(laneIndex, layout.lanes.length);
      const laneX = datasetIdWorldToScreen(lane.x, view.camera, this.width);
      const laneEndX = datasetIdWorldToScreen(lane.x + lane.width, view.camera, this.width);
      context.fillStyle = colors.surface;
      context.fillRect(laneX, geometry.y, laneEndX - laneX, geometry.height);
      const orderedSegments = [...lane.segments].sort(
        (left, right) =>
          Number(left.state.includes('range')) - Number(right.state.includes('range')),
      );
      for (const segment of orderedSegments) {
        context.fillStyle =
          segment.state === 'occupied'
            ? colors.occupied
            : segment.state === 'hole'
              ? colors.holes
              : segment.state === 'capacity'
                ? colors.capacity
                : colors.outOfRange;
        const x = datasetIdWorldToScreen(segment.x, view.camera, this.width);
        const endX = datasetIdWorldToScreen(segment.x + segment.width, view.camera, this.width);
        context.fillRect(x, geometry.y, endX - x, geometry.height);
      }
      context.strokeStyle = colors.outline;
      context.lineWidth = 1;
      context.strokeRect(laneX + 0.5, geometry.y + 0.5, laneEndX - laneX - 1, geometry.height - 1);
    }

    const selection = view.activeSelection;
    const active = selection
      ? layout.lanes[selection.lane]?.segments[selection.segment]
      : undefined;
    if (active && selection) {
      const geometry = datasetIdLaneGeometry(selection.lane, layout.lanes.length);
      const x = datasetIdWorldToScreen(active.x, view.camera, this.width);
      const endX = datasetIdWorldToScreen(active.x + active.width, view.camera, this.width);
      context.strokeStyle = colors.outline;
      context.lineWidth = 2;
      context.strokeRect(x, geometry.y - 3, endX - x, geometry.height + 6);
    }
  }

  destroy(): void {
    this.context.setTransform(1, 0, 0, 1, 0, 0);
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.canvas.remove();
  }
}
