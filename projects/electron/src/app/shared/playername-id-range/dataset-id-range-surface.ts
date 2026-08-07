import type { Application } from 'pixi.js';

import { panDatasetIdRangeCamera, zoomDatasetIdRangeCameraAt } from './dataset-id-range-camera';
import { DatasetIdRangeCanvasRenderer } from './dataset-id-range-canvas-renderer';
import type { DatasetIdRangeModel } from './dataset-id-range-layout';
import {
  type DatasetIdRangeColors,
  DatasetIdRangeRenderer,
  type DatasetIdRangeView,
  type PixiModule,
  type PixiViewportModule,
} from './playername-id-range-renderer';

type RendererPreference = 'webgl' | 'canvas';

interface InitializedRenderer {
  application: Application;
  renderer: DatasetIdRangeRenderer;
  preference: RendererPreference;
}

interface DatasetIdRangeSurfaceOptions {
  cameraChanged: (camera: DatasetIdRangeView['camera']) => void;
  colors: () => DatasetIdRangeColors;
  draggingChanged: (dragging: boolean) => void;
  failed: () => void;
  model: () => DatasetIdRangeModel;
  view: () => DatasetIdRangeView;
}

interface PointerPosition {
  startX: number;
  startY: number;
  x: number;
  y: number;
}

interface PinchStart {
  camera: DatasetIdRangeView['camera'];
  distance: number;
  midpointX: number;
}

/** Owns the lazy Pixi viewport → native Canvas renderer fallback lifecycle. */
export class DatasetIdRangeSurface {
  private application?: Application;
  private renderer?: DatasetIdRangeRenderer;
  private canvasRenderer?: DatasetIdRangeCanvasRenderer;
  private rendererPreference?: RendererPreference;
  private recoveryPending = false;
  private destroyed = false;
  private width = 1;
  private height = 1;
  private resolution = 1;
  private readonly pointers = new Map<number, PointerPosition>();
  private pinchStart?: PinchStart;
  private dragging = false;

  constructor(
    private readonly host: HTMLElement,
    private readonly options: DatasetIdRangeSurfaceOptions,
  ) {}

  async initialize(width: number, height: number, resolution: number): Promise<void> {
    this.setSize(width, height, resolution);
    try {
      const [pixi, pixiViewport] = await Promise.all([import('pixi.js'), import('pixi-viewport')]);
      const initialized =
        (await this.initializePixi(pixi, pixiViewport, 'webgl')) ??
        (await this.initializePixi(pixi, pixiViewport, 'canvas'));
      if (initialized && !this.destroyed) {
        this.installPixi(initialized);
        return;
      }
      if (initialized) this.destroyInitialized(initialized);
    } catch {
      // Native Canvas 2D below does not depend on Pixi loading.
    }
    if (!this.destroyed && this.installNativeCanvas()) return;
    this.options.failed();
  }

  render(): void {
    if (this.canvasRenderer) {
      try {
        this.canvasRenderer.render(
          this.options.model(),
          this.options.colors(),
          this.options.view(),
        );
      } catch {
        this.options.failed();
      }
      return;
    }
    if (!this.renderer || !this.application) return;
    try {
      this.renderer.render(this.options.model(), this.options.colors(), this.options.view());
    } catch {
      if (this.rendererPreference === 'webgl' && !this.recoveryPending)
        void this.recoverWithPixiCanvas();
      else if (this.rendererPreference === 'canvas' && !this.recoveryPending)
        this.recoverWithNativeCanvas();
      else this.options.failed();
    }
  }

  resize(width: number, height: number, resolution: number): void {
    this.setSize(width, height, resolution);
    this.application?.renderer.resize(this.width, this.height);
    this.renderer?.resize(this.width, this.height);
    this.canvasRenderer?.resize(this.width, this.height, this.resolution);
    this.render();
  }

  beginPointer(pointerId: number, x: number, y: number): boolean {
    if (!this.canvasRenderer) return false;
    this.pointers.set(pointerId, { startX: x, startY: y, x, y });
    if (this.pointers.size === 2) this.capturePinchStart();
    return true;
  }

  movePointer(pointerId: number, x: number, y: number): boolean {
    if (!this.canvasRenderer) return false;
    const pointer = this.pointers.get(pointerId);
    if (!pointer) return false;
    const previousX = pointer.x;
    pointer.x = x;
    pointer.y = y;

    if (this.pointers.size >= 2 && this.pinchStart) {
      const [first, second] = [...this.pointers.values()];
      if (!first || !second) return true;
      const distance = Math.max(1, Math.hypot(second.x - first.x, second.y - first.y));
      const midpointX = (first.x + second.x) / 2;
      const view = this.options.view();
      const zoomed = zoomDatasetIdRangeCameraAt(
        this.pinchStart.camera,
        this.pinchStart.camera.scale * (distance / this.pinchStart.distance),
        this.pinchStart.midpointX,
        this.width,
        view.limits,
      );
      this.setDragging(true);
      this.options.cameraChanged(
        panDatasetIdRangeCamera(
          zoomed,
          this.pinchStart.midpointX - midpointX,
          this.width,
          view.limits,
        ),
      );
      return true;
    }

    if (!this.dragging && Math.hypot(x - pointer.startX, y - pointer.startY) >= 5)
      this.setDragging(true);
    if (this.dragging) {
      const view = this.options.view();
      this.options.cameraChanged(
        panDatasetIdRangeCamera(view.camera, previousX - x, this.width, view.limits),
      );
    }
    return true;
  }

