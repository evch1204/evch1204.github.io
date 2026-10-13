import { useEffect, type RefObject } from 'react';
import { useReducedMotion } from 'motion/react';
import { useLatest } from '@/hooks/useLatest';
import { HELLO } from './intro';

type Point = [number, number];

type DropRefs = {
  /** The hero: where the landing spot is found, and the box the drop is placed in. */
  hero: RefObject<HTMLDivElement | null>;
  /** The hello's stroke; the drop sets off from its tail. */
  helloPath: RefObject<SVGPathElement | null>;
  /** The drop itself. */
  drop: RefObject<HTMLSpanElement | null>;
};

/** ms the drop gathers at the tail: as long as the word takes to drain into it. */
const GATHER = HELLO.drain * 1000;
/** px per ms of flight, and the shortest and longest the flight may take. */
const SPEED = 0.45;
const FLIGHT_MIN = 650;
const FLIGHT_MAX = 850;
/** The drop's size against its box: as big as the stroke when it starts to form, a full bead when the word has gone, the pin's size once down. */
const BEAD = { start: 0.75, full: 1.25, down: 0.6 };
/** The share of the flight over which the drop picks up speed; after that it flies at one pace and lands at it. */
const WIND_UP = 0.4;

/** How much of the word has drained: slow to let go of the first stroke, then gone, as the drain itself is. */
const drained = (x: number) => Math.pow(Math.min(1, Math.max(0, x)), 1.6);

/** Thrown: speed builds over the wind-up and holds to the ground. No slowing before the landing: the ring takes the impact. */
const thrown = (x: number) => {
  const k = 1 / (1 - WIND_UP / 2);
  return x < WIND_UP ? (k * x * x) / (2 * WIND_UP) : k * (x - WIND_UP / 2);
};

/** A point on a quadratic curve from `a` to `b` that bows out through `c`. */
const bend = (a: Point, c: Point, b: Point, t: number): Point => {
  const u = 1 - t;
  return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]];
};

/**
 * The drop. While `active`, the ink draining out of the hello gathers at its
 * tail into one drop, swelling for as long as the word takes to go; the
 * moment the word has gone the drop is thrown across the sheet, in an arc,
 * and lands on the spot marked `data-ink-target` (the pin at Taiwan, where
 * the map is drawn from). `onLanded` is called the moment it touches down,
 * and the drop fades as the pin takes its place. A tap, Enter, Space or
 * Escape lands it at once, and so does a change of window width, since the
 * flight was measured for the old one. The drop is moved on the DOM directly
 * each frame; nothing React needs to re-render for.
 */
export function useInkDrop(active: boolean, refs: DropRefs, onLanded: () => void) {
  const reduced = useReducedMotion();
  const landedRef = useLatest(onLanded);

  useEffect(() => {
    if (!active) return;
    const hero = refs.hero.current;
    const helloPath = refs.helloPath.current;
    const drop = refs.drop.current;
    const target = hero?.querySelector('[data-ink-target]');
    if (!hero || !helloPath || !drop || !target || reduced) {
      landedRef.current();
      return;
    }

    // The drop is placed within its own layer, so that is the box everything is measured in.
    const base = (drop.offsetParent ?? hero).getBoundingClientRect();
    const spot = target.getBoundingClientRect();
    const to: Point = [spot.left + spot.width / 2 - base.left, spot.top + spot.height / 2 - base.top];
    const tailLocal = helloPath.getPointAtLength(helloPath.getTotalLength());
    const m = helloPath.getScreenCTM();
    const from: Point = m
      ? [m.a * tailLocal.x + m.c * tailLocal.y + m.e - base.left, m.b * tailLocal.x + m.d * tailLocal.y + m.f - base.top]
      : to;
    const dx = to[0] - from[0];
    const dy = to[1] - from[1];
    const dist = Math.hypot(dx, dy) || 1;
    // Thrown, not slid: the path bows upwards, whichever way the drop is headed.
    const side = dx > 0 ? -1 : 1;
    const via: Point = [from[0] + dx / 2 - (dy / dist) * dist * 0.22 * side, from[1] + dy / 2 + (dx / dist) * dist * 0.22 * side];
    const flight = Math.min(FLIGHT_MAX, Math.max(FLIGHT_MIN, dist / SPEED));

    /** The drop at a point, at a size, stretched a little along the way it is going. */
    const place = ([x, y]: Point, scale: number, opacity: number, heading?: Point) => {
      const stretch = heading ? ` rotate(${Math.atan2(heading[1], heading[0]).toFixed(3)}rad) scale(1.3, 0.85)` : '';
      drop.style.setProperty('transform', `translate(${x}px, ${y}px) scale(${scale.toFixed(3)})${stretch}`);
      drop.style.setProperty('opacity', opacity.toFixed(2));
    };
    drop.style.removeProperty('transition');
    place(from, BEAD.start, 0);

    const start = performance.now();
    const width = window.innerWidth;
    let raf = 0;
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(raf);
      // Down, and handed over: the ink spreads into the ring, the pin springs up where the drop is, and the drop goes.
      place(to, BEAD.down, 1);
      drop.style.setProperty('transition', 'opacity 0.14s ease 0.08s');
      drop.style.setProperty('opacity', '0');
      landedRef.current();
    };
    const frame = (now: number) => {
      const el = now - start;
      if (el < GATHER) {
        // Gathering at the tail: the drop swells as the word drains into it.
        const x = drained(el / GATHER);
        place(from, BEAD.start + (BEAD.full - BEAD.start) * x, 1);
      } else {
        const p = Math.min(1, (el - GATHER) / flight);
        const at = bend(from, via, to, thrown(p));
        const ahead = bend(from, via, to, thrown(Math.min(1, p + 0.02)));
        place(at, BEAD.full, 1, p < 0.96 ? [ahead[0] - at[0], ahead[1] - at[1]] : undefined);
        if (p >= 1) {
          finish();
          return;
        }
      }
      raf = requestAnimationFrame(frame);
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
  }, [active, reduced, refs, landedRef]);
}
