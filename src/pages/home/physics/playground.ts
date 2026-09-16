import { launchBlock, readLaunchConfigs, syncBodyDom, type LaunchConfig } from './blocks';
import { createDrag } from './drag';
import { createFlights } from './flights';
import { createLoop } from './loop';
import { stepPhysics } from './solver';
import type { CtaKind } from './types';
import { createWorld, markLayoutDirty, refreshLayout } from './world';

type PlaygroundOptions = {
  /** Layer the physics blocks are appended to; its box is the world. */
  container: HTMLDivElement;
  /** Home screen root. Every `[data-phys="1"]` span inside it can be knocked down. */
  root: HTMLElement | null;
  /** The one-line instruction that appears once everything has dropped. */
  hint: HTMLDivElement;
  /** The italic line that stays put and acts as a shelf for the falling pieces. */
  shelf: HTMLElement | null;
  /** Tapping a still block runs this instead of the engine knowing any URLs. */
  onCta: (kind: CtaKind) => void;
};

export type Playground = {
  /** Drops every block that is still in place, in one quick cascade. */
  dropAll(): Promise<void>;
  /** Flies every block back to the span it came from. */
  reset(): Promise<void>;
  pause(): void;
  resume(): void;
  destroy(): void;
};

/**
 * The home screen's block physics, in plain DOM. React creates this once on
 * mount and destroys it on unmount; nothing in here re-renders anything.
 *
 * This file only wires the pieces together: `world` holds the state, `solver`
 * steps it, `drag` owns the pointer, `blocks` turns spans into bodies, `loop`
 * keeps the clock and `flights` runs the two scripted journeys.
 */
export function createPlayground({
  container,
  root,
  hint,
  shelf,
  onCta,
}: PlaygroundOptions): Playground {
  let cancelled = false;

  container.replaceChildren();

  for (const cfg of readLaunchConfigs(root ?? document.body)) {
    cfg.el.removeAttribute('data-phys-launched');
    cfg.el.style.opacity = '';
  }
  hint.style.opacity = '0';

  const world = createWorld(container, shelf);
  const drag = createDrag(world, onCta);

  const onLayoutChange = () => markLayoutDirty(world);
  window.addEventListener('resize', onLayoutChange);
  window.addEventListener('orientationchange', onLayoutChange);
  /* On phones `.home-screen` scrolls under the fixed `.home-physics` layer, so
     the shelf's viewport rect moves without a resize; capture catches that. */
  document.addEventListener('scroll', onLayoutChange, { capture: true, passive: true });

  const onPointerMove = (e: PointerEvent) => drag.move(e);
  const onPointerUp = (e: PointerEvent) => drag.end(e);
  const onPointerCancel = (e: PointerEvent) => drag.cancel(e);
  document.addEventListener('pointermove', onPointerMove);
  document.addEventListener('pointerup', onPointerUp);
  document.addEventListener('pointercancel', onPointerCancel);

  const loop = createLoop({
    step: (now) => {
      refreshLayout(world);
      if (world.dragging) drag.refreshVelocity(now);
      stepPhysics(world, drag);
    },
    sync: () => {
      const { bodies } = world;
      for (let i = 0; i < bodies.length; i++) {
        const b = bodies[i];
        if (!b.homing) syncBodyDom(b);
      }
    },
    /** A held body is one of the bodies, so this covers a drag as well. */
    alive: () => world.bodies.length > 0,
  });

  const launch = (cfg: LaunchConfig) => {
    launchBlock(world, cfg, drag.grab);
    loop.start();
  };

  const flights = createFlights({
    world,
    root,
    hint,
    drag,
    launch,
    isCancelled: () => cancelled,
  });

  return {
    async dropAll() {
      if (cancelled) return;
      // Fonts and the responsive layout have settled by now; re-measure once.
      markLayoutDirty(world);
      refreshLayout(world);
      await flights.dropAll();
    },

    async reset() {
      if (cancelled) return;
      await flights.resetHome();
    },

    pause() {
      loop.pause();
    },

    resume() {
      loop.resume();
    },

    destroy() {
      cancelled = true;
      loop.stop();
      window.removeEventListener('resize', onLayoutChange);
      window.removeEventListener('orientationchange', onLayoutChange);
      document.removeEventListener('scroll', onLayoutChange, { capture: true });
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('pointercancel', onPointerCancel);
      container.replaceChildren();
    },
  };
}
