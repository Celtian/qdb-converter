import { isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, inject, viewChild } from '@angular/core';
import type { AfterViewInit, ElementRef, OnDestroy } from '@angular/core';

import type { ConfettiBurstOptions } from './confetti.types';

interface ConfettiParticle {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  size: number;
  color: string;
  rotation: number;
  rotationVelocity: number;
  wobble: number;
  wobbleSpeed: number;
  tick: number;
  totalTicks: number;
  gravity: number;
  shape: 'circle' | 'rectangle';
}

const defaultColors = ['#22c55e', '#0ea5e9', '#f59e0b', '#ef4444', '#a855f7', '#f8fafc'];

@Component({
  selector: 'app-confetti',
  template: '<canvas #canvas class="confetti-canvas"></canvas>',
  styleUrl: './confetti.css',
})
export class Confetti implements AfterViewInit, OnDestroy {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly particles: ConfettiParticle[] = [];
  private animationFrameId?: number;
  private context?: CanvasRenderingContext2D;

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;

    const canvas = this.canvasRef()?.nativeElement;
    this.context = canvas?.getContext('2d') ?? undefined;
    this.resizeCanvas();
  }

  ngOnDestroy(): void {
    this.cancelAnimation();
  }

  burst(options: ConfettiBurstOptions = {}): void {
    if (!this.isBrowser || this.prefersReducedMotion() || !this.ensureContext()) return;

    this.particles.push(...this.createParticles(options));
    this.startAnimation();
  }

  clear(): void {
    this.cancelAnimation();
    this.particles.length = 0;
    this.clearCanvas();
  }

  private createParticles(options: ConfettiBurstOptions): ConfettiParticle[] {
    const canvas = this.canvasRef()?.nativeElement;
    const width = canvas?.clientWidth ?? window.innerWidth;
    const height = canvas?.clientHeight ?? window.innerHeight;
    const particleCount = options.particleCount ?? 90;
    const origin = options.origin ?? { x: 0.5, y: 0.35 };
    const spread = options.spread ?? 70;
    const startVelocity = options.startVelocity ?? 24;
    const gravity = options.gravity ?? 0.45;
    const scalar = options.scalar ?? 1;
    const totalTicks = options.ticks ?? 180;
    const colors = options.colors ?? defaultColors;

    return Array.from({ length: particleCount }, () => {
      const angle = this.degreesToRadians(-90 + (Math.random() - 0.5) * spread);
      const velocity = startVelocity * (0.55 + Math.random() * 0.55);

      return {
        x: width * origin.x,
        y: height * origin.y,
        velocityX: Math.cos(angle) * velocity,
        velocityY: Math.sin(angle) * velocity,
        size: (6 + Math.random() * 8) * scalar,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationVelocity: (Math.random() - 0.5) * 18,
        wobble: Math.random() * 10,
        wobbleSpeed: 0.08 + Math.random() * 0.12,
        tick: 0,
        totalTicks,
        gravity,
        shape: Math.random() > 0.35 ? 'rectangle' : 'circle',
      };
    });
  }

  private ensureContext(): boolean {
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) return false;

    this.context ??= canvas.getContext('2d') ?? undefined;
    this.resizeCanvas();

    return this.context !== undefined;
  }

  private startAnimation(): void {
    if (this.animationFrameId !== undefined) return;

    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }

  private animate(): void {
    this.animationFrameId = undefined;
    this.resizeCanvas();
    this.clearCanvas();

    const context = this.context;
    if (!context) return;

    for (let index = this.particles.length - 1; index >= 0; index--) {
      const particle = this.particles[index];
      particle.tick++;
      particle.x += particle.velocityX + Math.sin(particle.wobble) * 1.5;
      particle.y += particle.velocityY;
      particle.velocityY += particle.gravity;
      particle.velocityX *= 0.99;
      particle.velocityY *= 0.985;
      particle.rotation += particle.rotationVelocity;
      particle.wobble += particle.wobbleSpeed;

      if (particle.tick >= particle.totalTicks) {
        this.particles.splice(index, 1);
        continue;
      }

      this.drawParticle(context, particle);
    }

    if (this.particles.length > 0) this.startAnimation();
  }

  private drawParticle(context: CanvasRenderingContext2D, particle: ConfettiParticle): void {
    const progress = particle.tick / particle.totalTicks;
    const alpha = Math.max(0, 1 - progress);

    context.save();
    context.globalAlpha = alpha;
    context.translate(particle.x, particle.y);
    context.rotate(this.degreesToRadians(particle.rotation));
    context.fillStyle = particle.color;

    if (particle.shape === 'circle') {
      context.beginPath();
      context.arc(0, 0, particle.size * 0.42, 0, Math.PI * 2);
      context.fill();
    } else {
      context.fillRect(
        -particle.size * 0.5,
        -particle.size * 0.25,
        particle.size,
        particle.size * 0.5,
      );
    }

    context.restore();
  }

  private resizeCanvas(): void {
    const canvas = this.canvasRef()?.nativeElement;
    const context = this.context;
    if (!canvas || !context) return;

    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;
    const pixelRatio = window.devicePixelRatio || 1;
    const displayWidth = Math.floor(width * pixelRatio);
    const displayHeight = Math.floor(height * pixelRatio);

    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth;
      canvas.height = displayHeight;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    }
  }

  private clearCanvas(): void {
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas || !this.context) return;

    this.context.clearRect(
      0,
      0,
      canvas.clientWidth || window.innerWidth,
      canvas.clientHeight || window.innerHeight,
    );
  }

  private cancelAnimation(): void {
    if (this.animationFrameId === undefined) return;

    cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = undefined;
  }

  private prefersReducedMotion(): boolean {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  }

  private degreesToRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }
}
