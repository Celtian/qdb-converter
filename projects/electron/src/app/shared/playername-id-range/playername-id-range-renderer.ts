import type { Viewport } from 'pixi-viewport';
import type { Application, EventSystem, Graphics } from 'pixi.js';

import {
  type DatasetIdRangeCamera,
  type DatasetIdRangeCameraLimits,
  clampDatasetIdRangeCamera,
  datasetIdWorldOffset,
} from './dataset-id-range-camera';
import { type DatasetIdRangeModel, createDatasetIdRangeLayout } from './dataset-id-range-layout';

export const BAR_Y = 18;
export const BAR_HEIGHT = 52;

export type PixiModule = typeof import('pixi.js');
export type PixiViewportModule = typeof import('pixi-viewport');

export interface DatasetIdRangeColors {
  capacity: string;
  holes: string;
  occupied: string;
  outOfRange: string;
  outline: string;
  surface: string;
}

export interface DatasetIdRangeView {
  activeSegment?: number;
  camera: DatasetIdRangeCamera;
  limits: DatasetIdRangeCameraLimits;
}

interface DatasetIdRangeRendererCallbacks {
  cameraChanged: (camera: DatasetIdRangeCamera) => void;
  draggingChanged: (dragging: boolean) => void;
}

export class DatasetIdRangeRenderer {
  private readonly graphics: Graphics;
  private readonly viewport: Viewport;
  private limits: DatasetIdRangeCameraLimits = { minScale: 1, maxScale: 1 };
  private width: number;

  constructor(
    private readonly application: Application,
    pixi: PixiModule,
    pixiViewport: PixiViewportModule,
    width: number,
    height: number,
    private readonly callbacks: DatasetIdRangeRendererCallbacks,
  ) {
    this.width = width;
    this.graphics = new pixi.Graphics();
    this.viewport = new pixiViewport.Viewport({
      events: (
        this.application.renderer as typeof this.application.renderer & { events: EventSystem }
      ).events,
      passiveWheel: false,
      screenHeight: height,
      screenWidth: width,
      worldHeight: height,
      worldWidth: width,
    });
    this.viewport.addChild(this.graphics);
    this.application.stage.addChild(this.viewport);
    this.viewport
      .drag({ direction: 'x', wheel: false, underflow: 'center' })
      .pinch({ axis: 'x' })
      .wheel({
        axis: 'x',
        keyToPress: ['ControlLeft', 'ControlRight', 'MetaLeft', 'MetaRight'],
        smooth: false,
        trackpadPinch: true,
      })
      .clampZoom({ minScale: { x: 1, y: 1 }, maxScale: { x: 1, y: 1 } })
      .clamp({ direction: 'x', underflow: 'center' });
    this.viewport.on('moved', this.handleViewportChange);
    this.viewport.on('drag-start', this.handleDragStart);
    this.viewport.on('drag-end', this.handleDragEnd);
    this.viewport.on('pinch-start', this.handleDragStart);
    this.viewport.on('pinch-end', this.handleDragEnd);
  }

  render(model: DatasetIdRangeModel, colors: DatasetIdRangeColors, view: DatasetIdRangeView): void {
    const layout = createDatasetIdRangeLayout(model, this.width);
    this.configureLimits(view.limits);
    this.applyCamera(view.camera);
    this.graphics.clear();
    this.graphics.roundRect(0, BAR_Y, this.width, BAR_HEIGHT, 4).fill(colors.surface);

    for (const segment of layout.segments) {
      const color =
        segment.state === 'occupied'
          ? colors.occupied
          : segment.state === 'hole'
            ? colors.holes
            : segment.state === 'capacity'
              ? colors.capacity
              : colors.outOfRange;
      this.graphics.rect(segment.x, BAR_Y, segment.width, BAR_HEIGHT).fill(color);
    }

    this.graphics
      .roundRect(0, BAR_Y, this.width, BAR_HEIGHT, 4)
      .stroke({ color: colors.outline, width: 1 / view.camera.scale });
    const active =
      view.activeSegment === undefined ? undefined : layout.segments[view.activeSegment];
    if (active)
      this.graphics
        .rect(active.x, BAR_Y - 3, active.width, BAR_HEIGHT + 6)
        .stroke({ color: colors.outline, width: 2 / view.camera.scale });
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.viewport.resize(width, height, width, height);
  }

  destroy(): void {
    this.viewport.off('moved', this.handleViewportChange);
    this.viewport.off('drag-start', this.handleDragStart);
    this.viewport.off('drag-end', this.handleDragEnd);
    this.viewport.off('pinch-start', this.handleDragStart);
    this.viewport.off('pinch-end', this.handleDragEnd);
    this.application.stage.removeChild(this.viewport);
    this.viewport.removeChild(this.graphics);
    this.graphics.destroy();
    this.viewport.destroy({ children: false });
  }

  private configureLimits(limits: DatasetIdRangeCameraLimits): void {
    if (this.limits.minScale === limits.minScale && this.limits.maxScale === limits.maxScale)
      return;
    this.limits = limits;
    this.viewport.plugins.remove('clamp-zoom');
    this.viewport.clampZoom({
      minScale: { x: limits.minScale, y: 1 },
      maxScale: { x: limits.maxScale, y: 1 },
    });
  }

  private applyCamera(camera: DatasetIdRangeCamera): void {
    const normalized = clampDatasetIdRangeCamera(camera, this.limits);
    this.viewport.scale.x = normalized.scale;
    this.viewport.scale.y = 1;
    this.viewport.x = -datasetIdWorldOffset(normalized, this.width) * normalized.scale;
    this.viewport.y = 0;
  }

  private readonly handleViewportChange = (): void => {
    const scale = this.viewport.scale.x;
    const offset = -this.viewport.x / scale;
    const camera = clampDatasetIdRangeCamera(
      { center: (offset + this.width / (scale * 2)) / this.width, scale },
      this.limits,
    );
    this.applyCamera(camera);
    this.callbacks.cameraChanged(camera);
  };

  private readonly handleDragStart = (): void => this.callbacks.draggingChanged(true);
  private readonly handleDragEnd = (): void => this.callbacks.draggingChanged(false);
}
