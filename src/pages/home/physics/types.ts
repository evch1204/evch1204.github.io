/** What a block does when it is tapped while it is still. */
export type CtaKind = 'projects' | 'resume' | 'github' | 'linkedin' | 'mail';

export type PhysBody = {
  el: HTMLDivElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  rot: number;
  rotV: number;
  sleeping: boolean;
  sleepTimer: number;
  /** Set by the solvers when something held this body up last step (floor, shelf or another block). */
  supported: boolean;
  cta?: CtaKind;
  sourceSpan: HTMLSpanElement;
  homing?: boolean;
};

/** Axis-aligned obstacles (the italic shelf line, which stays put) in physics-container space. */
export type StaticRect = { x: number; y: number; w: number; h: number };
