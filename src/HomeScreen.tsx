import { useEffect, useRef, useState } from 'react';
import {
  Clock,
  CodeXml,
  Download,
  Github,
  GraduationCap,
  Hand,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  User,
  Zap,
} from 'lucide-react';
import SiteFooter from './SiteFooter';
import './home-screen.css';

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

type PhysBody = {
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
  cta?: 'projects' | 'resume' | 'github' | 'linkedin' | 'mail';
  sourceSpan: HTMLSpanElement;
  homing?: boolean;
};

/** Axis-aligned obstacles (the italic line, which stays put) in physics-container space. */
type StaticRect = { x: number; y: number; w: number; h: number };

/** Where Tei actually is, for the live clock in the details list. */
const HOME_TIMEZONE = 'America/Los_Angeles';

/** Minutes that `tz` is offset from UTC at `at`, DST included. */
function tzOffsetMinutes(tz: string, at: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(at);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? '0');
  // Intl renders midnight as hour 24; Date.UTC wants 0.
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'), get('second'));
  return Math.round((asUtc - at.getTime()) / 60000);
}

/**
 * Tei's wall clock, plus how far it sits from the visitor's own — the suffix is
 * relative to whoever is reading, so it says something different in every city.
 */
function readLocalClock(at = new Date()) {
  const time = new Intl.DateTimeFormat('en-US', {
    timeZone: HOME_TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
  }).format(at);

  const deltaMinutes = tzOffsetMinutes(HOME_TIMEZONE, at) - -at.getTimezoneOffset();
  if (deltaMinutes === 0) return { time, delta: '// same time as you' };

  const hours = Math.abs(deltaMinutes) / 60;
  const rounded = Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
  return { time, delta: `// ${rounded}h ${deltaMinutes > 0 ? 'ahead' : 'behind'}` };
}

const GRAVITY = 0.4;
const RESTITUTION = 0.55;
const FRICTION_GROUND = 0.78;
const FRICTION_AIR = 0.995;
const SLEEP_VEL = 0.4;
const SLEEP_ROT = 0.08;
const CTA_CLICK_MAX_PX = 18;
const RESUME_DOWNLOAD_FILENAME = 'CV_Tei_Chang.pdf';

/** One simulation step, so the feel is the same on a 60Hz and a 120Hz display. */
const STEP_MS = 1000 / 60;
const MAX_STEPS_PER_FRAME = 3;
/**
 * Below this approach speed a contact just stops instead of bouncing. Without it
 * a single step of gravity is enough to make a resting block jitter forever.
 */
const RESTITUTION_MIN_SPEED = 1.5;
/** Allowed penetration. Correcting all the way every step is what buzzes. */
const PENETRATION_ALLOWANCE = 0.4;
const POSITION_CORRECTION = 0.8;
/** Trailing window used to estimate throw speed on release. */
const THROW_SAMPLE_MS = 90;
/** A pointer that has been still this long throws nothing, however fast it moved before. */
const THROW_STALE_MS = 100;
const THROW_GAIN = 1.4;

/** Drag: gravity torque about grab point (dangle; damped so it settles). */
const DRAG_PENDULUM_GRAVITY = 0.055;
const DRAG_PENDULUM_DAMP = 0.88;
const DRAG_POINTER_SWING = 0.028;
/** Kept small: this opposes the gravity torque, so a large value pins the block level. */
const DRAG_ROT_RESTORE = 0.015;
/** Small enough that a slow drag still swings instead of kicking past a threshold. */
const DRAG_POINTER_DEAD = 0.15;
const DRAG_ROT_MAX = 3.2;
/** On floor: extra spin decay + gentle straighten toward level (not instant snap). */
const FLOOR_SPIN_DAMP = 0.68;
const FLOOR_ROT_STRAIGHTEN = 0.91;

export type HomeScreenProps = {
  onViewProjects?: () => void;
  resumeUrl?: string;
  /** When true (user navigated away), physics rAF pauses but block positions stay in memory. */
  isPaused?: boolean;
};

