import { TestBed } from '@angular/core/testing';

import { datasetIdRangeProfileFixture as profile } from './dataset-id-range.fixture';
import { DatasetIdRange } from './playername-id-range';
import { createPlayernameIdRangeLanes } from './playername-id-range-lanes';

const pixiMocks = vi.hoisted(() => ({
  destroy: vi.fn(),
  init: vi.fn<() => Promise<void>>(),
  resize: vi.fn(),
}));

const canvasContext = {
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  fillStyle: '',
  lineWidth: 1,
  setTransform: vi.fn(),
  strokeRect: vi.fn(),
  strokeStyle: '',
} as unknown as CanvasRenderingContext2D;

let resizeObservers: ResizeObserverMock[];

class ResizeObserverMock implements ResizeObserver {
  readonly disconnectMock = vi.fn();
  readonly observeMock = vi.fn();
  readonly unobserveMock = vi.fn();

  constructor(readonly callback: ResizeObserverCallback) {
    resizeObservers.push(this);
  }

  disconnect(): void {
    this.disconnectMock();
  }

  observe(element: Element): void {
    this.observeMock(element);
  }

  unobserve(element: Element): void {
    this.unobserveMock(element);
  }
}

vi.mock('pixi.js', () => {
  class Application {
    readonly canvas = document.createElement('canvas');
    readonly renderer = { resize: pixiMocks.resize };
    readonly init = pixiMocks.init;
    readonly destroy = pixiMocks.destroy;
  }
  return { Application };
});

vi.mock('pixi-viewport', () => ({}));

describe('DatasetIdRange tooltip', () => {
  beforeEach(async () => {
    resizeObservers = [];
    pixiMocks.init.mockReset().mockRejectedValue(new Error('Use native Canvas'));
    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(canvasContext as never);
    await TestBed.configureTestingModule({ imports: [DatasetIdRange] }).compileComponents();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('keeps the measured tooltip above the bar and inside both chart edges', async () => {
    const fixture = TestBed.createComponent(DatasetIdRange);
    fixture.componentRef.setInput('label', 'tooltip geometry');
    fixture.componentRef.setInput('profile', profile);
    await fixture.whenStable();
    const host = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(
      '[data-range-canvas]',
    )!;
    const hover = async (clientX: number): Promise<HTMLDivElement> => {
      host.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX, clientY: 30 }));
      await fixture.whenStable();
      return (fixture.nativeElement as HTMLElement).querySelector<HTMLDivElement>(
        '[data-range-tooltip]',
      )!;
    };

    const tooltip = await hover(5);
    vi.spyOn(tooltip, 'getBoundingClientRect').mockReturnValue({
      bottom: 0,
      height: 32,
      left: 0,
      right: 200,
      top: 0,
      width: 200,
      x: 0,
      y: 0,
      toJSON: () => undefined,
    });
    const tooltipObserver = resizeObservers.find(({ observeMock }) =>
      observeMock.mock.calls.some(([element]) => element === tooltip),
    )!;
    tooltipObserver.callback([], tooltipObserver);
    await fixture.whenStable();

    expect(tooltip.style.top).toBe('10px');
    expect(tooltip.style.bottom).toBe('');
    expect(tooltip.getAttribute('aria-hidden')).toBe('true');
    expect(tooltip.classList).toContain('w-max');
    expect(tooltip.classList).toContain('break-words');
    expect(tooltip.style.left).toBe('108px');

    expect((await hover(635)).style.left).toBe('532px');

    host.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Home' }));
    await fixture.whenStable();
    expect(tooltip.style.left).toBe('108px');
    host.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'End' }));
    await fixture.whenStable();
    expect(tooltip.style.left).toBe('532px');

    Object.defineProperty(host, 'clientWidth', { configurable: true, value: 320 });
    const hostObserver = resizeObservers.find(({ observeMock }) =>
      observeMock.mock.calls.some(([element]) => element === host),
    )!;
    hostObserver.callback([], hostObserver);
    await fixture.whenStable();
    expect(tooltip.style.left).toBe('212px');
  });

  it('disconnects tooltip measurement when the tooltip closes', async () => {
    const fixture = TestBed.createComponent(DatasetIdRange);
    fixture.componentRef.setInput('label', 'tooltip lifecycle');
    fixture.componentRef.setInput('profile', profile);
    await fixture.whenStable();
    const host = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(
      '[data-range-canvas]',
    )!;
    host.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 100, clientY: 30 }));
    await fixture.whenStable();
    const tooltip = (fixture.nativeElement as HTMLElement).querySelector('[data-range-tooltip]');
    const tooltipObserver = resizeObservers.find(({ observeMock }) =>
      observeMock.mock.calls.some(([element]) => element === tooltip),
    )!;

    host.dispatchEvent(new MouseEvent('pointerleave', { bubbles: true }));
    await fixture.whenStable();

    expect(tooltipObserver.disconnectMock).toHaveBeenCalledOnce();
    expect((fixture.nativeElement as HTMLElement).querySelector('[data-range-tooltip]')).toBeNull();
  });

  it('renders source-aware table lanes and tooltips in one canvas', async () => {
    const fixture = TestBed.createComponent(DatasetIdRange);
    fixture.componentRef.setInput('label', 'Playernames current IDs');
    fixture.componentRef.setInput(
      'rangeModel',
      createPlayernameIdRangeLanes([
        { table: 'playernames', profile },
        {
          table: 'dcplayernames',
          profile: {
            ...profile,
            rangeMin: 60_000,
            rangeMax: 60_010,
            activeMax: 60_000,
            occupiedIds: [60_000],
            occupiedCount: 1,
            holeCount: 0,
            capacityCount: 10,
            outOfRangeCount: 0,
            belowRange: { count: 0, samples: [] },
            aboveRange: { count: 0, samples: [] },
          },
        },
      ]),
    );
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const host = element.querySelector<HTMLElement>('[data-range-canvas]')!;
    const text = element.textContent?.replaceAll(/\s+/g, ' ');

    expect(element.querySelectorAll('[data-range-canvas]')).toHaveLength(1);
    expect(element.querySelector('[data-range-lanes]')?.textContent).toContain(
      'Top row: playernames',
    );
    expect(element.querySelector('[data-range-lanes]')?.textContent).toContain(
      'Bottom row: dcplayernames',
    );
    expect(text).toContain('playernames 0–49,999');
    expect(text).toContain('dcplayernames 60,000–60,010');
    expect(element.querySelectorAll('[data-range-breakdowns] tbody tr')).toHaveLength(2);

    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await fixture.whenStable();
    expect(element.textContent).toContain('playernames · Below published range');

    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await fixture.whenStable();
    expect(element.textContent).toContain('dcplayernames · Occupied IDs 60,000–60,000');

    host.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 639, clientY: 70 }));
    await fixture.whenStable();
    expect(element.textContent).toContain('dcplayernames ·');

    host.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 320, clientY: 48 }));
    await fixture.whenStable();
    expect(element.querySelector('[data-range-tooltip]')).toBeNull();
  });
});
