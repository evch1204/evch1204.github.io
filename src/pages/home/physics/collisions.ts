import {
  FRICTION_GROUND,
  PENETRATION_ALLOWANCE,
  POSITION_CORRECTION,
  RESTITUTION,
  RESTITUTION_MIN_SPEED,
} from './constants';
import type { PhysBody, StaticRect } from './types';

/**
 * The contact solvers. `dragging` is the body the pointer is holding: it is
 * treated as immovable, so whatever it meets is pushed out of the way instead.
 */

/** Reflect a velocity off a surface, but only bounce if it arrived with real speed. */
export function bounce(v: number) {
  const speed = Math.abs(v);
  return speed > RESTITUTION_MIN_SPEED ? speed * RESTITUTION : 0;
}

export function resolveCollision(a: PhysBody, b: PhysBody, dragging: PhysBody | null) {
  if (a.homing || b.homing) return;
  if (a.sleeping && b.sleeping) return;

  const cx1 = a.x + a.w / 2;
  const cy1 = a.y + a.h / 2;
  const cx2 = b.x + b.w / 2;
  const cy2 = b.y + b.h / 2;

  const dx = cx2 - cx1;
  const dy = cy2 - cy1;
  const overlapX = (a.w + b.w) / 2 - Math.abs(dx);
  const overlapY = (a.h + b.h) / 2 - Math.abs(dy);

  if (overlapX <= 0 || overlapY <= 0) return;

  const aFixed = a === dragging;
  const bFixed = b === dragging;

  /*
   * Leave a sliver of penetration and correct most of the rest, instead of
   * pushing past touching every step. The old `overlap + SLOP` shoved the
   * pair 0.5px apart, gravity closed it again next step, and the pile hummed.
   */
  const correct = (overlap: number) =>
    Math.max(0, overlap - PENETRATION_ALLOWANCE) * POSITION_CORRECTION;

  let jolted = false;

  if (overlapX < overlapY) {
    const nx = Math.sign(dx);
    const sep = correct(overlapX);
    if (!aFixed && !bFixed) {
      a.x -= nx * sep * 0.5;
      b.x += nx * sep * 0.5;
    } else if (aFixed) {
      b.x += nx * sep;
    } else {
      a.x -= nx * sep;
    }

    const relVx = b.vx - a.vx;
    const approach = Math.abs(relVx);
    const e = approach > RESTITUTION_MIN_SPEED ? RESTITUTION : 0;
    const j = (-(1 + e) * relVx * nx) / 2;
    const imp = j * nx;
    if (!aFixed) a.vx -= imp;
    if (!bFixed) b.vx += imp;
    jolted = approach > 0.6 || sep > 0.6;
  } else {
    const ny = Math.sign(dy);
    const sep = correct(overlapY);
    if (!aFixed && !bFixed) {
      a.y -= ny * sep * 0.5;
      b.y += ny * sep * 0.5;
    } else if (aFixed) {
      b.y += ny * sep;
    } else {
      a.y -= ny * sep;
    }

    const relVy = b.vy - a.vy;
    const approach = Math.abs(relVy);
    const e = approach > RESTITUTION_MIN_SPEED ? RESTITUTION : 0;
    const j = (-(1 + e) * relVy * ny) / 2;
    const imp = j * ny;
    if (!aFixed) a.vy -= imp;
    if (!bFixed) b.vy += imp;

    const frictionScale = 0.85;
    if (!aFixed) a.vx *= frictionScale;
    if (!bFixed) b.vx *= frictionScale;

    // Whichever body got pushed up is the one standing on the other.
    if (ny > 0) a.supported = true;
    else b.supported = true;

    jolted = approach > 0.6 || sep > 0.6;
  }

  // Only a real knock wakes a neighbour; resting contact must not, or nothing sleeps.
  if (jolted) {
    if (!aFixed) {
      a.sleeping = false;
      a.sleepTimer = 0;
    }
    if (!bFixed) {
      b.sleeping = false;
      b.sleepTimer = 0;
    }
  }
}

/** Immovable typed-text regions: blocks bounce or slide off like platforms/walls. */
export function resolveStatic(b: PhysBody, s: StaticRect, dragging: PhysBody | null) {
  if (b.homing) return;

  const cx1 = b.x + b.w / 2;
  const cy1 = b.y + b.h / 2;
  const cx2 = s.x + s.w / 2;
  const cy2 = s.y + s.h / 2;
  const dx = cx2 - cx1;
  const dy = cy2 - cy1;
  const overlapX = (b.w + s.w) / 2 - Math.abs(dx);
  const overlapY = (b.h + s.h) / 2 - Math.abs(dy);

  if (overlapX <= 0 || overlapY <= 0) return;

  const isDrag = b === dragging;

  const correct = (overlap: number) =>
    Math.max(0, overlap - PENETRATION_ALLOWANCE) * POSITION_CORRECTION;

  if (overlapX < overlapY) {
    const nx = Math.sign(dx);
    const sep = correct(overlapX);
    b.x -= nx * sep;
    if (!isDrag) {
      const approach = Math.abs(b.vx);
      const e = approach > RESTITUTION_MIN_SPEED ? RESTITUTION : 0;
      b.vx -= (1 + e) * (b.vx * nx) * nx;
      if (approach > 0.6 || sep > 0.6) {
        b.sleeping = false;
        b.sleepTimer = 0;
      }
    }
  } else {
    const ny = Math.sign(dy);
    const sep = correct(overlapY);
    b.y -= ny * sep;
    if (!isDrag) {
      const approach = Math.abs(b.vy);
      const e = approach > RESTITUTION_MIN_SPEED ? RESTITUTION : 0;
      b.vy -= (1 + e) * (b.vy * ny) * ny;
      if (ny > 0) {
        b.vx *= FRICTION_GROUND;
        b.rotV *= 0.4;
        // The shelf is underneath, so the block is resting on it.
        b.supported = true;
      }
      if (approach > 0.6 || sep > 0.6) {
        b.sleeping = false;
        b.sleepTimer = 0;
      }
    }
  }
}
