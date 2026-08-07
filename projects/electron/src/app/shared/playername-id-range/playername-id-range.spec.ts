import { TestBed } from '@angular/core/testing';

import axe from 'axe-core';

import { Theme } from '../../core/theme';
import { datasetIdRangeProfileFixture as profile } from './dataset-id-range.fixture';
import { DatasetIdRange } from './playername-id-range';

const pixiMocks = vi.hoisted(() => ({
  addChild: vi.fn(),
  clear: vi.fn(),
  destroyApplication: vi.fn(),
  destroyGraphics: vi.fn(),
  fill: vi.fn(),
  init: vi.fn<(options: Record<string, unknown>) => Promise<void>>(),
  rect: vi.fn(),
  resize: vi.fn(),
  roundRect: vi.fn(),
  stageRemoveChild: vi.fn(),
  stroke: vi.fn(),
}));

const viewportMocks = vi.hoisted(() => ({
  addChild: vi.fn(),
  clamp: vi.fn(),
  clampZoom: vi.fn(),
  destroy: vi.fn(),
  drag: vi.fn(),
  listeners: {} as Record<string, () => void>,
  off: vi.fn(),
  on: vi.fn(),
  pinch: vi.fn(),
  pluginsRemove: vi.fn(),
  removeChild: vi.fn(),
  resize: vi.fn(),
  wheel: vi.fn(),
}));

const canvas2dMocks = vi.hoisted(() => ({
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  setTransform: vi.fn(),
  strokeRect: vi.fn(),
}));

const canvas2dContext = {
  ...canvas2dMocks,
  fillStyle: '',
  lineWidth: 1,
  strokeStyle: '',
} as unknown as CanvasRenderingContext2D;

let notifyResize: ResizeObserverCallback;

class ResizeObserverMock implements ResizeObserver {
  constructor(callback: ResizeObserverCallback) {
    notifyResize = callback;
  }
  disconnect = vi.fn();
  observe = vi.fn();
  unobserve = vi.fn();
}

vi.mock('pixi.js', () => {
  class Graphics {
    clear(): this {
      pixiMocks.clear();
      return this;
    }
    destroy(): void {
      pixiMocks.destroyGraphics();
    }
    fill(...arguments_: unknown[]): this {
      pixiMocks.fill(...arguments_);
      return this;
    }
    rect(...arguments_: unknown[]): this {
      pixiMocks.rect(...arguments_);
      return this;
    }
    roundRect(...arguments_: unknown[]): this {
      pixiMocks.roundRect(...arguments_);
      return this;
    }
    stroke(...arguments_: unknown[]): this {
      pixiMocks.stroke(...arguments_);
      return this;
    }
  }
  class Application {
    readonly canvas = document.createElement('canvas');
    readonly renderer = { events: {}, resize: pixiMocks.resize };
    readonly screen = { width: 800, height: 96 };
    readonly stage = { addChild: pixiMocks.addChild, removeChild: pixiMocks.stageRemoveChild };
    readonly init = pixiMocks.init;
    readonly destroy = pixiMocks.destroyApplication;
  }
  return { Application, Graphics };
});

vi.mock('pixi-viewport', () => {
  class Viewport {
    x = 0;
    y = 0;
    readonly scale = { x: 1, y: 1 };
    readonly plugins = { remove: viewportMocks.pluginsRemove };

    addChild(value: unknown): this {
      viewportMocks.addChild(value);
      return this;
    }
    clamp(options: unknown): this {
      viewportMocks.clamp(options);
      return this;
    }
    clampZoom(options: unknown): this {
      viewportMocks.clampZoom(options);
      return this;
    }
    destroy(options: unknown): void {
      viewportMocks.destroy(options);
    }
    drag(options: unknown): this {
      viewportMocks.drag(options);
      return this;
    }
    off(event: string): this {
      viewportMocks.off(event);
      delete viewportMocks.listeners[event];
      return this;
    }
    on(event: string, listener: () => void): this {
      viewportMocks.on(event, listener);
      viewportMocks.listeners[event] = listener;
      return this;
    }
    pinch(options: unknown): this {
      viewportMocks.pinch(options);
      return this;
    }
    removeChild(value: unknown): this {
      viewportMocks.removeChild(value);
      return this;
    }
    resize(...arguments_: unknown[]): void {
      viewportMocks.resize(...arguments_);
    }
    wheel(options: unknown): this {
      viewportMocks.wheel(options);
      return this;
    }
  }
  return { Viewport };
});

