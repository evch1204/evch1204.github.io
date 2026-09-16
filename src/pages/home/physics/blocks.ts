import type { CtaKind, PhysBody } from './types';
import type { World } from './world';

export type PhysBlockSpec = {
  /** Plain text for a text-only block. */
  label: string;
  /** Space-separated `.phys-block` modifier classes. */
  cls: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** The span this clone stands in for, and flies back to on reset. */
  sourceSpan: HTMLSpanElement;
  /** Locked to the source's rect, so the clone can never reflow its own text. */
  width: number;
  height: number;
  cta?: CtaKind;
  /** Markup for a block that holds an icon as well as words. */
  innerHtml?: string;
};

/** A press on a clone: the body it landed on, and the event that owns the drag. */
export type GrabHandler = (body: PhysBody, e: PointerEvent) => void;

/** One fallable span, as the engine sees it before it becomes a body. */
export type LaunchConfig = {
  el: HTMLSpanElement;
  cls: string;
  label: string;
  cta?: CtaKind;
};

/**
 * Position rides entirely on `transform`, so a frame is a compositor job
 * rather than a layout pass — writing left/top invalidated layout for every
 * block on every frame, and the rect reads elsewhere then forced it to flush.
 */
export function syncBodyDom(b: PhysBody) {
  b.el.style.transform = `translate3d(${b.x}px, ${b.y}px, 0) rotate(${b.rot}deg)`;
}

function createPhysBlock(
  world: World,
  { label, cls, x, y, vx, vy, sourceSpan, width, height, cta, innerHtml }: PhysBlockSpec,
  onGrab: GrabHandler,
) {
  const el = document.createElement('div');
  el.className = `phys-block ${cls}`;
  if (innerHtml) {
    /*
     * The only source of this markup is what React rendered from the literals
     * in HomeScreen — an icon and a couple of spans. Routing any URL, user
     * input or fetched data into a `data-phys-html` span would make this
     * assignment stored XSS; keep the sources literal.
     */
    el.innerHTML = innerHtml;
    el.classList.add('phys-block--rich');
  } else {
    el.textContent = label;
  }
  el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  el.style.width = `${width}px`;
  el.style.minWidth = `${width}px`;
  world.container.appendChild(el);

  const body: PhysBody = {
    el,
    x,
    y,
    vx,
    vy,
    w: width,
    h: height,
    rot: 0,
    rotV: 0,
    sleeping: false,
    sleepTimer: 0,
    supported: false,
    cta,
    sourceSpan,
  };
  world.bodies.push(body);

  /*
   * One input path for mouse, pen and touch. `.phys-block` sets
   * `touch-action: none`, so a drag never turns into a page scroll, and the
   * document-level `pointercancel` handling means an interrupted touch can no
   * longer leave a block welded to a pointer that is gone.
   */
  el.addEventListener('pointerdown', (e) => {
    if (!e.isPrimary || e.button !== 0) return;
    e.preventDefault();
    onGrab(body, e);
  });

  return body;
}

/** Every fallable span inside `root`, in DOM order — which is cascade order too. */
export function readLaunchConfigs(root: HTMLElement | null): LaunchConfig[] {
  if (!root) return [];
  return Array.from(root.querySelectorAll<HTMLSpanElement>('[data-phys="1"]')).map((el) => ({
    el,
    cls: el.dataset.physCls ?? '',
    label: el.textContent ?? '',
    cta: (el.dataset.physCta as CtaKind) || undefined,
  }));
}

/** Hides the span and drops a clone of it into the world, right where it stood. */
export function launchBlock(world: World, { el, cls, label, cta }: LaunchConfig, onGrab: GrabHandler) {
  const rect = el.getBoundingClientRect();
  const cr = world.containerRect;
  el.style.opacity = '0';
  createPhysBlock(
    world,
    {
      label,
      cls,
      x: rect.left - cr.left,
      y: rect.top - cr.top,
      vx: (Math.random() - 0.5) * 3,
      vy: -1.5 + Math.random() * -2,
      sourceSpan: el,
      width: rect.width,
      height: rect.height,
      cta,
      innerHtml: el.dataset.physHtml === '1' ? el.innerHTML : undefined,
    },
    onGrab,
  );
}
