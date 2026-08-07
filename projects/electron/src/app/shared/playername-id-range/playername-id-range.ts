import { DecimalPipe } from '@angular/common';
import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  afterRenderEffect,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';

import type { DatasetIdProfile } from '../../../../shared/contracts';
import { Theme } from '../../core/theme';
import {
  type DatasetIdRangeCamera,
  FIT_DATASET_ID_CAMERA,
  KEYBOARD_ZOOM_FACTOR,
  PAGE_PAN_FRACTION,
  clampDatasetIdRangeCamera,
  createDatasetIdRangeCameraLimits,
  panDatasetIdRangeCamera,
  revealDatasetIdRangeSegment,
  segmentAtScreenPosition,
  segmentTooltipPosition,
  zoomDatasetIdRangeCameraAt,
} from './dataset-id-range-camera';
import {
  DATASET_ID_CANVAS_HEIGHT,
  type DatasetIdLayoutSegment,
  type DatasetIdRangeModel,
  type DatasetIdRangeSelection,
  createDatasetIdRangeLayout,
  createDatasetIdRangeModel,
  datasetIdLaneGeometry,
  laneAtCanvasPosition,
  selectionInAdjacentLane,
} from './dataset-id-range-layout';
import { DatasetIdRangeSurface } from './dataset-id-range-surface';
import type { DatasetIdRangeColors, DatasetIdRangeView } from './playername-id-range-renderer';

const FALLBACK_CANVAS_WIDTH = 640;
const TOOLTIP_GAP = 8;
const TOOLTIP_MARGIN = 8;
const EMPTY_RANGE_MODEL: DatasetIdRangeModel = {
  exact: false,
  lanes: [],
  ranges: [],
  breakdowns: [],
  occupiedCount: 0,
  holeCount: 0,
  capacityCount: 0,
  outOfRangeCount: 0,
};

@Component({
  selector: 'app-dataset-id-range',
  imports: [DecimalPipe],
  templateUrl: './playername-id-range.html',
  styleUrl: './playername-id-range.css',
  host: { class: 'block' },
})
export class DatasetIdRange {
  private readonly destroyRef = inject(DestroyRef);
  private readonly theme = inject(Theme);
  private readonly canvasHost = viewChild<ElementRef<HTMLDivElement>>('canvasHost');
  private readonly tooltip = viewChild<ElementRef<HTMLDivElement>>('tooltip');
  readonly profile = input<DatasetIdProfile>();
  readonly rangeModel = input<DatasetIdRangeModel>();
  readonly label = input.required<string>();

  protected readonly rendererFailed = signal(false);
  protected readonly activeSelection = signal<DatasetIdRangeSelection | undefined>(undefined);
  protected readonly camera = signal<DatasetIdRangeCamera>(FIT_DATASET_ID_CAMERA);
  protected readonly dragging = signal(false);
  protected readonly tooltipWidth = signal(0);
  protected readonly viewportWidth = signal(FALLBACK_CANVAS_WIDTH);
  protected readonly tooltipTop = computed(
    () => datasetIdLaneGeometry(0, this.model().lanes.length).y - TOOLTIP_GAP,
  );
  protected readonly model = computed(() => {
    const rangeModel = this.rangeModel();
    if (rangeModel) return rangeModel;
    const profile = this.profile();
    return profile ? createDatasetIdRangeModel(profile) : EMPTY_RANGE_MODEL;
  });
  protected readonly hasExactIds = computed(() => this.model().exact);
  protected readonly layout = computed(() =>
    createDatasetIdRangeLayout(this.model(), this.viewportWidth()),
  );
  protected readonly cameraLimits = computed(() =>
    createDatasetIdRangeCameraLimits(this.model(), this.layout()),
  );
  protected readonly view = computed<DatasetIdRangeView>(() => ({
    activeSelection: this.activeSelection(),
    camera: this.camera(),
    limits: this.cameraLimits(),
  }));
  protected readonly activeDescription = computed(() =>
    this.descriptionFor(this.selectedSegment()),
  );
  protected readonly tooltipPosition = computed(() => {
    const segment = this.selectedSegment();
    return segment
      ? segmentTooltipPosition(
          segment,
          this.camera(),
          this.viewportWidth(),
          this.tooltipWidth(),
          TOOLTIP_MARGIN,
        )
      : this.viewportWidth() / 2;
  });
  protected readonly statusId = computed(
    () =>
      `dataset-id-range-${this.label()
        .toLocaleLowerCase('en')
        .replaceAll(/[^a-z0-9]+/g, '-')}`,
  );
  protected readonly summary = computed(() => {
    const model = this.model();
    const ranges = model.ranges
      .map(
        (range) =>
          `${range.label ? `${range.label} ` : ''}${range.min.toLocaleString('en-US')} to ${range.max.toLocaleString('en-US')}`,
      )
      .join('; ');
    return `${this.label()}: ${model.occupiedCount} occupied IDs, ${model.holeCount} holes, ${model.capacityCount} free IDs, and ${model.outOfRangeCount} out-of-range IDs. Published ${model.ranges.length === 1 ? 'range' : 'ranges'} ${ranges}. Drag horizontally to pan, pinch or use Control or Command plus wheel to zoom.`;
  });

