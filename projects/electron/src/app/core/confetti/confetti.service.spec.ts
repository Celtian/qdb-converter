import { Overlay } from '@angular/cdk/overlay';
import type { ComponentRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import type { Confetti } from './confetti';
import { ConfettiService } from './confetti.service';

describe('ConfettiService', () => {
  let service: ConfettiService;
  let burst: ReturnType<typeof vi.fn>;
  let clear: ReturnType<typeof vi.fn>;
  let overlayRef: {
    attach: ReturnType<typeof vi.fn>;
    dispose: ReturnType<typeof vi.fn>;
    hostElement: HTMLElement;
    overlayElement: HTMLElement;
  };
  let create: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    burst = vi.fn();
    clear = vi.fn();
    const componentRef = {
      instance: { burst, clear } as unknown as Confetti,
    } as ComponentRef<Confetti>;
    overlayRef = {
      attach: vi.fn().mockReturnValue(componentRef),
      dispose: vi.fn(),
      hostElement: document.createElement('div'),
      overlayElement: document.createElement('div'),
    };
    create = vi.fn().mockReturnValue(overlayRef);
    const left = vi.fn().mockReturnValue('position-strategy');
    const top = vi.fn().mockReturnValue({ left });

    TestBed.configureTestingModule({
      providers: [
        ConfettiService,
        {
          provide: Overlay,
          useValue: {
            create,
            position: () => ({ global: () => ({ top }) }),
            scrollStrategies: { noop: () => 'noop-strategy' },
          },
        },
      ],
    });
    service = TestBed.inject(ConfettiService);
  });

  afterEach(() => {
    service.dispose();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('creates one non-interactive full-screen overlay and forwards repeated bursts', () => {
    service.burst({ particleCount: 5 });
    service.burst({ particleCount: 5 });

    expect(create).toHaveBeenCalledOnce();
    expect(overlayRef.attach).toHaveBeenCalledOnce();
    expect(burst).toHaveBeenCalledTimes(2);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        hasBackdrop: false,
        height: '100vh',
        panelClass: 'app-confetti-overlay-pane',
        width: '100vw',
      }),
    );
    expect(overlayRef.hostElement.style.zIndex).toBe('1000000000');
    expect(overlayRef.hostElement.style.pointerEvents).toBe('none');
    expect(overlayRef.overlayElement.style.pointerEvents).toBe('none');
  });

  it('performs the three celebration bursts and disposes the overlay afterward', () => {
    service.celebrate({ colors: ['gold'], particleCount: 10 });

    expect(burst).toHaveBeenCalledOnce();
    expect(burst).toHaveBeenNthCalledWith(1, {
      particleCount: 10,
      spread: 80,
      startVelocity: 28,
      colors: ['gold'],
    });

    vi.advanceTimersByTime(140);
    expect(burst).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ origin: { x: 0.25, y: 0.45 } }),
    );

    vi.advanceTimersByTime(120);
    expect(burst).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({ origin: { x: 0.75, y: 0.45 } }),
    );

    vi.advanceTimersByTime(3_999);
    expect(overlayRef.dispose).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(overlayRef.dispose).toHaveBeenCalledOnce();
  });

  it('clears, disposes, and recreates the overlay', () => {
    service.burst();
    service.clear();
    service.dispose();
    service.burst();

    expect(clear).toHaveBeenCalledOnce();
    expect(overlayRef.dispose).toHaveBeenCalledOnce();
    expect(create).toHaveBeenCalledTimes(2);
  });
});
