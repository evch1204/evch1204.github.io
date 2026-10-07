import { useEffect, type RefObject } from 'react';
import { useReducedMotion } from 'motion/react';
import { useLatest } from '@/hooks/useLatest';

type Point = [number, number];

type DropRefs = {
  /** The hero: where the landing spot is found, and the box the drop is placed in. */
  hero: RefObject<HTMLDivElement | null>;
  /** The hello's stroke; the drop sets off from its tail. */
  helloPath: RefObject<SVGPathElement | null>;
  /** The drop itself. */
  drop: RefObject<HTMLSpanElement | null>;
};

/** ms after the drain starts before the drop leaves, so the ink is seen gathering at the tail. */
const DEPART = 320;
/** px per ms of flight, and the shortest and longest the flight may take. */
const SPEED = 1.05;
const FLIGHT_MIN = 720;
const FLIGHT_MAX = 1050;

/** Slow off the tail, quick through the air, slow onto the page. */
const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

/** A point on a quadratic curve from `a` to `b` that bows out through `c`. */
const bend = (a: Point, c: Point, b: Point, t: number): Point => {
  const u = 1 - t;
  return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]];
};

/**
 * The drop. While `active`, the ink that drained out of the hello gathers at
 * its tail into one drop, which arcs across the sheet and lands on the spot
 * marked `data-ink-target` (the pin at Santa Clara, where the map is drawn
 * from). `onLanded` is called the moment it touches down. A tap, Enter,
 * Space or Escape lands it at once, and so does a change of window width,
 * since the flight was measured for the old one. The drop is moved on the DOM
 * directly each frame; nothing React needs to re-render for.
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
    const via: Point = [from[0] + dx / 2 - (dy / dist) * dist * 0.24 * side, from[1] + dy / 2 + (dx / dist) * dist * 0.24 * side];
    const flight = Math.min(FLIGHT_MAX, Math.max(FLIGHT_MIN, dist / SPEED));

    const place = ([x, y]: Point, scale: number, opacity: number) => {
      drop.style.setProperty('transform', `translate(${x}px, ${y}px) scale(${scale.toFixed(3)})`);
      drop.style.setProperty('opacity', opacity.toFixed(2));
    };
    place(from, 0.4, 0);

    const start = performance.now();
    const width = window.innerWidth;
    let raf = 0;
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(raf);
      place(to, 1, 0);
      landedRef.current();
    };
    const frame = (now: number) => {
      const el = now - start;
      if (el < DEPART) {
        // Gathering at the tail: the drop swells as the word drains into it.
        place(from, 0.4 + 0.75 * (el / DEPART), el / DEPART);
      } else {
        const p = Math.min(1, (el - DEPART) / flight);
        // A little stretched mid-flight, back to the pin's size as it lands.
        place(bend(from, via, to, ease(p)), 1.15 - 0.15 * Math.abs(2 * p - 1), 1);
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
