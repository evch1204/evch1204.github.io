import type { PhysBody, StaticRect } from './types';

/**
 * One playground's state, passed explicitly to every module that touches it.
 * Nothing here is module-level, so two playgrounds could run side by side.
 */
export type World = {
  /** Layer the physics blocks are appended to; its box is the world. */
  container: HTMLDivElement;
  /** The italic line that stays put; the shelf rect below is measured from it. */
  shelfEl: HTMLElement | null;
  bodies: PhysBody[];
  /** The shelf in container space, or null while it is not on the page. */
  shelf: StaticRect | null;
  /** The body the pointer is holding: it is treated as immovable by the solvers. */
  dragging: PhysBody | null;
  containerRect: DOMRect;
  layoutDirty: boolean;
};

export function createWorld(container: HTMLDivElement, shelfEl: HTMLElement | null): World {
  return {
    container,
    shelfEl,
    bodies: [],
    shelf: null,
    dragging: null,
    containerRect: container.getBoundingClientRect(),
    layoutDirty: true,
  };
}

/** Marks the measurements stale: the next frame re-reads them, nothing else does. */
export function markLayoutDirty(world: World) {
  world.layoutDirty = true;
}

/*
 * The container and the shelf only move when the window does, so both are
 * measured once and reused. They used to be re-read several times per frame,
 * each read forcing a synchronous reflow right after the blocks had been
 * repositioned — that was the source of the hitching under the cursor.
 */
export function refreshLayout(world: World) {
  if (!world.layoutDirty) return;
  world.layoutDirty = false;
  world.containerRect = world.container.getBoundingClientRect();
  collectShelfRect(world);
}

export function containerOffset(world: World, clientX: number, clientY: number) {
  return { x: clientX - world.containerRect.left, y: clientY - world.containerRect.top };
}

/** The shelf in container space. A box too small to stand on counts as absent. */
export function collectShelfRect(world: World) {
  world.shelf = null;
  const el = world.shelfEl;
  if (!el) return;
  const r = el.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return;
  const cr = world.containerRect;
  world.shelf = { x: r.left - cr.left, y: r.top - cr.top, w: r.width, h: r.height };
}

/*
 * Position-only containment, last. The solver passes can push a body straight
 * through a wall or the floor, and a sleeping body never reaches the clamp at
 * the top of the step — on a narrow phone that reads as permanent drift off
 * the edge, so every body is pulled back in here.
 */
export function containBodies(world: World, W: number, H: number) {
  const { bodies, dragging } = world;
  for (let i = 0; i < bodies.length; i++) {
    const b = bodies[i];
    if (b.homing || b === dragging) continue;
    b.x = Math.max(0, Math.min(b.x, Math.max(0, W - b.w)));
    b.y = Math.max(0, Math.min(b.y, Math.max(0, H - b.h)));
  }
}