export default function HomeScreen({ onViewProjects, resumeUrl, isPaused = false }: HomeScreenProps) {
  /** Physics is opt-in: nothing is grabbable until the visitor presses the button. */
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const pausedRef = useRef(isPaused);
  pausedRef.current = isPaused;
  const physicsControlsRef = useRef<{ pause: () => void; resume: () => void } | null>(null);
  const physContainerRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const homeRootRef = useRef<HTMLDivElement>(null);
  /** The italic line stays put and acts as a shelf the falling pieces land on. */
  const staticLineRef = useRef<HTMLParagraphElement>(null);

  const onViewProjectsRef = useRef(onViewProjects);
  const resumeUrlRef = useRef(resumeUrl);
  onViewProjectsRef.current = onViewProjects;
  resumeUrlRef.current = resumeUrl;

  const dropAllRef = useRef<(() => Promise<void>) | null>(null);
  const resetHomingRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    let cancelled = false;
    const blockCleanups: (() => void)[] = [];

    const physContainer = physContainerRef.current;
    const hint = hintRef.current;
    const introEl = introRef.current;
    if (!physContainer || !hint) return;

    physContainer.replaceChildren();
    introEl?.classList.remove('intro-launchable');

    for (const el of Array.from(
      (homeRootRef.current ?? document).querySelectorAll<HTMLSpanElement>('[data-phys="1"]'),
    )) {
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
    let containerRect = physContainer.getBoundingClientRect();

    function markLayoutDirty() {
      layoutDirty = true;
    }
    window.addEventListener('resize', markLayoutDirty);
    window.addEventListener('orientationchange', markLayoutDirty);

    function refreshLayout() {
      if (!layoutDirty) return;
      layoutDirty = false;
      containerRect = physContainer.getBoundingClientRect();
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

    /** Reflect a velocity off a surface, but only bounce if it arrived with real speed. */
    function bounce(v: number) {
      const speed = Math.abs(v);
      return speed > RESTITUTION_MIN_SPEED ? speed * RESTITUTION : 0;
    }

    /*
     * Throw speed comes from a short trail of timestamped pointer positions
     * rather than an average of per-event deltas. Deltas are "px per event", and
     * event rate has nothing to do with frame rate — so the old estimate varied
     * with the mouse's polling rate, and worse, it never decayed while the
     * pointer was held still, which let a stationary hand fling a block.
     */
    type PointerSample = { x: number; y: number; t: number };
    const pointerTrail: PointerSample[] = [];

    function pushPointerSample(clientX: number, clientY: number, t: number) {
      pointerTrail.push({ x: clientX, y: clientY, t });
      while (pointerTrail.length > 2 && t - pointerTrail[0].t > THROW_SAMPLE_MS) {
        pointerTrail.shift();
      }
    }

    /** Pointer speed in px per simulation step, or zero if it has gone still. */
    function pointerVelocity(now: number) {
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
    }

    function refreshPointerVelocity(now: number) {
      const v = pointerVelocity(now);
      velDragX = v.vx;
    }

    function triggerResumeDownload() {
      const href = resumeUrlRef.current;
      if (!href) return;
      const a = document.createElement('a');
      a.href = href;
      a.download = RESUME_DOWNLOAD_FILENAME;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
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
      cta?: PhysBody['cta'],
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
      physContainer.appendChild(el);

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
        pointerTrail.length = 0;
        pushPointerSample(clientX, clientY, performance.now());
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

    function resolveCollision(a: PhysBody, b: PhysBody) {
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
      push(staticLineRef.current);
    }

    /** Immovable typed-text regions: blocks bounce or slide off like platforms/walls. */
    function resolveStatic(b: PhysBody, s: StaticRect) {
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

    function resolveAllStatics(iterations: number) {
      if (staticRectsBuf.length === 0) return;
      for (let iter = 0; iter < iterations; iter++) {
        for (let i = 0; i < bodies.length; i++) {
          const b = bodies[i];
          if (b.homing) continue;
          if (b.sleeping) continue;
          for (let k = 0; k < staticRectsBuf.length; k++) {
            resolveStatic(b, staticRectsBuf[k]);
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
      const W = physContainer.clientWidth;
      const H = physContainer.clientHeight;

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
            resolveCollision(bodies[i], bodies[j]);
          }
        }
      }

      resolveAllStatics(3);
    }

    function tick(now: number) {
      if (cancelled) return;
      if (pausedRef.current) {
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
          resolveStatic(dragging, staticRectsBuf[k]);
        }
      }
      syncBodyDom(dragging);
    }

    function onMouseMove(e: MouseEvent) {
      if (!dragging) return;
      pushPointerSample(e.clientX, e.clientY, e.timeStamp);
      const p = containerOffset(e.clientX, e.clientY);
      dragPointerCX = p.x;
      dragPointerCY = p.y;
      lastMX = e.clientX;
      lastMY = e.clientY;
    }

    function onTouchMove(e: TouchEvent) {
      if (!dragging) return;
      const t = e.touches[0];
      pushPointerSample(t.clientX, t.clientY, e.timeStamp);
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
          if (b.cta === 'projects') {
            onViewProjectsRef.current?.();
          } else if (b.cta === 'resume') {
            triggerResumeDownload();
          } else if (b.cta === 'github') {
            window.open('https://github.com/evch1204', '_blank', 'noopener,noreferrer');
          } else if (b.cta === 'linkedin') {
            window.open('https://www.linkedin.com/in/evan-chang1/', '_blank', 'noopener,noreferrer');
          } else if (b.cta === 'mail') {
            window.location.href = 'mailto:changtei1204@gmail.com';
          }
        }

        const v = pointerVelocity(performance.now());
        b.vx = v.vx * THROW_GAIN;
        b.vy = v.vy * THROW_GAIN;
        b.rotV = b.rotV * 0.82 + v.vx * 0.26;
        b.sleeping = false;
        b.supported = false;
        dragging = null;
        pointerTrail.length = 0;
      }
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchend', endDrag);

    async function launchBlock(
      blockEl: HTMLSpanElement,
      cls: string,
      label: string,
      cta?: PhysBody['cta'],
    ) {
      const rect = blockEl.getBoundingClientRect();
      const cr = physContainer.getBoundingClientRect();
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
      cta?: PhysBody['cta'];
    }[] {
      const root = homeRootRef.current;
      if (!root) return [];
      return Array.from(root.querySelectorAll<HTMLSpanElement>('[data-phys="1"]')).map((el) => ({
        el,
        cls: el.dataset.physCls ?? '',
        label: el.textContent ?? '',
        cta: (el.dataset.physCta as PhysBody['cta']) || undefined,
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
      introEl?.classList.remove('intro-launchable');
      homeRootRef.current?.classList.remove('home-fall-ready');
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

      introEl?.classList.add('intro-launchable');
      homeRootRef.current?.classList.add('home-fall-ready');
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
          const cr = physContainer.getBoundingClientRect();
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

    dropAllRef.current = async () => {
      if (cancelled) return;
      setBusy(true);
      try {
        // Fonts and the responsive layout have settled by now; re-measure once.
        markLayoutDirty();
        refreshLayout();
        attachBlockLaunchers();
        await runDropAll();
      } finally {
        setBusy(false);
      }
    };

    resetHomingRef.current = async () => {
      if (cancelled) return;
      setBusy(true);
      try {
        await runResetHoming();
      } finally {
        setBusy(false);
      }
    };

    physicsControlsRef.current = {
      pause: () => {
        cancelAnimationFrame(rafId);
        rafId = 0;
        // Drop the elapsed time, or resuming would replay the whole gap.
        lastFrameTs = 0;
        accumulator = 0;
      },
      resume: () => {
        if (pausedRef.current) return;
        if (!physicsStarted) return;
        if (bodies.length === 0 && dragging === null) return;
        if (rafId) return;
        rafId = requestAnimationFrame(tick);
      },
    };


    return () => {
      cancelled = true;
      resetHomingRef.current = null;
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', markLayoutDirty);
      window.removeEventListener('orientationchange', markLayoutDirty);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('mouseup', endDrag);
      document.removeEventListener('touchend', endDrag);
      blockCleanups.forEach((fn) => fn());
      physContainer.replaceChildren();
      introEl?.classList.remove('intro-launchable');
      homeRootRef.current?.classList.remove('home-fall-ready');
      physicsControlsRef.current = null;
    };
  }, []);

  useEffect(() => {
    const ctl = physicsControlsRef.current;
    if (!ctl) return;
    if (isPaused) ctl.pause();
    else ctl.resume();
  }, [isPaused]);

  const [clock, setClock] = useState(() => readLocalClock());

  useEffect(() => {
    if (isPaused) return;
    const id = window.setInterval(() => setClock(readLocalClock()), 30_000);
    return () => window.clearInterval(id);
  }, [isPaused]);

  /**
   * At rest the buttons and social icons are ordinary controls. Once armed they
   * become physics bodies, and the clone handles the click instead — so these
   * bail out to avoid firing twice.
   */
  const openProjects = () => {
    if (armed) return;
    onViewProjects?.();
  };

  const downloadResume = () => {
    if (armed || !resumeUrl) return;
    const a = document.createElement('a');
    a.href = resumeUrl;
    a.download = RESUME_DOWNLOAD_FILENAME;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const openExternal = (href: string) => () => {
    if (armed) return;
    if (href.startsWith('mailto:')) window.location.href = href;
    else window.open(href, '_blank', 'noopener,noreferrer');
  };

  const togglePlayground = () => {
    if (busy) return;
    if (armed) {
      setArmed(false);
      void resetHomingRef.current?.();
    } else {
      setArmed(true);
      void dropAllRef.current?.();
    }
  };

  return (
    <div className={`home-screen${armed ? ' home-armed' : ''}`} ref={homeRootRef}>
      <div className="grain" aria-hidden />

      <div id="intro" ref={introRef}>
        <div className="home-block">
          <h1 className="home-greeting">
            <span className="word-block greet" data-phys="1" data-phys-cls="greet">
              Hello,
            </span>
            <span className="word-block greet" data-phys="1" data-phys-cls="greet">
              I&apos;m
            </span>
            <span className="word-block greet" data-phys="1" data-phys-cls="greet">
              Tei
            </span>
            <span className="word-block greet" data-phys="1" data-phys-cls="greet">
              Chang
            </span>
            <span
              className="word-block hand-wave-block"
              data-phys="1"
              data-phys-cls="hand-wave"
              data-phys-html="1"
              aria-hidden
            >
              <Hand className="home-hand-svg" strokeWidth={2} aria-hidden />
            </span>
          </h1>

          {/* Stays put while everything else falls, so the pieces have a shelf to land on. */}
          <p className="home-lede" ref={staticLineRef}>
            I work in data science, software engineering and machine learning.
          </p>

          <div className="home-facts">
            <span
              className="word-block fact fact-wide"
              data-phys="1"
              data-phys-cls="fact"
              data-phys-html="1"
            >
              <CodeXml size={16} strokeWidth={2} aria-hidden />
              <span className="fact-v">Software Engineer at @DeepSpace</span>
              <span className="fact-m">// open to work</span>
            </span>

            <span className="word-block fact" data-phys="1" data-phys-cls="fact" data-phys-html="1">
              <MapPin size={16} strokeWidth={2} aria-hidden />
              <span className="fact-v">Santa Clara, CA</span>
            </span>
            <span className="word-block fact" data-phys="1" data-phys-cls="fact" data-phys-html="1">
              <Clock size={16} strokeWidth={2} aria-hidden />
              <span className="fact-v">{clock.time}</span>
              <span className="fact-m">{clock.delta}</span>
            </span>

            <span className="word-block fact" data-phys="1" data-phys-cls="fact" data-phys-html="1">
              <GraduationCap size={16} strokeWidth={2} aria-hidden />
              <span className="fact-v">B.S. Computer Science, SCU &apos;25</span>
            </span>
            <span className="word-block fact" data-phys="1" data-phys-cls="fact" data-phys-html="1">
              <User size={16} strokeWidth={2} aria-hidden />
              <span className="fact-v">he/him</span>
            </span>

            <span className="word-block fact" data-phys="1" data-phys-cls="fact" data-phys-html="1">
              <Mail size={16} strokeWidth={2} aria-hidden />
              <span className="fact-v">changtei1204@gmail.com</span>
            </span>
            <span className="word-block fact" data-phys="1" data-phys-cls="fact" data-phys-html="1">
              <Phone size={16} strokeWidth={2} aria-hidden />
              <span className="fact-v">+1 (301) 768-8151</span>
            </span>
          </div>

          <div className="home-actions">
            <span
              className="word-block action action-primary"
              data-phys="1"
              data-phys-cls="cta cta-primary"
              data-phys-cta="projects"
              role="button"
              tabIndex={armed ? -1 : 0}
              onClick={openProjects}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openProjects();
                }
              }}
            >
              View projects
            </span>
            <span
              className="word-block action"
              data-phys="1"
              data-phys-cls="cta"
              data-phys-cta="resume"
              data-phys-html="1"
              role="button"
              tabIndex={armed ? -1 : 0}
              onClick={downloadResume}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  downloadResume();
                }
              }}
            >
              <Download size={14} strokeWidth={2} aria-hidden />
              <span>Resume</span>
            </span>
          </div>
        </div>
      </div>

      <div id="physics-container" ref={physContainerRef} />

      {/* Same row layout as the App header: left | nav (invisible width) | socials */}
      <div
        className="home-floating-socials fixed top-8 left-0 right-0 z-[45] px-6 flex items-center gap-4 pointer-events-none"
        aria-label="Social links"
      >
        <div className="flex-1 min-w-0" aria-hidden />
        <nav
          className="home-floating-nav-spacer shrink-0 p-1.5 flex items-center gap-1 rounded-full border border-transparent opacity-0 pointer-events-none select-none"
          aria-hidden
        >
          {(['Home', 'About', 'Experience', 'Projects', 'Contact'] as const).map((label) => (
            <span
              key={label}
              className="relative px-6 py-2 text-sm font-semibold rounded-full whitespace-nowrap text-transparent"
            >
              {label}
            </span>
          ))}
        </nav>
        <div className="flex-1 min-w-0 flex justify-end items-center gap-5">
          <span
            className="word-block home-social-fall"
            data-phys="1"
            data-phys-cls="social-github"
            data-phys-cta="github"
            data-phys-html="1"
            role="link"
            tabIndex={armed ? -1 : 0}
            aria-label="GitHub"
            title="GitHub"
            onClick={openExternal('https://github.com/evch1204')}
          >
            <Github size={22} strokeWidth={2} className="home-social-icon" aria-hidden />
          </span>
          <span
            className="word-block home-social-fall"
            data-phys="1"
            data-phys-cls="social-linkedin"
            data-phys-cta="linkedin"
            data-phys-html="1"
            role="link"
            tabIndex={armed ? -1 : 0}
            aria-label="LinkedIn"
            title="LinkedIn"
            onClick={openExternal('https://www.linkedin.com/in/evan-chang1/')}
          >
            <Linkedin size={22} strokeWidth={2} className="home-social-icon" aria-hidden />
          </span>
          <span
            className="word-block home-social-fall"
            data-phys="1"
            data-phys-cls="social-mail"
            data-phys-cta="mail"
            data-phys-html="1"
            role="link"
            tabIndex={armed ? -1 : 0}
            aria-label="Email"
            title="Email"
            onClick={openExternal('mailto:changtei1204@gmail.com')}
          >
            <Mail size={22} strokeWidth={2} className="home-social-icon" aria-hidden />
          </span>
        </div>
      </div>

      <div className="home-playground">
        {!armed && (
          <>
            <span className="home-playground-nudge">try pressing this button</span>
            <svg
              className="home-playground-arrow"
              width="26"
              height="16"
              viewBox="0 0 26 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M1 3c7 0 13 2.6 18.5 5" />
              <path d="M15.5 3.5 20 8l-5 1.6" />
            </svg>
          </>
        )}
        <button
          type="button"
          className="home-playground-btn"
          onClick={togglePlayground}
          disabled={busy}
          aria-pressed={armed}
        >
          {armed ? (
            <RotateCcw size={14} strokeWidth={2.4} aria-hidden />
          ) : (
            <Zap size={14} strokeWidth={2.4} aria-hidden />
          )}
          {armed ? 'Put it back' : 'Knock it down'}
        </button>
      </div>

      {/* The shared footer, pinned to the bottom instead of ending a scroll. */}
      <div className="home-footer-slot">
        <div className="mx-auto w-full max-w-6xl px-6">
          <SiteFooter className="pt-10 pb-8" />
        </div>
      </div>

      <div id="hint" ref={hintRef} />
    </div>
  );
}
