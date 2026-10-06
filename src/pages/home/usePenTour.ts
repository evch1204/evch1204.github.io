import { useEffect, type RefObject } from 'react';
import { useReducedMotion } from 'motion/react';
import { useLatest } from '@/hooks/useLatest';
import { buildRoute, centreIn, pointAt, type Point } from './route';

type TourRefs = {
  /** The box every coordinate is measured in: the hero. */
  hero: RefObject<HTMLDivElement | null>;
  /** The hello's stroke; the pen sets off from its tail. */
  helloPath: RefObject<SVGPathElement | null>;
  pen: RefObject<HTMLDivElement | null>;
  /** The dot in the line under the name, where the pen lands. */
  dot: RefObject<HTMLSpanElement | null>;
};

type TourEvents = {
  /** The pen has reached this doodle: draw it. */
  onDrawn: (id: string) => void;
  onNameUp: () => void;
  onWhereUp: () => void;
  /** The pen has landed, or the reader skipped ahead. */
  onDone: () => void;
};

/** ms after the drain starts before the pen sets off, so the ink is seen leaving. */
const DEPART = 320;
/** px per ms along the route. */
const SPEED = 0.78;
/** ms the pen rests on each doodle. */
const DWELL = 110;
const NAME_AT = 0.5;
const WHERE_AT = 0.86;

const ease = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);

/**
 * The pen's tour. While `active`, the ink that drained out of the hello is
 * carried on a curve from the word's tail round every doodle on screen, in
 * DOM order, to the dot under the name. A doodle is drawn the moment the pen
 * reaches it; the name rises halfway round; a tap or a key skips to the end.
 * The pen's position is set on the DOM directly each frame; nothing React
 * needs to re-render for.
 */
export function usePenTour(active: boolean, refs: TourRefs, events: TourEvents) {
  const reduced = useReducedMotion();
  const eventsRef = useLatest(events);

  useEffect(() => {
    if (!active) return;
    const hero = refs.hero.current;
    const helloPath = refs.helloPath.current;
    const pen = refs.pen.current;
    const dot = refs.dot.current;
    if (!hero || !helloPath || !pen || !dot || reduced) {
      eventsRef.current.onDone();
      return;
    }

    const base = hero.getBoundingClientRect();
    const nodes = Array.from(hero.querySelectorAll<HTMLElement>('[data-doodle]')).filter(
      (el) => getComputedStyle(el).display !== 'none',
    );
    const tailLocal = helloPath.getPointAtLength(helloPath.getTotalLength());
    const m = helloPath.getScreenCTM();
    const tail: Point = m
      ? [m.a * tailLocal.x + m.c * tailLocal.y + m.e - base.left, m.b * tailLocal.x + m.d * tailLocal.y + m.f - base.top]
      : centreIn(dot, base);
    const route = buildRoute([tail, ...nodes.map((n) => centreIn(n, base)), centreIn(dot, base)]);

    const legs: { t0: number; t1: number; l0: number; l1: number }[] = [];
    let t = 0;
    for (let i = 0; i < route.nodeAt.length - 1; i++) {
      const len = route.nodeAt[i + 1] - route.nodeAt[i];
      const dur = Math.max(220, len / SPEED);
      legs.push({ t0: t, t1: t + dur, l0: route.nodeAt[i], l1: route.nodeAt[i + 1] });
      t += dur + (i < nodes.length ? DWELL : 0);
    }
    const total = t;
    const start = performance.now() + DEPART;
    let drawn = 0;
    let nameUp = false;
    let whereUp = false;
    let raf = 0;
    let dab = 0;
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(dab);
      eventsRef.current.onDone();
    };

    const frame = (now: number) => {
      const el = now - start;
      if (el < 0) {
        raf = requestAnimationFrame(frame);
        return;
      }
      let len = route.total;
      for (const leg of legs) {
        if (el < leg.t0) {
          len = leg.l0;
          break;
        }
        if (el <= leg.t1) {
          len = leg.l0 + (leg.l1 - leg.l0) * ease((el - leg.t0) / (leg.t1 - leg.t0));
          break;
        }
        len = leg.l1;
      }
      const [x, y] = pointAt(route, len);
      pen.style.setProperty('--px', `${x}px`);
      pen.style.setProperty('--py', `${y}px`);
      while (drawn < nodes.length && len >= route.nodeAt[drawn + 1] - 1) {
        eventsRef.current.onDrawn(nodes[drawn].dataset.doodle ?? '');
        // a dab: the pen presses as it starts each drawing
        pen.style.setProperty('--ps', '1.8');
        window.clearTimeout(dab);
        dab = window.setTimeout(() => pen.style.setProperty('--ps', '1'), 140);
        drawn++;
      }
      if (!nameUp && el >= total * NAME_AT) {
        nameUp = true;
        eventsRef.current.onNameUp();
      }
      if (!whereUp && el >= total * WHERE_AT) {
        whereUp = true;
        eventsRef.current.onWhereUp();
      }
      if (el < total) {
        raf = requestAnimationFrame(frame);
        return;
      }
      finish();
    };
    raf = requestAnimationFrame(frame);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') finish();
    };
    window.addEventListener('pointerdown', finish);
    window.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(dab);
      window.removeEventListener('pointerdown', finish);
      window.removeEventListener('keydown', onKey);
    };
  }, [active, reduced, refs, eventsRef]);
}