  endPointer(pointerId: number): boolean {
    if (!this.canvasRenderer) return false;
    this.pointers.delete(pointerId);
    this.pinchStart = undefined;
    if (this.pointers.size === 1) {
      const remaining = [...this.pointers.values()][0]!;
      remaining.startX = remaining.x;
      remaining.startY = remaining.y;
    } else if (!this.pointers.size) {
      this.setDragging(false);
    }
    return true;
  }

  destroy(): void {
    this.destroyed = true;
    this.pointers.clear();
    this.setDragging(false);
    this.destroyRenderer();
  }

  private async initializePixi(
    pixi: PixiModule,
    pixiViewport: PixiViewportModule,
    preference: RendererPreference,
  ): Promise<InitializedRenderer | undefined> {
    const application = new pixi.Application();
    let renderer: DatasetIdRangeRenderer | undefined;
    try {
      await application.init({
        width: this.width,
        height: this.height,
        antialias: true,
        autoDensity: true,
        backgroundAlpha: 0,
        preference,
        resolution: this.resolution,
      });
      if (this.destroyed) {
        this.destroyApplication(application);
        return undefined;
      }
      renderer = new DatasetIdRangeRenderer(
        application,
        pixi,
        pixiViewport,
        this.width,
        this.height,
        {
          cameraChanged: this.options.cameraChanged,
          draggingChanged: this.options.draggingChanged,
        },
      );
      renderer.render(this.options.model(), this.options.colors(), this.options.view());
      return { application, renderer, preference };
    } catch {
      renderer?.destroy();
      this.destroyApplication(application);
      return undefined;
    }
  }

  private installPixi(initialized: InitializedRenderer): void {
    const { application, renderer, preference } = initialized;
    this.prepareCanvas(application.canvas);
    this.host.replaceChildren(application.canvas);
    this.application = application;
    this.renderer = renderer;
    this.rendererPreference = preference;
  }

  private installNativeCanvas(): boolean {
    let renderer: DatasetIdRangeCanvasRenderer | undefined;
    try {
      const canvas = document.createElement('canvas');
      renderer = new DatasetIdRangeCanvasRenderer(canvas);
      renderer.resize(this.width, this.height, this.resolution);
      renderer.render(this.options.model(), this.options.colors(), this.options.view());
      if (this.destroyed) {
        renderer.destroy();
        return false;
      }
      this.prepareCanvas(canvas);
      this.host.replaceChildren(canvas);
      this.canvasRenderer = renderer;
      return true;
    } catch {
      renderer?.destroy();
      return false;
    }
  }

  private async recoverWithPixiCanvas(): Promise<void> {
    if (this.recoveryPending || this.destroyed) return;
    this.recoveryPending = true;
    this.destroyRenderer();
    try {
      const [pixi, pixiViewport] = await Promise.all([import('pixi.js'), import('pixi-viewport')]);
      const initialized = await this.initializePixi(pixi, pixiViewport, 'canvas');
      if (!initialized || this.destroyed) {
        if (initialized) this.destroyInitialized(initialized);
        if (!this.destroyed && this.installNativeCanvas()) return;
        this.options.failed();
        return;
      }
      this.installPixi(initialized);
    } catch {
      if (!this.destroyed && this.installNativeCanvas()) return;
      this.options.failed();
    } finally {
      this.recoveryPending = false;
    }
  }

  private recoverWithNativeCanvas(): void {
    if (this.recoveryPending || this.destroyed) return;
    this.recoveryPending = true;
    this.destroyRenderer();
    if (!this.installNativeCanvas()) this.options.failed();
    this.recoveryPending = false;
  }

  private capturePinchStart(): void {
    const [first, second] = [...this.pointers.values()];
    if (!first || !second) return;
    this.pinchStart = {
      camera: this.options.view().camera,
      distance: Math.max(1, Math.hypot(second.x - first.x, second.y - first.y)),
      midpointX: (first.x + second.x) / 2,
    };
  }

  private setDragging(dragging: boolean): void {
    if (dragging === this.dragging) return;
    this.dragging = dragging;
    this.options.draggingChanged(dragging);
  }

  private prepareCanvas(canvas: HTMLCanvasElement): void {
    canvas.setAttribute('aria-hidden', 'true');
    canvas.setAttribute('role', 'presentation');
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
  }

  private setSize(width: number, height: number, resolution: number): void {
    this.width = Math.max(1, Math.round(width));
    this.height = Math.max(1, Math.round(height));
    this.resolution = Math.max(1, resolution);
  }

  private destroyRenderer(): void {
    this.renderer?.destroy();
    this.canvasRenderer?.destroy();
    if (this.application) this.destroyApplication(this.application);
    this.renderer = undefined;
    this.canvasRenderer = undefined;
    this.application = undefined;
    this.rendererPreference = undefined;
  }

  private destroyInitialized(initialized: InitializedRenderer): void {
    initialized.renderer.destroy();
    this.destroyApplication(initialized.application);
  }

  private destroyApplication(application: Application): void {
    try {
      application.destroy({ removeView: true }, { children: true });
    } catch {
      // Pixi can be only partially initialized when a renderer is unavailable.
    }
  }
}