describe('DatasetIdRange', () => {
  beforeEach(async () => {
    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
    Object.values(pixiMocks).forEach((mock) => mock.mockReset());
    Object.entries(viewportMocks).forEach(([key, value]) => {
      if (key === 'listeners') {
        for (const event of Object.keys(value as Record<string, unknown>))
          delete (value as Record<string, unknown>)[event];
      } else if (typeof value === 'function') value.mockReset();
    });
    Object.values(canvas2dMocks).forEach((mock) => mock.mockReset());
    pixiMocks.init.mockResolvedValue(undefined);
    await TestBed.configureTestingModule({ imports: [DatasetIdRange] }).compileComponents();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('renders a control-free accessible run overview with range inspection', async () => {
    const fixture = TestBed.createComponent(DatasetIdRange);
    fixture.componentRef.setInput('label', 'playernames current IDs');
    fixture.componentRef.setInput('profile', profile);
    await fixture.whenStable();
    await vi.waitFor(() => expect(pixiMocks.init).toHaveBeenCalledOnce());
    const element = fixture.nativeElement as HTMLElement;
    const host = element.querySelector<HTMLElement>('[data-range-canvas]')!;

    expect(pixiMocks.init).toHaveBeenCalledWith(
      expect.objectContaining({
        width: 640,
        height: 96,
        preference: 'webgl',
      }),
    );
    expect(pixiMocks.init.mock.calls[0]?.[0]).not.toHaveProperty('resizeTo');
    expect(viewportMocks.drag).toHaveBeenCalledWith({
      direction: 'x',
      underflow: 'center',
      wheel: false,
    });
    expect(viewportMocks.pinch).toHaveBeenCalledWith({ axis: 'x' });
    expect(viewportMocks.wheel).toHaveBeenCalledWith(
      expect.objectContaining({
        axis: 'x',
        keyToPress: ['ControlLeft', 'ControlRight', 'MetaLeft', 'MetaRight'],
        trackpadPinch: true,
      }),
    );
    expect(host.getAttribute('aria-label')).toContain('3 occupied IDs');
    expect(host.querySelector('canvas')?.getAttribute('aria-hidden')).toBe('true');
    expect(host.querySelector('canvas')?.style.width).toBe('100%');
    expect(element.textContent).not.toContain('Canvas visualization is unavailable');
    expect(element.querySelector('button')).toBeNull();
    expect(element.querySelector('form')).toBeNull();
    expect(element.querySelector('mat-slider')).toBeNull();
    expect(
      [...element.querySelectorAll('[data-range-legend] li')].map((item) =>
        item.textContent?.trim(),
      ),
    ).toEqual(['Occupied', 'Hole', 'Free capacity', 'Out of range']);

    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await fixture.whenStable();
    expect(element.textContent).toContain(
      'Below published range · 1 ID · observed -1–-1 · samples -1',
    );
    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await fixture.whenStable();
    expect(element.textContent).toContain('Hole IDs 1–194 · 194 IDs');
    expect(element.querySelector('[data-range-tooltip]')?.textContent).toContain(
      'Hole IDs 1–194 · 194 IDs',
    );

    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    await fixture.whenStable();
    expect(element.textContent).toContain(
      'Above published range · 1 ID · observed 50,001–50,001 · samples 50,001',
    );
    expect((await axe.run(element)).violations).toEqual([]);
  });

  it('zooms and pans from the keyboard without adding visible controls', async () => {
    const fixture = TestBed.createComponent(DatasetIdRange);
    fixture.componentRef.setInput('label', 'keyboard camera');
    fixture.componentRef.setInput('profile', profile);
    await fixture.whenStable();
    await vi.waitFor(() => expect(pixiMocks.init).toHaveBeenCalledOnce());
    const element = fixture.nativeElement as HTMLElement;
    const host = element.querySelector<HTMLElement>('[data-range-canvas]')!;

    host.dispatchEvent(new KeyboardEvent('keydown', { key: '+', bubbles: true }));
    await fixture.whenStable();
    expect(element.textContent).toContain('1.5× zoom');

    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true }));
    await fixture.whenStable();
    expect(element.textContent).toContain('showing 33.3–100.0%');

    host.dispatchEvent(new KeyboardEvent('keydown', { key: '0', bubbles: true }));
    await fixture.whenStable();
    expect(element.textContent).toContain('Complete overview');
    expect(element.querySelector('button')).toBeNull();
  });

  it('uses modified wheel for zoom, horizontal wheel for pan, and preserves vertical scrolling', async () => {
    const fixture = TestBed.createComponent(DatasetIdRange);
    fixture.componentRef.setInput('label', 'wheel camera');
    fixture.componentRef.setInput('profile', profile);
    await fixture.whenStable();
    await vi.waitFor(() => expect(pixiMocks.init).toHaveBeenCalledOnce());
    const element = fixture.nativeElement as HTMLElement;
    const host = element.querySelector<HTMLElement>('[data-range-canvas]')!;
    const vertical = new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      deltaY: 100,
    });
    host.dispatchEvent(vertical);
    expect(vertical.defaultPrevented).toBe(false);

    const zoom = new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      clientX: 320,
      ctrlKey: true,
      deltaY: -500,
    });
    host.dispatchEvent(zoom);
    await fixture.whenStable();
    expect(zoom.defaultPrevented).toBe(true);
    expect(element.textContent).toContain('2.0× zoom');

    const horizontal = new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      deltaX: 160,
    });
    host.dispatchEvent(horizontal);
    await fixture.whenStable();
    expect(horizontal.defaultPrevented).toBe(true);
    expect(element.textContent).toContain('showing 37.5–87.5%');
  });

  it('maps pointer hover to occupied, hole, capacity, and overflow ranges', async () => {
    const fixture = TestBed.createComponent(DatasetIdRange);
    fixture.componentRef.setInput('label', 'pointer ranges');
    fixture.componentRef.setInput('profile', profile);
    await fixture.whenStable();
    await vi.waitFor(() => expect(pixiMocks.init).toHaveBeenCalledOnce());
    const element = fixture.nativeElement as HTMLElement;
    const host = element.querySelector<HTMLElement>('[data-range-canvas]')!;
    const hover = (x: number): void => {
      host.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: x, clientY: 30 }));
    };

    hover(5);
    await fixture.whenStable();
    expect(element.textContent).toContain('Below published range');
    hover(100);
    await fixture.whenStable();
    expect(element.textContent).toContain('Hole IDs 1–194 · 194 IDs');
    hover(550);
    await fixture.whenStable();
    expect(element.textContent).toContain('Free capacity IDs 391–49,999 · 49,609 IDs');
    hover(635);
    await fixture.whenStable();
    expect(element.textContent).toContain('Above published range');
  });

  it('redraws for theme changes and destroys Pixi resources', async () => {
    const fixture = TestBed.createComponent(DatasetIdRange);
    fixture.componentRef.setInput('label', 'playernames before');
    fixture.componentRef.setInput('profile', profile);
    await fixture.whenStable();
    await vi.waitFor(() => expect(pixiMocks.clear).toHaveBeenCalled());
    const renderCount = pixiMocks.clear.mock.calls.length;

    notifyResize([], {} as ResizeObserver);
    expect(pixiMocks.resize).toHaveBeenCalled();
    expect(pixiMocks.clear.mock.calls.length).toBeGreaterThan(renderCount);
    const resizedRenderCount = pixiMocks.clear.mock.calls.length;

    TestBed.inject(Theme).set('dark');
    await fixture.whenStable();
    expect(pixiMocks.clear.mock.calls.length).toBeGreaterThan(resizedRenderCount);

    fixture.destroy();
    expect(pixiMocks.destroyGraphics).toHaveBeenCalledOnce();
    expect(pixiMocks.destroyApplication).toHaveBeenCalledOnce();
  });

  it('retries with the Pixi canvas renderer when WebGL initialization fails', async () => {
    pixiMocks.init.mockRejectedValueOnce(new Error('WebGL unavailable'));
    const fixture = TestBed.createComponent(DatasetIdRange);
    fixture.componentRef.setInput('label', 'playernames current IDs');
    fixture.componentRef.setInput('profile', profile);
    await fixture.whenStable();
    await vi.waitFor(() => expect(pixiMocks.init).toHaveBeenCalledTimes(2));
    const element = fixture.nativeElement as HTMLElement;

    expect(pixiMocks.init.mock.calls.map(([options]) => options['preference'])).toEqual([
      'webgl',
      'canvas',
    ]);
    expect(pixiMocks.destroyApplication).toHaveBeenCalledOnce();
    expect(element.querySelector('[data-range-canvas] canvas')).not.toBeNull();
    expect(element.textContent).not.toContain('Canvas visualization is unavailable');
  });

  it('retries with CanvasRenderer when the first WebGL draw fails', async () => {
    pixiMocks.roundRect.mockImplementationOnce(() => {
      throw new Error('WebGL draw failed');
    });
    const fixture = TestBed.createComponent(DatasetIdRange);
    fixture.componentRef.setInput('label', 'playernames current IDs');
    fixture.componentRef.setInput('profile', profile);
    await fixture.whenStable();
    await vi.waitFor(() => expect(pixiMocks.init).toHaveBeenCalledTimes(2));

    expect(pixiMocks.init.mock.calls.map(([options]) => options['preference'])).toEqual([
      'webgl',
      'canvas',
    ]);
    expect((fixture.nativeElement as HTMLElement).querySelector('canvas')).not.toBeNull();
  });

  it('uses native Canvas 2D when both Pixi renderers fail during their first draw', async () => {
    pixiMocks.roundRect
      .mockImplementationOnce(() => {
        throw new Error('WebGL draw failed');
      })
      .mockImplementationOnce(() => {
        throw new Error('Pixi canvas draw failed');
      });
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(canvas2dContext as never);
    const fixture = TestBed.createComponent(DatasetIdRange);
    fixture.componentRef.setInput('label', 'playernames current IDs');
    fixture.componentRef.setInput('profile', profile);
    await fixture.whenStable();
    await vi.waitFor(() => expect(canvas2dMocks.fillRect).toHaveBeenCalled());

    expect(pixiMocks.init).toHaveBeenCalledTimes(2);
    expect(pixiMocks.destroyApplication).toHaveBeenCalledTimes(2);
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain(
      'Canvas visualization is unavailable',
    );
  });

  it('uses native Canvas 2D when both Pixi renderers fail', async () => {
    pixiMocks.init.mockRejectedValue(new Error('Renderer unavailable'));
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(canvas2dContext as never);
    const fixture = TestBed.createComponent(DatasetIdRange);
    fixture.componentRef.setInput('label', 'playernames current IDs');
    fixture.componentRef.setInput('profile', profile);
    await fixture.whenStable();
    await vi.waitFor(() => expect(canvas2dMocks.fillRect).toHaveBeenCalled());
    const element = fixture.nativeElement as HTMLElement;
    const canvas = element.querySelector<HTMLCanvasElement>('[data-range-canvas] canvas');

    expect(pixiMocks.init).toHaveBeenCalledTimes(2);
    expect(pixiMocks.destroyApplication).toHaveBeenCalledTimes(2);
    expect(canvas).not.toBeNull();
    expect(canvas?.width).toBe(640);
    expect(canvas?.height).toBe(96);
    expect(canvas?.style.width).toBe('100%');
    expect(element.textContent).not.toContain('Canvas visualization is unavailable');
    expect(canvas2dMocks.fillRect.mock.calls.some((call) => call[3] === 52)).toBe(true);

    const drawCount = canvas2dMocks.clearRect.mock.calls.length;
    notifyResize([], {} as ResizeObserver);
    expect(canvas2dMocks.clearRect.mock.calls.length).toBeGreaterThan(drawCount);

    fixture.destroy();
    expect(canvas2dMocks.clearRect).toHaveBeenCalled();
  });

  it('supports drag and pinch gestures through the native Canvas fallback', async () => {
    pixiMocks.init.mockRejectedValue(new Error('Renderer unavailable'));
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(canvas2dContext as never);
    const fixture = TestBed.createComponent(DatasetIdRange);
    fixture.componentRef.setInput('label', 'native gestures');
    fixture.componentRef.setInput('profile', profile);
    await fixture.whenStable();
    await vi.waitFor(() => expect(canvas2dMocks.fillRect).toHaveBeenCalled());
    const element = fixture.nativeElement as HTMLElement;
    const host = element.querySelector<HTMLElement>('[data-range-canvas]')!;
    const pointer = (type: string, pointerId: number, clientX: number, clientY = 30): void => {
      const event = new MouseEvent(type, { bubbles: true, clientX, clientY });
      Object.defineProperty(event, 'pointerId', { value: pointerId });
      host.dispatchEvent(event);
    };

    pointer('pointerdown', 1, 200);
    pointer('pointerdown', 2, 400);
    pointer('pointermove', 2, 600);
    await fixture.whenStable();
    expect(element.textContent).toContain('2.0× zoom');
    expect(host.hasAttribute('data-dragging')).toBe(true);

    pointer('pointerup', 2, 600);
    pointer('pointerup', 1, 200);
    await fixture.whenStable();
    expect(host.hasAttribute('data-dragging')).toBe(false);

    pointer('pointerdown', 3, 400);
    pointer('pointermove', 3, 200);
    pointer('pointerup', 3, 200);
    await fixture.whenStable();
    expect(element.textContent).toContain('showing 31.3–81.3%');
  });

  it('keeps the numeric fallback only when Pixi and native Canvas 2D all fail', async () => {
    pixiMocks.init.mockRejectedValue(new Error('Renderer unavailable'));
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null as never);
    const fixture = TestBed.createComponent(DatasetIdRange);
    fixture.componentRef.setInput('label', 'playernames current IDs');
    fixture.componentRef.setInput('profile', profile);
    await fixture.whenStable();
    await vi.waitFor(() =>
      expect((fixture.nativeElement as HTMLElement).textContent).toContain(
        'Canvas visualization is unavailable',
      ),
    );

    expect(pixiMocks.init).toHaveBeenCalledTimes(2);
    expect(pixiMocks.destroyApplication).toHaveBeenCalledTimes(2);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('49,609');
  });

  it('does not render the old aggregate chart for a legacy profile without exact IDs', async () => {
    const fixture = TestBed.createComponent(DatasetIdRange);
    fixture.componentRef.setInput('label', 'legacy playernames IDs');
    fixture.componentRef.setInput('profile', { ...profile, occupiedIds: undefined });
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(pixiMocks.init).not.toHaveBeenCalled();
    expect(element.querySelector('[data-range-canvas]')).toBeNull();
    expect(element.textContent).toContain('An exact ID map was not retained');
    expect(element.textContent).toContain('49,609');
  });
});
