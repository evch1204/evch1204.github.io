import { useEffect, type RefObject } from 'react';
import { useReducedMotion } from 'motion/react';
import { useLatest } from '@/hooks/useLatest';

type Point = [number, number];

type BurstRefs = {
  /** The hero: where the drawings, the drops and the dot are found. */
  hero: RefObject<HTMLDivElement | null>;
  /** The hello's stroke; the drops set off from its tail. */
  helloPath: RefObject<SVGPathElement | null>;
  /** The dot in the line under the name, where the last drop lands. */
  dot: RefObject<HTMLSpanElement | null>;
};

type BurstEvents = {
  /** A drop has reached this drawing: write it. */
  onDrawn: (id: string) => void;
  onNameUp: () => void;
  onWhereUp: () => void;
  /** The last drop has landed, or the reader skipped ahead. */
  onDone: () => void;
};

/** ms after the drain starts before the first drop leaves, so the ink is seen going. */
const DEPART = 300;
/** ms between one drop leaving and the next: a burst, not a single blob. */
const STAGGER = 40;
/** px per ms of flight, and the shortest and longest a flight may take. */
const SPEED = 1.3;
const FLIGHT_MIN = 650;
const FLIGHT_MAX = 1000;
/** ms a drop presses on arrival before its ink is the drawing's. */
const DAB = 160;
/** ms after the last drawing's drop has landed before the dot's drop does. */
const DOT_AFTER = 260;
/** The dot's drop at landing: the dot it becomes is smaller than a drop. */
const LANDED_SCALE = 0.45;
/** Where in the flight the name and the role line rise, as a share of the dot drop's arrival. */
const NAME_AT = 0.45;
const WHERE_AT = 0.72;

const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);

/** A point on a quadratic curve from `a` to `b` that bows out through `c`. */
const bend = (a: Point, c: Point, b: Point, t: number): Point => {
  const u = 1 - t;
  return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]];
};

const centreIn = (el: Element, base: DOMRect): Point => {
  const r = el.getBoundingClientRect();
  return [r.left + r.width / 2 - base.left, r.top + r.height / 2 - base.top];
};

/**
 * The burst. While `active`, the ink that drained out of the hello leaves
 * its tail as a scatter of drops, one for every drawing on screen (anything
 * with a `data-ink`, in the order its `data-ink-at` gives) and one more for
 * the dot under the name. Each drop bows out along its own curve, presses on
 * arrival and gives its ink to the drawing, which starts the moment it
 * lands, so the whole sheet is written in at once. The name rises
 * while the drops are in the air; the dot's drop lands last and becomes the
 * dot. A tap, Enter, Space or Escape skips to the end, and so does a change
 * of window width, since the flights were measured for the old one. The
 * drops are moved on the DOM directly each frame; nothing React needs to
 * re-render for.
 */