  private surface?: DatasetIdRangeSurface;
  private resizeObserver?: ResizeObserver;
  private mediaQuery?: MediaQueryList;
  private destroyed = false;
  private wheelHost?: HTMLElement;

  constructor() {
    afterNextRender({ write: () => void this.initialize() });
    afterRenderEffect({
      read: (onCleanup) => {
        const tooltip = this.tooltip()?.nativeElement;
        if (!tooltip) {
          this.tooltipWidth.set(0);
          return;
        }
        const updateWidth = (): void => {
          const width = tooltip.getBoundingClientRect().width || tooltip.offsetWidth;
          if (width !== this.tooltipWidth()) this.tooltipWidth.set(width);
        };
        updateWidth();
        if (typeof ResizeObserver === 'undefined') return;
        const observer = new ResizeObserver(updateWidth);
        observer.observe(tooltip);
        onCleanup(() => observer.disconnect());
      },
    });
    effect(() => {
      this.model();
      this.view();
      this.theme.preference();
      this.render();
    });
    this.destroyRef.onDestroy(() => this.destroy());
  }

  protected inspectPointer(event: PointerEvent): void {
    const position = this.eventPosition(event);
    if (!position) return;
    const handled = this.surface?.movePointer(event.pointerId, position.x, position.y) ?? false;
    if (handled && this.dragging()) {
      this.activeSelection.set(undefined);
      return;
    }
    if (!this.dragging()) {
      const lane = laneAtCanvasPosition(this.layout().lanes.length, position.y);
      const segment =
        lane === undefined
          ? undefined
          : segmentAtScreenPosition(
              this.layout(),
              this.camera(),
              this.viewportWidth(),
              position.x,
              lane,
            );
      this.activeSelection.set(
        lane === undefined || segment === undefined ? undefined : { lane, segment },
      );
    }
  }

  protected clearPointer(): void {
    if (!this.dragging()) this.activeSelection.set(undefined);
  }

  protected beginPointer(event: PointerEvent): void {
    const position = this.eventPosition(event);
    if (!position || !this.surface?.beginPointer(event.pointerId, position.x, position.y)) return;
    this.canvasHost()?.nativeElement.setPointerCapture?.(event.pointerId);
  }

  protected endPointer(event: PointerEvent): void {
    if (!this.surface?.endPointer(event.pointerId)) return;
    const host = this.canvasHost()?.nativeElement;
    if (host?.hasPointerCapture?.(event.pointerId)) host.releasePointerCapture(event.pointerId);
  }

  protected resetCamera(): void {
    this.camera.set(FIT_DATASET_ID_CAMERA);
  }

  protected inspectKeyboard(event: KeyboardEvent): void {
    const layout = this.layout();
    const firstLane = layout.lanes.findIndex((lane) => lane.segments.length);
    if (firstLane < 0) return;
    const current = this.validSelection() ?? { lane: firstLane, segment: 0 };
    let next: DatasetIdRangeSelection;
    switch (event.key) {
      case 'ArrowLeft':
        next = { ...current, segment: Math.max(0, current.segment - 1) };
        break;
      case 'ArrowRight':
        next = {
          ...current,
          segment: Math.min(
            layout.lanes[current.lane]!.segments.length - 1,
            current.segment + (this.activeSelection() ? 1 : 0),
          ),
        };
        break;
      case 'ArrowUp':
        next = selectionInAdjacentLane(layout, current, -1);
        break;
      case 'ArrowDown':
        next = selectionInAdjacentLane(layout, current, 1);
        break;
      case 'Home':
        next = { ...current, segment: 0 };
        break;
      case 'End':
        next = { ...current, segment: layout.lanes[current.lane]!.segments.length - 1 };
        break;
      case 'PageUp':
        event.preventDefault();
        this.panByViewport(-PAGE_PAN_FRACTION);
        return;
      case 'PageDown':
        event.preventDefault();
        this.panByViewport(PAGE_PAN_FRACTION);
        return;
      case '+':
      case '=':
        event.preventDefault();
        this.zoomAtCenter(KEYBOARD_ZOOM_FACTOR);
        return;
      case '-':
        event.preventDefault();
        this.zoomAtCenter(1 / KEYBOARD_ZOOM_FACTOR);
        return;
      case '0':
        event.preventDefault();
        this.resetCamera();
        return;
      default:
        return;
    }
    event.preventDefault();
    this.activeSelection.set(next);
    const segment = layout.lanes[next.lane]?.segments[next.segment];
    if (segment)
      this.camera.set(
        revealDatasetIdRangeSegment(
          this.camera(),
          segment,
          this.viewportWidth(),
          this.cameraLimits(),
        ),
      );
  }

