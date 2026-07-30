import { PLATFORM_ID } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import { Confetti } from './confetti';

interface ConfettiInternals {
  animate(): void;
  particles: unknown[];
}

interface CanvasContextStub {
  arc: ReturnType<typeof vi.fn>;
  beginPath: ReturnType<typeof vi.fn>;
  clearRect: ReturnType<typeof vi.fn>;
  fill: ReturnType<typeof vi.fn>;
  fillRect: ReturnType<typeof vi.fn>;
  fillStyle: string;
  globalAlpha: number;
  restore: ReturnType<typeof vi.fn>;
  rotate: ReturnType<typeof vi.fn>;
  save: ReturnType<typeof vi.fn>;
  setTransform: ReturnType<typeof vi.fn>;
  translate: ReturnType<typeof vi.fn>;
}

describe('Confetti', () => {
  let fixture: ComponentFixture<Confetti>;
  let component: Confetti;
  let context: CanvasContextStub;

  beforeEach(async () => {
    context = {
      arc: vi.fn(),
      beginPath: vi.fn(),
      clearRect: vi.fn(),
      fill: vi.fn(),
      fillRect: vi.fn(),
      fillStyle: '',
      globalAlpha: 1,
      restore: vi.fn(),
      rotate: vi.fn(),
      save: vi.fn(),
      setTransform: vi.fn(),
      translate: vi.fn(),
    };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(((contextId: string) =>
      contextId === '2d'
        ? (context as unknown as CanvasRenderingContext2D)
        : null) as typeof HTMLCanvasElement.prototype.getContext);

    await TestBed.configureTestingModule({ imports: [Confetti] }).compileComponents();
    fixture = TestBed.createComponent(Confetti);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('creates particles and schedules one animation for consecutive bursts', () => {
    const requestAnimationFrame = vi.spyOn(globalThis, 'requestAnimationFrame').mockReturnValue(1);

    component.burst({ particleCount: 3 });
    component.burst({ particleCount: 2 });

    expect((component as unknown as ConfettiInternals).particles).toHaveLength(5);
    expect(requestAnimationFrame).toHaveBeenCalledOnce();
  });

  it('draws and expires particles', () => {
    const requestAnimationFrame = vi.spyOn(globalThis, 'requestAnimationFrame').mockReturnValue(1);
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    component.burst({ colors: ['#fff'], particleCount: 1, ticks: 2 });
    requestAnimationFrame.mockClear();

    (component as unknown as ConfettiInternals).animate();

    expect(context.fillRect).toHaveBeenCalledOnce();
    expect((component as unknown as ConfettiInternals).particles).toHaveLength(1);
    expect(requestAnimationFrame).toHaveBeenCalledOnce();

    (component as unknown as ConfettiInternals).animate();
    expect((component as unknown as ConfettiInternals).particles).toHaveLength(0);
  });

  it('clears particles and cancels an active animation', () => {
    vi.spyOn(globalThis, 'requestAnimationFrame').mockReturnValue(42);
    const cancelAnimationFrame = vi.spyOn(globalThis, 'cancelAnimationFrame');
    component.burst({ particleCount: 2 });

    component.clear();

    expect((component as unknown as ConfettiInternals).particles).toHaveLength(0);
    expect(context.clearRect).toHaveBeenCalled();
    expect(cancelAnimationFrame).toHaveBeenCalledWith(42);
  });

  it('does not animate when reduced motion is requested', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: true }) as MediaQueryList),
    );
    const requestAnimationFrame = vi.spyOn(globalThis, 'requestAnimationFrame');

    component.burst();

    expect((component as unknown as ConfettiInternals).particles).toHaveLength(0);
    expect(requestAnimationFrame).not.toHaveBeenCalled();
  });
});

describe('Confetti on the server', () => {
  it('skips browser initialization and bursts', async () => {
    await TestBed.configureTestingModule({
      imports: [Confetti],
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    }).compileComponents();
    const fixture = TestBed.createComponent(Confetti);
    await fixture.whenStable();

    fixture.componentInstance.burst();

    expect((fixture.componentInstance as unknown as ConfettiInternals).particles).toHaveLength(0);
  });
});
