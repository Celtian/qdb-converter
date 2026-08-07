import { datasetIdWorldToScreen } from './dataset-id-range-camera';
import { type DatasetIdRangeModel, createDatasetIdRangeLayout } from './dataset-id-range-layout';
import {
  BAR_HEIGHT,
  BAR_Y,
  type DatasetIdRangeColors,
  type DatasetIdRangeView,
} from './playername-id-range-renderer';

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
    context.fillStyle = colors.surface;
    context.fillRect(0, BAR_Y, this.width, BAR_HEIGHT);

    for (const segment of layout.segments) {
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
      context.fillRect(x, BAR_Y, endX - x, BAR_HEIGHT);
    }

    const worldLeft = datasetIdWorldToScreen(0, view.camera, this.width);
    const worldRight = datasetIdWorldToScreen(this.width, view.camera, this.width);
    context.strokeStyle = colors.outline;
    context.lineWidth = 1;
    context.strokeRect(worldLeft + 0.5, BAR_Y + 0.5, worldRight - worldLeft - 1, BAR_HEIGHT - 1);
    const active =
      view.activeSegment === undefined ? undefined : layout.segments[view.activeSegment];
    if (active) {
      const x = datasetIdWorldToScreen(active.x, view.camera, this.width);
      const endX = datasetIdWorldToScreen(active.x + active.width, view.camera, this.width);
      context.strokeStyle = colors.outline;
      context.lineWidth = 2;
      context.strokeRect(x, BAR_Y - 3, endX - x, BAR_HEIGHT + 6);
    }
  }

  destroy(): void {
    this.context.setTransform(1, 0, 0, 1, 0, 0);
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.canvas.remove();
  }
}
