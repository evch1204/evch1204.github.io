import { bounce, resolveCollision, resolveStatic } from './collisions';
import {
  AIR_SPIN_DAMP,
  FLOOR_ROT_STRAIGHTEN,
  FLOOR_SPIN_DAMP,
  FRICTION_AIR,
  FRICTION_GROUND,
  GRAVITY,
  LAND_SPIN_DAMP,
  PAIR_ITERATIONS,
  SLEEP_FRAMES,
  SLEEP_ROT,
  SLEEP_VEL,
  STATIC_ITERATIONS_POST,
  STATIC_ITERATIONS_PRE,
} from './constants';
import type { Drag } from './drag';
import { containBodies, type World } from './world';

/** Pushes every awake body clear of the one shelf, `iterations` times over. */
function resolveShelf(world: World, iterations: number) {
  const { shelf, bodies, dragging } = world;
  if (!shelf) return;
  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i];
      if (b.homing) continue;
      if (b.sleeping) continue;
      resolveStatic(b, shelf, dragging);
    }
  }
}

/**
 * One simulation step is always 1/60s of work. Integrating straight off rAF
 * tied the whole feel to the display: on a 120Hz panel gravity accumulated
 * twice as often per second (so blocks fell ~4x further in the first second)
 * and the per-frame damping constants bit twice as hard. Stepping a fixed
 * amount and letting fast displays take two steps keeps the tuned 60Hz feel
 * identical everywhere.
 */
export function stepPhysics(world: World, drag: Drag) {
  const { bodies } = world;
  const W = world.container.clientWidth;
  const H = world.container.clientHeight;

  for (let i = 0; i < bodies.length; i++) {
    const b = bodies[i];

    if (b.homing) continue;

    if (b === world.dragging) {
      drag.applyPendulum(b);
      drag.clampAgainstStatics();
      b.vx = 0;
      b.vy = 0;
      continue;
    }

    if (b.sleeping) continue;

    b.vy += GRAVITY;
    b.vx *= FRICTION_AIR;
    b.vy *= FRICTION_AIR;
    b.x += b.vx;
    b.y += b.vy;
    b.rot += b.rotV;
    b.rotV *= AIR_SPIN_DAMP;
    if (Math.abs(b.rotV) < 0.05) b.rotV = 0;

    let landed = false;

    if (b.x < 0) {
      b.x = 0;
      b.vx = bounce(b.vx);
    }
    if (b.x + b.w > W) {
      b.x = W - b.w;
      b.vx = -bounce(b.vx);
    }
    if (b.y < 0) {
      b.y = 0;
      b.vy = bounce(b.vy);
    }
    if (b.y + b.h > H) {
      b.y = H - b.h;
      b.vy = -bounce(b.vy);
      b.vx *= FRICTION_GROUND;
      b.rotV *= LAND_SPIN_DAMP;
      landed = true;
    }

    /*
     * A block resting on another block counts as settled too. Testing only
     * against the container floor meant anything in a stack kept running
     * gravity and the solver forever, which is what made a finished pile buzz.
     */
    const settled = landed || b.supported;
    b.supported = false;

    if (settled) {
      b.rotV *= FLOOR_SPIN_DAMP;
      b.rot *= FLOOR_ROT_STRAIGHTEN;
      if (Math.abs(b.rotV) < 0.12) b.rotV = 0;
      if (Math.abs(b.rot) < 0.4) b.rot = 0;
    }

    const speed = Math.abs(b.vx) + Math.abs(b.vy);
    if (speed < SLEEP_VEL && Math.abs(b.rotV) < SLEEP_ROT && settled) {
      b.sleepTimer = (b.sleepTimer || 0) + 1;
      if (b.sleepTimer > SLEEP_FRAMES) {
        b.vx = 0;
        b.vy = 0;
        b.rotV = 0;
        b.sleeping = true;
      }
    } else {
      b.sleepTimer = 0;
    }
  }

  resolveShelf(world, STATIC_ITERATIONS_PRE);

  for (let iter = 0; iter < PAIR_ITERATIONS; iter++) {
    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        resolveCollision(bodies[i], bodies[j], world.dragging);
      }
    }
  }

  resolveShelf(world, STATIC_ITERATIONS_POST);

  containBodies(world, W, H);
}
