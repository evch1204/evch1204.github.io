import { bounce, resolveCollision, resolveStatic } from './collisions';
import {
  CTA_CLICK_MAX_PX,
  DRAG_PENDULUM_DAMP,
  DRAG_PENDULUM_GRAVITY,
  DRAG_POINTER_DEAD,
  DRAG_POINTER_SWING,
  DRAG_ROT_MAX,
  DRAG_ROT_RESTORE,
  FLOOR_ROT_STRAIGHTEN,
  FLOOR_SPIN_DAMP,
  FRICTION_AIR,
  FRICTION_GROUND,
  GRAVITY,
  MAX_STEPS_PER_FRAME,
  SLEEP_ROT,
  SLEEP_VEL,
  STEP_MS,
  THROW_GAIN,
} from './constants';
import { createPointerTracker } from './pointer';
import type { BoolRef, CtaKind, PhysBody, StaticRect } from './types';

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

export type PlaygroundOptions = {
  /** Layer the physics blocks are appended to; its box is the world. */
  container: HTMLDivElement;
  /** Home screen root. Every `[data-phys="1"]` span inside it can be knocked down. */
  root: HTMLElement | null;
  /** The one-line instruction that appears once everything has dropped. */
  hint: HTMLDivElement;
  intro: HTMLElement | null;
  /** The italic line that stays put and acts as a shelf for the falling pieces. */
  shelf: HTMLElement | null;
  /** True while the visitor is on another tab: the loop stops, the bodies stay. */
  paused: BoolRef;
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
 */
export function createPlayground({
  container,
  root,
  hint,
  intro,
  shelf,
  paused,
  onCta,
}: PlaygroundOptions): Playground {
  let cancelled = false;
  const blockCleanups: (() => void)[] = [];

  container.replaceChildren();
  intro?.classList.remove('intro-launchable');

  for (const el of Array.from((root ?? document).querySelectorAll<HTMLSpanElement>('[data-phys="1"]'))) {
    el.removeAttribute('data-phys-launched');
    el.style.opacity = '';
  }
  hint.style.opacity = '0';

  const bodies: PhysBody[] = [];

  /*
   * The container and the shelf only move when the window does, so both are
   * measured once and reused. They used to be re-read several times per frame,
   * each read forcing a synchronous reflow right after the blocks had been
   * repositioned — that was the source of the hitching under the cursor.
   */
  let layoutDirty = true;
  let containerRect = container.getBoundingClientRect();

  function markLayoutDirty() {
    layoutDirty = true;
  }
  window.addEventListener('resize', markLayoutDirty);
  window.addEventListener('orientationchange', markLayoutDirty);

  function refreshLayout() {
    if (!layoutDirty) return;
    layoutDirty = false;
    containerRect = container.getBoundingClientRect();
    collectStaticTextRects();
  }

  function containerOffset(clientX: number, clientY: number) {
    return { x: clientX - containerRect.left, y: clientY - containerRect.top };
  }

  let dragging: PhysBody | null = null;
  let lastMX = 0;
  let lastMY = 0;
  let velDragX = 0;
  let dragPointerStartX = 0;
  let dragPointerStartY = 0;
  /** Grab offset from COM in unrotated body space (fixed at pointer-down). */
  let dragGrabLX = 0;
  let dragGrabLY = 0;
  /** Pointer in physics-container space while dragging (updated every move). */
  let dragPointerCX = 0;
  let dragPointerCY = 0;
  let physicsStarted = false;
  let rafId = 0;
  let lastFrameTs = 0;
  let accumulator = 0;

  const pointer = createPointerTracker();

  function refreshPointerVelocity(now: number) {
    const v = pointer.velocity(now);
    velDragX = v.vx;
  }

  function createPhysBlock(
    label: string,
    cls: string,
    x: number,
    y: number,
    vx: number,
    vy: number,
    sourceSpan: HTMLSpanElement,
    fixedW?: number,
    fixedH?: number,
    cta?: CtaKind,
    physInnerHtml?: string,
  ) {
    const el = document.createElement('div');
    el.className = `phys-block ${cls}`;
    if (physInnerHtml) {
      el.innerHTML = physInnerHtml;
      el.classList.add('phys-block--rich');
    } else {
      el.textContent = label;
    }
    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    if (fixedW) {
      el.style.width = `${fixedW}px`;
      el.style.minWidth = `${fixedW}px`;
    }
    container.appendChild(el);

    const w = fixedW || el.offsetWidth || 100;
    const h = fixedH || el.offsetHeight || 38;

    const body: PhysBody = {
      el,
      x,
      y,
      vx,
      vy,
      w,
      h,
      rot: 0,
      rotV: 0,
      sleeping: false,
      sleepTimer: 0,
      supported: false,
      cta,
      sourceSpan,
    };
    bodies.push(body);

    function startDrag(clientX: number, clientY: number) {
      if (body.sleeping) {
        body.sleeping = false;
        body.sleepTimer = 0;
      }
      dragging = body;
      const p = containerOffset(clientX, clientY);
      dragPointerCX = p.x;
      dragPointerCY = p.y;
      const cx = body.x + body.w / 2;
      const cy = body.y + body.h / 2;
      const r = (body.rot * Math.PI) / 180;
      const cos = Math.cos(r);
      const sin = Math.sin(r);
      const wx = p.x - cx;
      const wy = p.y - cy;
      dragGrabLX = wx * cos + wy * sin;
      dragGrabLY = -wx * sin + wy * cos;
      lastMX = clientX;
      lastMY = clientY;
      dragPointerStartX = clientX;
      dragPointerStartY = clientY;
      velDragX = 0;
      pointer.clear();
      pointer.push(clientX, clientY, performance.now());
      /*
       * Now that stacked blocks can sleep, pulling one out from under a pile
       * would leave whatever was resting on it frozen in mid-air. Waking the
       * lot on pointer-down is cheap at this body count and avoids that.
       */
      for (const other of bodies) {
        if (other === body) continue;
        other.sleeping = false;
        other.sleepTimer = 0;
      }
      body.rotV *= 0.35;
    }

    el.addEventListener('mousedown', (e) => {
      e.preventDefault();
      startDrag(e.clientX, e.clientY);
    });
    el.addEventListener(
      'touchstart',
      (e) => {
        e.preventDefault();
        const t = e.touches[0];
        startDrag(t.clientX, t.clientY);
      },
      { passive: false },
    );

    return body;
  }

  const staticRectsBuf: StaticRect[] = [];

  function collectStaticTextRects() {
    staticRectsBuf.length = 0;
    const cr = containerRect;
    const push = (el: HTMLElement | null) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return;
      staticRectsBuf.push({
        x: r.left - cr.left,
        y: r.top - cr.top,
        w: r.width,
        h: r.height,
      });
    };
    push(shelf);
  }

  function resolveAllStatics(iterations: number) {
    if (staticRectsBuf.length === 0) return;
    for (let iter = 0; iter < iterations; iter++) {
      for (let i = 0; i < bodies.length; i++) {
        const b = bodies[i];
        if (b.homing) continue;
        if (b.sleeping) continue;
        for (let k = 0; k < staticRectsBuf.length; k++) {
          resolveStatic(b, staticRectsBuf[k], dragging);
        }
      }
    }
  }

  /** Grab point fixed at pointer; COM swings under it — damped + biased toward level so it won’t run away. */
  function applyDragPendulum(b: PhysBody) {
    const px = dragPointerCX;
    const py = dragPointerCY;
    const vx = dragGrabLX;
    const vy = dragGrabLY;
    let rad = (b.rot * Math.PI) / 180;
    let cos = Math.cos(rad);
    let sin = Math.sin(rad);
    const rvx = vx * cos - vy * sin;
    const comX = px - rvx;
    const rx = comX - px;
    const tauG = rx * DRAG_PENDULUM_GRAVITY;
    const tauP =
      Math.abs(velDragX) > DRAG_POINTER_DEAD ? velDragX * DRAG_POINTER_SWING : 0;
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
  }

  /**
   * Position rides entirely on `transform`, so a frame is a compositor job
   * rather than a layout pass — writing left/top invalidated layout for every
   * block on every frame, and the rect reads below then forced it to flush.
   */
  function syncBodyDom(b: PhysBody) {
    b.el.style.transform = `translate3d(${b.x}px, ${b.y}px, 0) rotate(${b.rot}deg)`;
  }

  /**
   * One simulation step is always 1/60s of work. Integrating straight off rAF
   * tied the whole feel to the display: on a 120Hz panel gravity accumulated
   * twice as often per second (so blocks fell ~4x further in the first second)
   * and the per-frame damping constants bit twice as hard. Stepping a fixed
   * amount and letting fast displays take two steps keeps the tuned 60Hz feel
   * identical everywhere.
   */
  function stepPhysics() {
    const W = container.clientWidth;
    const H = container.clientHeight;

    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i];

      if (b.homing) continue;

      if (b === dragging) {
        applyDragPendulum(dragging);
        clampDragAgainstStatics();
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
      b.rotV *= 0.88;
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
        b.rotV *= 0.35;
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
        if (b.sleepTimer > 30) {
          b.vx = 0;
          b.vy = 0;
          b.rotV = 0;
          b.sleeping = true;
        }
      } else {
        b.sleepTimer = 0;
      }
    }

    resolveAllStatics(5);

    for (let iter = 0; iter < 3; iter++) {
      for (let i = 0; i < bodies.length; i++) {
        for (let j = i + 1; j < bodies.length; j++) {
          resolveCollision(bodies[i], bodies[j], dragging);
        }
      }
    }

    resolveAllStatics(3);
  }

  function tick(now: number) {
    if (cancelled) return;
    if (paused.current) {
      rafId = 0;
      lastFrameTs = 0;
      return;
    }

    refreshLayout();

    if (!lastFrameTs) lastFrameTs = now;
    // A backgrounded tab hands back a huge gap; clamp rather than fast-forward.
    accumulator += Math.min(now - lastFrameTs, 100);
    lastFrameTs = now;

    let steps = 0;
    while (accumulator >= STEP_MS && steps < MAX_STEPS_PER_FRAME) {
      if (dragging) refreshPointerVelocity(now);
      stepPhysics();
      accumulator -= STEP_MS;
      steps += 1;
    }
    if (steps === MAX_STEPS_PER_FRAME) accumulator = 0;

    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i];
      if (!b.homing) syncBodyDom(b);
    }

    if (bodies.length > 0 || dragging != null) {
      rafId = requestAnimationFrame(tick);
    } else {
      physicsStarted = false;
    }
  }

  function clampDragAgainstStatics() {
    if (!dragging) return;
    for (let iter = 0; iter < 8; iter++) {
      for (let k = 0; k < staticRectsBuf.length; k++) {
        resolveStatic(dragging, staticRectsBuf[k], dragging);
      }
    }
    syncBodyDom(dragging);
  }

  function onMouseMove(e: MouseEvent) {
    if (!dragging) return;
    pointer.push(e.clientX, e.clientY, e.timeStamp);
    const p = containerOffset(e.clientX, e.clientY);
    dragPointerCX = p.x;
    dragPointerCY = p.y;
    lastMX = e.clientX;
    lastMY = e.clientY;
  }

  function onTouchMove(e: TouchEvent) {
    if (!dragging) return;
    const t = e.touches[0];
    pointer.push(t.clientX, t.clientY, e.timeStamp);
    const p = containerOffset(t.clientX, t.clientY);
    dragPointerCX = p.x;
    dragPointerCY = p.y;
    lastMX = t.clientX;
    lastMY = t.clientY;
  }

  function endDrag() {
    if (dragging) {
      const b = dragging;
      const dist = Math.hypot(lastMX - dragPointerStartX, lastMY - dragPointerStartY);
      if (b.cta && dist < CTA_CLICK_MAX_PX) {
        onCta(b.cta);
      }

      const v = pointer.velocity(performance.now());
      b.vx = v.vx * THROW_GAIN;
      b.vy = v.vy * THROW_GAIN;
      b.rotV = b.rotV * 0.82 + v.vx * 0.26;
      b.sleeping = false;
      b.supported = false;
      dragging = null;
      pointer.clear();
    }
  }

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('touchmove', onTouchMove, { passive: false });
  document.addEventListener('mouseup', endDrag);
  document.addEventListener('touchend', endDrag);

  async function launchBlock(blockEl: HTMLSpanElement, cls: string, label: string, cta?: CtaKind) {
    const rect = blockEl.getBoundingClientRect();
    const cr = container.getBoundingClientRect();
    const x = rect.left - cr.left;
    const y = rect.top - cr.top;
    const vx = (Math.random() - 0.5) * 3;
    const vy = -1.5 + Math.random() * -2;
    const physInnerHtml = blockEl.dataset.physHtml === '1' ? blockEl.innerHTML : undefined;
    blockEl.style.opacity = '0';
    createPhysBlock(label, cls, x, y, vx, vy, blockEl, rect.width, rect.height, cta, physInnerHtml);
    if (!physicsStarted) {
      physicsStarted = true;
      rafId = requestAnimationFrame(tick);
    }
  }

  function getBlockLaunchConfigs(): {
    el: HTMLSpanElement;
    cls: string;
    label: string;
    cta?: CtaKind;
  }[] {
    if (!root) return [];
    return Array.from(root.querySelectorAll<HTMLSpanElement>('[data-phys="1"]')).map((el) => ({
      el,
      cls: el.dataset.physCls ?? '',
      label: el.textContent ?? '',
      cta: (el.dataset.physCta as CtaKind) || undefined,
    }));
  }

  /**
   * Everything drops at once when the button is pressed, in a quick cascade so
   * it reads as one gesture rather than ten separate taps.
   */
  async function runDropAll() {
    const configs = getBlockLaunchConfigs().filter(
      (c) => c.el.getAttribute('data-phys-launched') !== '1',
    );
    for (let i = 0; i < configs.length; i++) {
      if (cancelled) return;
      const { el, cls, label, cta } = configs[i];
      el.setAttribute('data-phys-launched', '1');
      void launchBlock(el, cls, label, cta);
      if (i < configs.length - 1) await sleep(70);
    }
    if (!cancelled) {
      hint.textContent = 'Drag them, toss them — tap a button while it is still to open it';
      hint.style.opacity = '1';
    }
  }

  function detachBlockLaunchers() {
    blockCleanups.forEach((fn) => fn());
    blockCleanups.length = 0;
    intro?.classList.remove('intro-launchable');
    root?.classList.remove('home-fall-ready');
  }

  function attachBlockLaunchers() {
    detachBlockLaunchers();
    const configs = getBlockLaunchConfigs();

    for (const { el, cls, label, cta } of configs) {
      const onActivate = () => {
        if (cancelled || el.getAttribute('data-phys-launched') === '1') return;
        el.setAttribute('data-phys-launched', '1');
        void launchBlock(el, cls, label, cta);
      };
      el.addEventListener('click', onActivate);
      blockCleanups.push(() => el.removeEventListener('click', onActivate));
    }

    intro?.classList.add('intro-launchable');
    root?.classList.add('home-fall-ready');
  }

  async function animateBodyHome(body: PhysBody): Promise<void> {
    const span = body.sourceSpan;
    body.homing = true;
    body.vx = 0;
    body.vy = 0;
    body.rotV = 0;
    body.sleeping = false;
    if (dragging === body) dragging = null;

    const sx = body.x;
    const sy = body.y;
    const sRot = body.rot;
    const duration = 300;

    await new Promise<void>((resolve) => {
      const start = performance.now();
      function frame(now: number) {
        if (cancelled) {
          body.homing = false;
          resolve();
          return;
        }
        const u = Math.min(1, (now - start) / duration);
        const e = easeOutCubic(u);
        const cr = container.getBoundingClientRect();
        const sr = span.getBoundingClientRect();
        const tx = sr.left - cr.left;
        const ty = sr.top - cr.top;

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
          const idx = bodies.indexOf(body);
          if (idx >= 0) bodies.splice(idx, 1);
          body.homing = false;
          resolve();
        }
      }
      requestAnimationFrame(frame);
    });
  }

  async function runResetHoming() {
    if (bodies.length === 0) {
      if (!cancelled) detachBlockLaunchers();
      return;
    }

    if (dragging) {
      dragging.vx = 0;
      dragging.vy = 0;
      dragging.rotV = 0;
      dragging = null;
    }

    try {
      hint.style.opacity = '0';
      detachBlockLaunchers();

      /*
       * All at once, with a short stagger so it still reads as a sweep rather
       * than a snap. Homing one body at a time meant the last pieces — the
       * header icons, which sit last in the DOM — stayed on the floor for
       * seconds after the button said the page was back.
       */
      const configs = getBlockLaunchConfigs();
      const flights: Promise<void>[] = [];
      for (let i = 0; i < configs.length; i++) {
        const body = bodies.find((b) => b.sourceSpan === configs[i].el);
        if (!body) continue;
        const delay = Math.min(flights.length * 26, 220);
        flights.push(sleep(delay).then(() => (cancelled ? undefined : animateBodyHome(body))));
      }
      await Promise.all(flights);
    } finally {
      if (!cancelled) {
        for (const cfg of getBlockLaunchConfigs()) {
          cfg.el.removeAttribute('data-phys-launched');
          cfg.el.style.opacity = '';
        }
        detachBlockLaunchers();
      }
    }
  }

  return {
    async dropAll() {
      if (cancelled) return;
      // Fonts and the responsive layout have settled by now; re-measure once.
      markLayoutDirty();
      refreshLayout();
      attachBlockLaunchers();
      await runDropAll();
    },

    async reset() {
      if (cancelled) return;
      await runResetHoming();
    },

    pause() {
      cancelAnimationFrame(rafId);
      rafId = 0;
      // Drop the elapsed time, or resuming would replay the whole gap.
      lastFrameTs = 0;
      accumulator = 0;
    },

    resume() {
      if (paused.current) return;
      if (!physicsStarted) return;
      if (bodies.length === 0 && dragging === null) return;
      if (rafId) return;
      rafId = requestAnimationFrame(tick);
    },

    destroy() {
      cancelled = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', markLayoutDirty);
      window.removeEventListener('orientationchange', markLayoutDirty);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('mouseup', endDrag);
      document.removeEventListener('touchend', endDrag);
      blockCleanups.forEach((fn) => fn());
      container.replaceChildren();
      intro?.classList.remove('intro-launchable');
      root?.classList.remove('home-fall-ready');
    },
  };
}