  private async initialize(): Promise<void> {
    const host = this.canvasHost()?.nativeElement;
    if (!host || !this.hasExactIds()) return;
    const size = this.canvasSize(host);
    this.viewportWidth.set(size.width);
    this.rendererFailed.set(false);
    this.surface = new DatasetIdRangeSurface(host, {
      cameraChanged: (camera) => this.camera.set(camera),
      colors: () => this.colors(),
      draggingChanged: (dragging) => {
        this.dragging.set(dragging);
        if (dragging) this.activeSelection.set(undefined);
      },
      failed: () => this.rendererFailed.set(true),
      model: () => this.model(),
      view: () => this.view(),
    });
    await this.surface.initialize(size.width, size.height, this.pixelDensity());
    if (this.destroyed) return;
    this.wheelHost = host;
    host.addEventListener('wheel', this.handleWheel, { capture: true, passive: false });
    this.watchSize(host);
    this.watchSystemTheme();
  }

  private render(): void {
    if (this.hasExactIds()) this.surface?.render();
  }

  private canvasSize(host: HTMLElement): { width: number; height: number } {
    const bounds = host.getBoundingClientRect();
    return {
      width: Math.max(1, Math.round(host.clientWidth || bounds.width || FALLBACK_CANVAS_WIDTH)),
      height: Math.max(
        1,
        Math.round(host.clientHeight || bounds.height || DATASET_ID_CANVAS_HEIGHT),
      ),
    };
  }

  private pixelDensity(): number {
    return Math.min(globalThis.devicePixelRatio || 1, 2);
  }

  private colors(): DatasetIdRangeColors {
    const host = this.canvasHost()?.nativeElement;
    if (!host)
      return {
        occupied: '#2e7d32',
        holes: '#f9a825',
        capacity: '#dfe3e7',
        outOfRange: '#ba1a1a',
        outline: '#1a1c1e',
        surface: '#eef1f5',
      };
    const probe = document.createElement('span');
    probe.hidden = true;
    host.appendChild(probe);
    const color = (name: string, fallback: string): string => {
      probe.style.color = `var(${name}, ${fallback})`;
      return getComputedStyle(probe).color || fallback;
    };
    const colors = {
      occupied: color('--dataset-id-occupied-color', '#2e7d32'),
      holes: color('--dataset-id-hole-color', '#f9a825'),
      capacity: color('--dataset-id-capacity-color', '#dfe3e7'),
      outOfRange: color('--dataset-id-out-of-range-color', '#ba1a1a'),
      outline: color('--mat-sys-on-surface', '#1a1c1e'),
      surface: color('--mat-sys-surface-container', '#eef1f5'),
    };
    probe.remove();
    return colors;
  }

  private descriptionFor(segment: DatasetIdLayoutSegment | undefined): string {
    if (!segment) {
      const camera = this.camera();
      if (camera.scale === 1)
        return 'Complete overview. Drag to pan; pinch or use Control or Command plus wheel to zoom. Arrow keys inspect table rows and contiguous ID ranges.';
      const halfVisible = 50 / camera.scale;
      const start = Math.max(0, camera.center * 100 - halfVisible).toFixed(1);
      const end = Math.min(100, camera.center * 100 + halfVisible).toFixed(1);
      return `${camera.scale.toFixed(1)}× zoom · showing ${start}–${end}% of the chart. Press 0 to reset.`;
    }
    const start = segment.startId.toLocaleString('en-US');
    const end = segment.endId.toLocaleString('en-US');
    const count = `${segment.count.toLocaleString('en-US')} ${segment.count === 1 ? 'ID' : 'IDs'}`;
    const source = segment.sourceLabels?.length ? `${segment.sourceLabels.join(' + ')} · ` : '';
    if (segment.state === 'below-range' || segment.state === 'above-range') {
      const side = segment.state === 'below-range' ? 'Below' : 'Above';
      const samples = segment.samples?.map((id) => id.toLocaleString('en-US')).join(', ');
      return `${source}${side} published range · ${count} · observed ${start}–${end}${samples ? ` · samples ${samples}` : ''}`;
    }
    const label =
      segment.state === 'occupied'
        ? 'Occupied'
        : segment.state === 'hole'
          ? 'Hole'
          : 'Free capacity';
    return `${source}${label} IDs ${start}–${end} · ${count}`;
  }

