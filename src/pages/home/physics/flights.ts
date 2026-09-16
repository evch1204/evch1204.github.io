import { readLaunchConfigs, syncBodyDom, type LaunchConfig } from './blocks';
import type { Drag } from './drag';
import type { PhysBody } from './types';
import type { World } from './world';

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

type FlightsOptions = {
  world: World;
  /** Home screen root. Every `[data-phys="1"]` span inside it can be knocked down. */
  root: HTMLElement | null;
  /** The one-line instruction that appears once everything has dropped. */
  hint: HTMLDivElement;
  drag: Drag;
  /** Drops one span into the world and makes sure the loop is running. */
  launch: (cfg: LaunchConfig) => void;
  /** True once the playground has been destroyed; every flight bails out. */
  isCancelled: () => boolean;
};

/** The two scripted journeys: everything down at once, and everything home again. */
export function createFlights({ world, root, hint, drag, launch, isCancelled }: FlightsOptions) {
  /**
   * Everything drops at once when the button is pressed, in a quick cascade so
   * it reads as one gesture rather than ten separate taps.
   */
  async function dropAll() {
    const configs = readLaunchConfigs(root).filter(
      (c) => c.el.getAttribute('data-phys-launched') !== '1',
    );
    for (let i = 0; i < configs.length; i++) {
      if (isCancelled()) return;
      const cfg = configs[i];
      cfg.el.setAttribute('data-phys-launched', '1');
      launch(cfg);
      if (i < configs.length - 1) await sleep(70);
    }
    if (!isCancelled()) {
      hint.textContent = 'Drag them, toss them — tap a button while it is still to open it';
      hint.style.opacity = '1';
    }
  }

  async function animateBodyHome(body: PhysBody): Promise<void> {
    const span = body.sourceSpan;
    body.homing = true;
    body.vx = 0;
    body.vy = 0;
    body.rotV = 0;
    body.sleeping = false;
    if (world.dragging === body) drag.forget();

    const sx = body.x;
    const sy = body.y;
    const sRot = body.rot;
    const duration = 300;

    /* Both ends of the flight hold still for its whole 300ms, so they are read
       once: measuring them again every frame forced a reflow per block per frame. */
    const cr = world.container.getBoundingClientRect();
    const sr = span.getBoundingClientRect();
    const tx = sr.left - cr.left;
    const ty = sr.top - cr.top;

    await new Promise<void>((resolve) => {
      const start = performance.now();
      function frame(now: number) {
        if (isCancelled()) {
          body.homing = false;
          resolve();
          return;
        }
        const u = Math.min(1, (now - start) / duration);
        const e = easeOutCubic(u);

        body.x = sx + (tx - sx) * e;
        body.y = sy + (ty - sy) * e;
        body.rot = sRot * (1 - e);
        syncBodyDom(body);

        if (u < 1) {
          requestAnimationFrame(frame);
        } else {
          span.style.opacity = '1';
          span.removeAttribute('data-phys-launched');
          body.el.remove();
          const idx = world.bodies.indexOf(body);
          if (idx >= 0) world.bodies.splice(idx, 1);
          body.homing = false;
          resolve();
        }
      }
      requestAnimationFrame(frame);
    });
  }

  /** Every block flies back to the span it came from, and the spans reappear. */
  async function resetHome() {
    if (world.bodies.length === 0) return;

    if (world.dragging) {
      world.dragging.vx = 0;
      world.dragging.vy = 0;
      world.dragging.rotV = 0;
      drag.forget();
    }

    try {
      hint.style.opacity = '0';

      /*
       * All at once, with a short stagger so it still reads as a sweep rather
       * than a snap. Homing one body at a time meant the last pieces — the
       * header icons, which sit last in the DOM — stayed on the floor for
       * seconds after the button said the page was back.
       */
      const configs = readLaunchConfigs(root);
      const flights: Promise<void>[] = [];
      for (let i = 0; i < configs.length; i++) {
        const body = world.bodies.find((b) => b.sourceSpan === configs[i].el);
        if (!body) continue;
        const delay = Math.min(flights.length * 26, 220);
        flights.push(sleep(delay).then(() => (isCancelled() ? undefined : animateBodyHome(body))));
      }
      await Promise.all(flights);
    } finally {
      if (!isCancelled()) {
        for (const cfg of readLaunchConfigs(root)) {
          cfg.el.removeAttribute('data-phys-launched');
          cfg.el.style.opacity = '';
        }
      }
    }
  }

  return { dropAll, resetHome };
}
