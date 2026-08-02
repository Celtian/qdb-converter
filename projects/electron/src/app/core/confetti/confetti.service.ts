import { Overlay } from '@angular/cdk/overlay';
import type { OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Injector, Service, inject } from '@angular/core';
import type { ComponentRef } from '@angular/core';

import { Confetti } from './confetti';
import type { ConfettiBurstOptions } from './confetti.types';

const confettiOverlayZIndex = 1_000_000_000;
const defaultConfettiTicks = 180;
const cleanupBufferMilliseconds = 1_000;
const millisecondsPerAnimationFrame = 1_000 / 60;

@Service()
export class ConfettiService {
  private readonly injector = inject(Injector);
  private readonly overlay = inject(Overlay);
  private overlayRef?: OverlayRef;
  private componentRef?: ComponentRef<Confetti>;
  private cleanupTimer?: ReturnType<typeof globalThis.setTimeout>;
  private readonly burstTimers = new Set<ReturnType<typeof globalThis.setTimeout>>();

  burst(options: ConfettiBurstOptions = {}): void {
    this.ensureConfetti().instance.burst(options);
    this.scheduleCleanup(options.ticks ?? defaultConfettiTicks);
  }

  celebrate(options: ConfettiBurstOptions = {}): void {
    this.burst({
      particleCount: 120,
      spread: 80,
      startVelocity: 28,
      ...options,
    });

    this.scheduleBurst(
      {
        particleCount: 70,
        origin: { x: 0.25, y: 0.45 },
        spread: 65,
        startVelocity: 22,
        ...options,
      },
      140,
    );

    this.scheduleBurst(
      {
        particleCount: 70,
        origin: { x: 0.75, y: 0.45 },
        spread: 65,
        startVelocity: 22,
        ...options,
      },
      260,
    );
  }

  clear(): void {
    this.componentRef?.instance.clear();
  }

  dispose(): void {
    for (const timer of this.burstTimers) globalThis.clearTimeout(timer);
    this.burstTimers.clear();
    if (this.cleanupTimer !== undefined) globalThis.clearTimeout(this.cleanupTimer);
    this.cleanupTimer = undefined;
    this.overlayRef?.dispose();
    this.overlayRef = undefined;
    this.componentRef = undefined;
  }

  private ensureConfetti(): ComponentRef<Confetti> {
    if (this.componentRef) return this.componentRef;

    this.overlayRef = this.overlay.create({
      hasBackdrop: false,
      panelClass: 'app-confetti-overlay-pane',
      positionStrategy: this.overlay.position().global().top('0').left('0'),
      scrollStrategy: this.overlay.scrollStrategies.noop(),
      width: '100vw',
      height: '100vh',
    });
    this.overlayRef.hostElement.style.zIndex = `${confettiOverlayZIndex}`;
    this.overlayRef.hostElement.style.pointerEvents = 'none';
    this.overlayRef.overlayElement.style.zIndex = `${confettiOverlayZIndex}`;
    this.overlayRef.overlayElement.style.pointerEvents = 'none';
    this.componentRef = this.overlayRef.attach(new ComponentPortal(Confetti, null, this.injector));

    return this.componentRef;
  }

  private scheduleBurst(options: ConfettiBurstOptions, delay: number): void {
    const timer = globalThis.setTimeout(() => {
      this.burstTimers.delete(timer);
      this.burst(options);
    }, delay);
    this.burstTimers.add(timer);
  }

  private scheduleCleanup(ticks: number): void {
    if (this.cleanupTimer !== undefined) globalThis.clearTimeout(this.cleanupTimer);
    const duration = Math.ceil(ticks * millisecondsPerAnimationFrame) + cleanupBufferMilliseconds;
    this.cleanupTimer = globalThis.setTimeout(() => {
      this.cleanupTimer = undefined;
      this.dispose();
    }, duration);
  }
}