  private watchSize(host: HTMLElement): void {
    if (typeof ResizeObserver === 'undefined') return;
    this.resizeObserver?.disconnect();
    this.resizeObserver = new ResizeObserver(() => {
      const size = this.canvasSize(host);
      this.viewportWidth.set(size.width);
      this.camera.set(clampDatasetIdRangeCamera(this.camera(), this.cameraLimits()));
      this.surface?.resize(size.width, size.height, this.pixelDensity());
    });
    this.resizeObserver.observe(host);
  }

  private watchSystemTheme(): void {
    if (typeof matchMedia !== 'function') return;
    this.mediaQuery?.removeEventListener('change', this.handleSystemThemeChange);
    this.mediaQuery = matchMedia('(prefers-color-scheme: dark)');
    this.mediaQuery.addEventListener('change', this.handleSystemThemeChange);
  }

  private readonly handleSystemThemeChange = (): void => this.render();

  private readonly handleWheel = (event: WheelEvent): void => {
    const host = this.canvasHost()?.nativeElement;
    if (!host) return;
    const bounds = host.getBoundingClientRect();
    const displayWidth = bounds.width || this.viewportWidth();
    const screenX = ((event.clientX - bounds.left) / displayWidth) * this.viewportWidth();
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      event.stopPropagation();
      const delta = event.deltaMode ? event.deltaY * 20 : event.deltaY;
      const factor = Math.pow(2, -delta / 500);
      this.camera.set(
        zoomDatasetIdRangeCameraAt(
          this.camera(),
          this.camera().scale * factor,
          screenX,
          this.viewportWidth(),
          this.cameraLimits(),
        ),
      );
      return;
    }
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY) || event.deltaX === 0) return;
    event.preventDefault();
    event.stopPropagation();
    const delta = event.deltaMode ? event.deltaX * 20 : event.deltaX;
    this.camera.set(
      panDatasetIdRangeCamera(this.camera(), delta, this.viewportWidth(), this.cameraLimits()),
    );
  };

  private panByViewport(fraction: number): void {
    this.camera.set(
      panDatasetIdRangeCamera(
        this.camera(),
        this.viewportWidth() * fraction,
        this.viewportWidth(),
        this.cameraLimits(),
      ),
    );
  }

  private zoomAtCenter(factor: number): void {
    this.camera.set(
      zoomDatasetIdRangeCameraAt(
        this.camera(),
        this.camera().scale * factor,
        this.viewportWidth() / 2,
        this.viewportWidth(),
        this.cameraLimits(),
      ),
    );
  }

  private selectedSegment(): DatasetIdLayoutSegment | undefined {
    const selection = this.validSelection();
    return selection ? this.layout().lanes[selection.lane]?.segments[selection.segment] : undefined;
  }

  private validSelection(): DatasetIdRangeSelection | undefined {
    const selection = this.activeSelection();
    return selection && this.layout().lanes[selection.lane]?.segments[selection.segment]
      ? selection
      : undefined;
  }

  private eventPosition(event: PointerEvent): { x: number; y: number } | undefined {
    const host = this.canvasHost()?.nativeElement;
    if (!host) return undefined;
    const bounds = host.getBoundingClientRect();
    const displayWidth = bounds.width || this.viewportWidth();
    const displayHeight = bounds.height || DATASET_ID_CANVAS_HEIGHT;
    return {
      x: ((event.clientX - bounds.left) / displayWidth) * this.viewportWidth(),
      y: ((event.clientY - bounds.top) / displayHeight) * DATASET_ID_CANVAS_HEIGHT,
    };
  }

  private destroy(): void {
    this.destroyed = true;
    this.resizeObserver?.disconnect();
    this.mediaQuery?.removeEventListener('change', this.handleSystemThemeChange);
    this.wheelHost?.removeEventListener('wheel', this.handleWheel, { capture: true });
    this.surface?.destroy();
    this.surface = undefined;
  }
}
