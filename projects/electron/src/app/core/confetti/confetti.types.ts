export interface ConfettiOrigin {
  x: number;
  y: number;
}

export interface ConfettiBurstOptions {
  particleCount?: number;
  origin?: ConfettiOrigin;
  spread?: number;
  startVelocity?: number;
  gravity?: number;
  scalar?: number;
  ticks?: number;
  colors?: string[];
}
