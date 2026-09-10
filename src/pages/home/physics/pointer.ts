import { STEP_MS, THROW_SAMPLE_MS, THROW_STALE_MS } from './constants';

/*
 * Throw speed comes from a short trail of timestamped pointer positions
 * rather than an average of per-event deltas. Deltas are "px per event", and
 * event rate has nothing to do with frame rate — so the old estimate varied
 * with the mouse's polling rate, and worse, it never decayed while the
 * pointer was held still, which let a stationary hand fling a block.
 */
type PointerSample = { x: number; y: number; t: number };

export type PointerTracker = {
  push(clientX: number, clientY: number, t: number): void;
  /** Pointer speed in px per simulation step, or zero if it has gone still. */
  velocity(now: number): { vx: number; vy: number };
  clear(): void;
};

export function createPointerTracker(): PointerTracker {
  const pointerTrail: PointerSample[] = [];

  return {
    push(clientX, clientY, t) {
      pointerTrail.push({ x: clientX, y: clientY, t });
      while (pointerTrail.length > 2 && t - pointerTrail[0].t > THROW_SAMPLE_MS) {
        pointerTrail.shift();
      }
    },

    velocity(now) {
      if (pointerTrail.length < 2) return { vx: 0, vy: 0 };
      const last = pointerTrail[pointerTrail.length - 1];
      if (now - last.t > THROW_STALE_MS) return { vx: 0, vy: 0 };
      const first = pointerTrail[0];
      const dt = last.t - first.t;
      if (dt <= 0) return { vx: 0, vy: 0 };
      return {
        vx: ((last.x - first.x) / dt) * STEP_MS,
        vy: ((last.y - first.y) / dt) * STEP_MS,
      };
    },

    clear() {
      pointerTrail.length = 0;
    },
  };
}
