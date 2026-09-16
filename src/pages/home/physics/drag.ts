import { syncBodyDom } from './blocks';
import { resolveStatic } from './collisions';
import {
  CTA_CLICK_MAX_PX,
  DRAG_CLAMP_ITERATIONS,
  DRAG_PENDULUM_DAMP,
  DRAG_PENDULUM_GRAVITY,
  DRAG_POINTER_DEAD,
  DRAG_POINTER_SWING,
  DRAG_ROT_MAX,
  DRAG_ROT_RESTORE,
  THROW_GAIN,
} from './constants';
import { createPointerTracker } from './pointer';
import type { CtaKind, PhysBody } from './types';
import { containerOffset, type World } from './world';

export type Drag = {
  /** Takes hold of `body`: the press that started it owns the drag until it ends. */
  grab(body: PhysBody, e: PointerEvent): void;
  move(e: PointerEvent): void;
  /** A finished press: throws the block, and taps a still one's button. */
  end(e: PointerEvent): void;
  /** An interrupted press: lets go without a throw, and never activates. */
  cancel(e: PointerEvent): void;
  /** Lets go with no throw and no tap, for when a flight takes the held body away. */
  forget(): void;
  /** Re-reads pointer speed for the step about to run. */
  refreshVelocity(now: number): void;
  applyPendulum(b: PhysBody): void;
  clampAgainstStatics(): void;
};

/**
 * The pointer's hold on one block. The held body is immovable to the solvers,
 * so it pushes the pile around rather than the other way about.
 */
export function createDrag(world: World, onCta: (kind: CtaKind) => void): Drag {
  /** The one pointer that owns the current drag; -1 when nothing is held. */
  let pointerId = -1;
  let lastMX = 0;
  let lastMY = 0;
  let velDragX = 0;
  let startX = 0;
  let startY = 0;
  /** Grab offset from COM in unrotated body space (fixed at pointer-down). */
  let grabLX = 0;
  let grabLY = 0;
  /** Pointer in `.home-physics` space while dragging (updated every move). */
  let pointerCX = 0;
  let pointerCY = 0;

  const pointer = createPointerTracker();

  /**
   * Ends the hold. `activate` is what separates a finished press from an
   * interrupted one: `pointercancel` means the pointer is gone, so there is
   * neither a throw to read from it nor a tap to honour — firing the CTA there
   * downloaded the resume from a press-and-hold the browser had taken away.
   */
  function finish(activate: boolean) {
    const b = world.dragging;
    if (b) {
      if (activate) {
        const dist = Math.hypot(lastMX - startX, lastMY - startY);
        if (b.cta && dist < CTA_CLICK_MAX_PX) {
          onCta(b.cta);
        }
      }

      const v = activate ? pointer.velocity(performance.now()) : { vx: 0, vy: 0 };
      b.vx = v.vx * THROW_GAIN;
      b.vy = v.vy * THROW_GAIN;
      b.rotV = b.rotV * 0.82 + v.vx * 0.26;
      b.sleeping = false;
      b.supported = false;
      world.dragging = null;
      pointer.clear();
    }
    pointerId = -1;
  }

  return {
    grab(body, e) {
      /* Capture keeps the move/up stream on this element even after the pointer
         leaves the window, so a drag can never stay welded to a gone pointer. */
      body.el.setPointerCapture(e.pointerId);
      pointerId = e.pointerId;

      if (body.sleeping) {
        body.sleeping = false;
        body.sleepTimer = 0;
      }
      world.dragging = body;
      const p = containerOffset(world, e.clientX, e.clientY);
      pointerCX = p.x;
      pointerCY = p.y;
      const cx = body.x + body.w / 2;
      const cy = body.y + body.h / 2;
      const r = (body.rot * Math.PI) / 180;
      const cos = Math.cos(r);
      const sin = Math.sin(r);
      const wx = p.x - cx;
      const wy = p.y - cy;
      grabLX = wx * cos + wy * sin;
      grabLY = -wx * sin + wy * cos;
      lastMX = e.clientX;
      lastMY = e.clientY;
      startX = e.clientX;
      startY = e.clientY;
      velDragX = 0;
      pointer.clear();
      pointer.push(e.clientX, e.clientY, performance.now());
      /*
       * Now that stacked blocks can sleep, pulling one out from under a pile
       * would leave whatever was resting on it frozen in mid-air. Waking the
       * lot on pointer-down is cheap at this body count and avoids that.
       */
      for (const other of world.bodies) {
        if (other === body) continue;
        other.sleeping = false;
        other.sleepTimer = 0;
      }
      body.rotV *= 0.35;
    },

    move(e) {
      if (!world.dragging || e.pointerId !== pointerId) return;
      pointer.push(e.clientX, e.clientY, e.timeStamp);
      const p = containerOffset(world, e.clientX, e.clientY);
      pointerCX = p.x;
      pointerCY = p.y;
      lastMX = e.clientX;
      lastMY = e.clientY;
    },

    /** Only the pointer that started the drag may end it. */
    end(e) {
      if (e.pointerId !== pointerId) return;
      finish(true);
    },

    cancel(e) {
      if (e.pointerId !== pointerId) return;
      finish(false);
    },

    forget() {
      world.dragging = null;
      pointerId = -1;
    },

    refreshVelocity(now) {
      velDragX = pointer.velocity(now).vx;
    },

    /** Grab point fixed at pointer; COM swings under it — damped + biased toward level so it won’t run away. */
    applyPendulum(b) {
      const px = pointerCX;
      const py = pointerCY;
      const vx = grabLX;
      const vy = grabLY;
      let rad = (b.rot * Math.PI) / 180;
      let cos = Math.cos(rad);
      let sin = Math.sin(rad);
      const rvx = vx * cos - vy * sin;
      const comX = px - rvx;
      const rx = comX - px;
      const tauG = rx * DRAG_PENDULUM_GRAVITY;
      const tauP = Math.abs(velDragX) > DRAG_POINTER_DEAD ? velDragX * DRAG_POINTER_SWING : 0;
      const inertia = Math.max(520, (b.w * b.w + b.h * b.h) * 0.55);
      b.rotV += (tauG + tauP) / inertia;
      b.rotV -= b.rot * DRAG_ROT_RESTORE;
      b.rotV *= DRAG_PENDULUM_DAMP;
      b.rotV = Math.max(-DRAG_ROT_MAX, Math.min(DRAG_ROT_MAX, b.rotV));
      if (Math.abs(b.rotV) < 0.02) b.rotV = 0;
      b.rot += b.rotV;
      rad = (b.rot * Math.PI) / 180;
      cos = Math.cos(rad);
      sin = Math.sin(rad);
      const rvx2 = vx * cos - vy * sin;
      const rvy2 = vx * sin + vy * cos;
      const cx = px - rvx2;
      const cy = py - rvy2;
      b.x = cx - b.w / 2;
      b.y = cy - b.h / 2;
    },

    /** A held block is immovable, so it takes extra passes to push it clear of the shelf. */
    clampAgainstStatics() {
      const b = world.dragging;
      if (!b) return;
      if (world.shelf) {
        for (let iter = 0; iter < DRAG_CLAMP_ITERATIONS; iter++) {
          resolveStatic(b, world.shelf, b);
        }
      }
      syncBodyDom(b);
    },
  };
}