export function useInkBurst(active: boolean, refs: BurstRefs, events: BurstEvents) {
  const reduced = useReducedMotion();
  const eventsRef = useLatest(events);

  useEffect(() => {
    if (!active) return;
    const hero = refs.hero.current;
    const helloPath = refs.helloPath.current;
    const dot = refs.dot.current;
    if (!hero || !helloPath || !dot || reduced) {
      eventsRef.current.onDone();
      return;
    }

    const drops = new Map<string, HTMLElement>();
    for (const el of hero.querySelectorAll<HTMLElement>('[data-drop]')) drops.set(el.dataset.drop ?? '', el);
    const dotDrop = drops.get('dot');
    if (!dotDrop) {
      eventsRef.current.onDone();
      return;
    }
    // The drops are placed within their own layer, so that is the box everything is measured in.
    const base = (dotDrop.offsetParent ?? hero).getBoundingClientRect();
    const nodes = Array.from(hero.querySelectorAll<HTMLElement | SVGElement>('[data-ink]'))
      .filter((el) => getComputedStyle(el).display !== 'none')
      .sort((a, b) => Number(a.dataset.inkAt ?? 0) - Number(b.dataset.inkAt ?? 0));
    const tailLocal = helloPath.getPointAtLength(helloPath.getTotalLength());
    const m = helloPath.getScreenCTM();
    const tail: Point = m
      ? [m.a * tailLocal.x + m.c * tailLocal.y + m.e - base.left, m.b * tailLocal.x + m.d * tailLocal.y + m.f - base.top]
      : centreIn(dot, base);

    type Flight = { el: HTMLElement; id: string; to: Point; via: Point; depart: number; arrive: number; landed: boolean };
    const flight = (el: HTMLElement, id: string, to: Point, depart: number, i: number, length?: number): Flight => {
      const dx = to[0] - tail[0];
      const dy = to[1] - tail[1];
      const dist = Math.hypot(dx, dy);
      // Bowed to one side or the other, in turn, so the drops fan out rather than file.
      const side = i % 2 ? 1 : -1;
      const via: Point = [tail[0] + dx / 2 - (dy / dist) * dist * 0.18 * side, tail[1] + dy / 2 + (dx / dist) * dist * 0.18 * side];
      const dur = length ?? Math.min(FLIGHT_MAX, Math.max(FLIGHT_MIN, dist / SPEED));
      return { el, id, to, via, depart, arrive: depart + dur, landed: false };
    };
    const flights: Flight[] = [];
    nodes.forEach((node, i) => {
      const el = drops.get(node.dataset.ink ?? '');
      if (el) flights.push(flight(el, node.dataset.ink ?? '', centreIn(node, base), DEPART + i * STAGGER, i));
    });
    const lastLanding = flights.reduce((t, f) => Math.max(t, f.arrive), DEPART);
    const dotFlight = flight(dotDrop, 'dot', centreIn(dot, base), DEPART + STAGGER * 2, flights.length, lastLanding + DOT_AFTER - (DEPART + STAGGER * 2));
    flights.push(dotFlight);
    // Hidden drops for drawings not on this screen.
    for (const [id, el] of drops) if (!flights.some((f) => f.id === id)) el.style.setProperty('--po', '0');

    const place = (el: HTMLElement, [x, y]: Point, scale: number, opacity: number) => {
      el.style.setProperty('--px', `${x}px`);
      el.style.setProperty('--py', `${y}px`);
      el.style.setProperty('--ps', scale.toFixed(3));
      el.style.setProperty('--po', opacity.toFixed(2));
    };
    for (const f of flights) place(f.el, tail, 1, 0);

    const start = performance.now();
    const width = window.innerWidth;
    let nameUp = false;
    let whereUp = false;
    let raf = 0;
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(raf);
      eventsRef.current.onDone();
    };

    const frame = (now: number) => {
      const el = now - start;
      for (const f of flights) {
        if (el < f.depart) continue;
        const p = Math.min(1, (el - f.depart) / (f.arrive - f.depart));
        const at = bend(tail, f.via, f.to, easeOut(p));
        if (p < 1) {
          // In the air, and shrinking onto the dot if that is where it is going.
          const scale = f.id === 'dot' ? 1 - (1 - LANDED_SCALE) * p : 1;
          place(f.el, at, scale, 1);
          continue;
        }
        if (!f.landed) {
          f.landed = true;
          if (f.id !== 'dot') eventsRef.current.onDrawn(f.id);
        }
        if (f.id === 'dot') {
          place(f.el, f.to, LANDED_SCALE, 1);
          continue;
        }
        // Landed: a press, then the ink is the drawing's.
        const since = el - f.arrive;
        const scale = since < DAB ? 1.8 : 1;
        const opacity = since < DAB ? 1 : Math.max(0, 1 - (since - DAB) / 300);
        place(f.el, f.to, scale, opacity);
      }
      if (!nameUp && el >= dotFlight.arrive * NAME_AT) {
        nameUp = true;
        eventsRef.current.onNameUp();
      }
      if (!whereUp && el >= dotFlight.arrive * WHERE_AT) {
        whereUp = true;
        eventsRef.current.onWhereUp();
      }
      if (el < dotFlight.arrive) {
        raf = requestAnimationFrame(frame);
        return;
      }
      finish();
    };
    raf = requestAnimationFrame(frame);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') finish();
    };
    // Only the width: a phone's address bar changes the height on its own.
    const onResize = () => {
      if (window.innerWidth !== width) finish();
    };
    window.addEventListener('pointerdown', finish);
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointerdown', finish);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, [active, reduced, refs, eventsRef]);
}
