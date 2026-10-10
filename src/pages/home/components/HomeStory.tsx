import { useCallback, useId, useLayoutEffect, useRef, useState, type Ref, type RefObject } from 'react';
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type Variants,
} from 'motion/react';
import Sketch from '@/components/sketch/Sketch';
import SketchTitle from '@/components/sketch/SketchTitle';
import { wanderLine } from '@/components/sketch/hand';
import { ARROW_RIGHT } from '@/components/sketch/marks';
import { SCHOOL } from '@/content/site';
import type { Tab } from '@/layout/nav';
import SiteFooter from '@/layout/SiteFooter';
import { EASE, PEN_EASE } from '@/lib/motion';
import PaperPlane, { TRAIL_START } from '@/pages/contact/components/PaperPlane';
import { PLANE } from '@/pages/home/sketch';

/** One place on the way: when it was, where, and a sentence or two about it. */
type Stop = { when: string; place: string; lines: string };

/** The life so far, from the pin on the map above to the desk. Facts from the experience register and the site. */
const STOPS: Stop[] = [
  { when: 'the start', place: 'Taiwan', lines: 'Grew up in Taiwan. The pin on the map above is home.' },
  {
    when: '2017',
    place: 'Shanghai',
    lines:
      'High school at SMIC-International School: honor roll, student council, and more hours on the basketball and volleyball courts than in the library.',
  },
  {
    when: '2021',
    place: 'Santa Clara',
    lines: `Flew to California for Computer Science at ${SCHOOL}. A data science specialisation, minors in mathematics and computer engineering, and Alpha Phi Omega.`,
  },
  {
    when: 'summers, 2022–23',
    place: 'Back home',
    lines:
      "Taipei first, automating a logistics team's data work at GuoQing Express. Then Hsinchu, at DuPont: reporting scripts for a 20-person team, a computer-vision safety monitor, and first place in the intern competition.",
  },
  {
    when: '2025',
    place: 'Graduated',
    lines:
      "B.S. in hand in June. In the autumn, an AI/ML internship at Paidwork: a testing framework for the AI service's pipeline, and an assistant that answers in 100+ languages.",
  },
  {
    when: '2026',
    place: 'DeepSpace',
    lines: 'Joined in January as an intern, software engineer since May. Shipped Create Mode, which turns a plain-English chat into a working web app.',
  },
  { when: 'now', place: 'Still at the desk', lines: 'Building full-stack products end-to-end, and looking for what comes next.' },
];

/** The traced plane's centre on its sheet, which it is turned about, and how big it rides here. */
const PLANE_HOME = { x: PLANE.box[0] + PLANE.box[2] / 2, y: PLANE.box[1] + PLANE.box[3] / 2 };
const PLANE_SCALE = 0.75;
/** The way the traced plane's nose points, in degrees: along the map's flight where the sketch drew it, a little below east. */
const PLANE_NOSE = 3.2;
/** How far the road swings sideways between one pin and the next, in px, stop by stop: the hand's, not a rule's. */
const SWING = [26, 34, 22, 38, 28, 32, 20, 30];
/** Past this share of the road the plane has landed: it goes, and the paper plane takes off. */
const LANDED = 0.985;

type HomeStoryProps = {
  ref?: Ref<HTMLElement>;
  /** The home sheet: the box that scrolls, which the road is drawn by. */
  container: RefObject<HTMLDivElement | null>;
  onNavigate: (to: { tab: Tab; project?: string }) => void;
};

/**
 * What `Scroll to explore` scrolls to: the next sheet, and the life so far
 * drawn on it. The map's dashed flight carries on down the page as a road,
 * hand-drawn through a pin at each place; it is drawn by the scroll, with the
 * map's plane at its head, and each place writes itself in as the road
 * reaches its pin. At the end the road runs into the trail of a paper plane,
 * and two notes in the margin point on.
 *
 * The pins are where the words put them: the road is measured from them after
 * layout, and again whenever the sheet changes size.
 */
export default function HomeStory({ ref, container, onNavigate }: HomeStoryProps) {
  const reduced = useReducedMotion();
  const maskId = `home-story-ink${useId().replace(/[^\w-]/g, '')}`;
  const storyRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const roadRef = useRef<SVGPathElement>(null);
  const inkRef = useRef<SVGPathElement>(null);
  const planeRef = useRef<SVGGElement>(null);
  /** The road's length, and the share of it at which each pin is reached. */
  const geo = useRef({ total: 0, marks: [] as number[] });

  /** How many of the stops the road has reached; the last count past them is the paper plane. Never goes back. */
  const [reached, setReached] = useState(0);
  const shown = reduced ? STOPS.length + 1 : reached;

  /*
   * How far down the road the pen is, from the sheet's scroll. It sets off as
   * the top of the road comes 65% of the way down the window and arrives as
   * the bottom comes 80% of the way down, or when the sheet can scroll no
   * further, whichever is first: the footer under it is not always tall
   * enough to bring the end of the road up that far.
   */
  const { scrollY } = useScroll({ container });
  const span = useRef({ from: 0, to: 1 });
  const share = (y: number) => Math.min(1, Math.max(0, (y - span.current.from) / (span.current.to - span.current.from)));
  const drawnTo = useMotionValue(0);
  useMotionValueEvent(scrollY, 'change', (y) => drawnTo.set(share(y)));
  const progress = useSpring(drawnTo, { stiffness: 120, damping: 30, restDelta: 0.0005 });
  /* A round cap of no length still shows as a dot: nothing at all until the pen is off the mark. */
  const inkOpacity = useTransform(progress, (p) => (p > 0.002 ? 1 : 0));

  /** Puts the plane on the head of the road, nose along it, and counts the pins the road has passed. */
  const follow = useCallback(
    (p: number) => {
      const road = roadRef.current;
      const plane = planeRef.current;
      const { total, marks } = geo.current;
      if (!road || !plane || !total) return;
      const at = Math.min(1, Math.max(0, p)) * total;
      const head = road.getPointAtLength(at);
      const ahead = road.getPointAtLength(Math.min(total, at + 4));
      const behind = road.getPointAtLength(Math.max(0, at - 4));
      const angle = (Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180) / Math.PI;
      plane.setAttribute(
        'transform',
        `translate(${head.x} ${head.y}) rotate(${angle - PLANE_NOSE}) scale(${PLANE_SCALE}) translate(${-PLANE_HOME.x} ${-PLANE_HOME.y})`,
      );
      plane.style.opacity = p < LANDED ? '1' : '0';
      const passed = marks.filter((m) => p >= m - 0.002).length + (p >= LANDED ? 1 : 0);
      setReached((r) => Math.max(r, passed));
    },
    [setReached],
  );

  useMotionValueEvent(progress, 'change', (p) => {
    if (!reduced) follow(p);
  });

  /* The road through the pins, measured from the page, and measured again whenever the sheet changes size. */
  useLayoutEffect(() => {
    const story = storyRef.current;
    const paper = paperRef.current;
    const road = roadRef.current;
    const ink = inkRef.current;
    if (!story || !paper || !road || !ink) return;
    const build = () => {
      const box = story.getBoundingClientRect();
      const pins = [...story.querySelectorAll<HTMLElement>('[data-pin]')].map((el): [number, number] => {
        const r = el.getBoundingClientRect();
        return [r.left + r.width / 2 - box.left, r.top + r.height / 2 - box.top];
      });
      if (!pins.length) return;
      const wide = window.matchMedia('(width >= 48rem)').matches;
      const sheet = paper.getBoundingClientRect();
      const takeoff: [number, number] = [sheet.left + TRAIL_START.x * sheet.width - box.left, sheet.top + TRAIL_START.y * sheet.height - box.top];

      // From under the title to the first pin, then pin to pin, each stretch swinging out once, to the side its words leave empty.
      const pts: [number, number][] = [[pins[0][0], 0]];
      const reach = (to: [number, number], i: number, side: number) => {
        const [x0, y0] = pts[pts.length - 1];
        pts.push([(x0 + to[0]) / 2 + side * SWING[i % SWING.length] * (wide ? 1 : 0.35), (y0 + to[1]) / 2], to);
      };
      pins.forEach((pin, i) => reach(pin, i, wide ? (i % 2 ? 1 : -1) : i % 2 ? -1 : 1));
      // The last stretch: down past the last stop, round, and into the trail the way the paper plane set off along it.
      const [lx, ly] = pins[pins.length - 1];
      const [tx, ty] = takeoff;
      if (wide) pts.push([lx + 6, (ly + ty) / 2], [lx, ty - 44], [lx - 12, ty - 12], takeoff);
      else pts.push([lx, ty + 8], [lx + 26, ty + 36], [tx + 14, ty + 40], [tx + 42, ty + 22], takeoff);

      const d = wanderLine(pts, 1204);
      road.setAttribute('d', d);
      ink.setAttribute('d', d);
      const total = road.getTotalLength();

      // Each pin's share of the road: walk along it to where it passes through the pin.
      const marks: number[] = [];
      let at = 0;
      for (const [px, py] of pins) {
        let best = at, near = Infinity;
        for (let l = at; l <= total; l += 3) {
          const q = road.getPointAtLength(l);
          const off = Math.hypot(q.x - px, q.y - py);
          if (off < near) {
            near = off;
            best = l;
          }
          if (near < 2 && off > near + 6) break;
        }
        marks.push(best / total);
        at = best;
      }
      geo.current = { total, marks };

      const sheetBox = container.current;
      if (sheetBox) {
        const view = sheetBox.clientHeight;
        const top = box.top - sheetBox.getBoundingClientRect().top + sheetBox.scrollTop;
        const from = top - view * 0.65;
        const to = Math.min(top + box.height - view * 0.8, sheetBox.scrollHeight - view - 2);
        span.current = { from, to: Math.max(from + 1, to) };
        drawnTo.set(share(sheetBox.scrollTop));
      }
      if (!reduced) follow(progress.get());
    };
    build();
    const observer = new ResizeObserver(build);
    observer.observe(story);
    // The sheet's own size follows the window's; its ref is not yet set while this first runs.
    window.addEventListener('resize', build);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', build);
    };
  }, [follow, progress, reduced, container, drawnTo]);

  /* A line written out from its left edge, as the name on the sheet above was; with reduced motion, simply there. */
  const write: Variants = {
    hidden: { opacity: 0, clipPath: 'inset(-20% 100% -20% -4%)' },
    shown: { opacity: 1, clipPath: 'inset(-20% -4% -20% -4%)', transition: { duration: 0.5, ease: PEN_EASE } },
  };
  const rise = (delay: number): Variants => ({
    hidden: { opacity: 0, y: 8 },
    shown: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE, delay } },
  });
  const ink: Variants = { hidden: { opacity: 0 }, shown: { opacity: 1, transition: { duration: 0.15 } } };
  const landed = shown > STOPS.length;

  return (
    <section ref={ref} className="home-more" aria-labelledby="home-story">
      <div className="pt-3">
        <SketchTitle as="h2">
          <span id="home-story">The story so far</span>
        </SketchTitle>
        <p className="mt-5 max-w-[54ch] text-lg leading-relaxed text-pencil">
          From Taiwan to a desk in California, by way of Shanghai and a few summers back home.
        </p>
      </div>

      <div ref={storyRef} className="home-story">
        <ol className="home-story-stops">
          {STOPS.map((stop, i) => {
            const on = i < shown;
            const state = on ? 'shown' : 'hidden';
            return (
              <li key={stop.place} className="home-story-stop">
                <span className="home-story-pin" aria-hidden>
                  <motion.span data-pin className="home-story-dot" initial={reduced ? false : 'hidden'} animate={state} variants={ink} />
                  {on && !reduced ? (
                    <svg className="home-story-ripple">
                      <motion.circle
                        cx="0"
                        cy="0"
                        initial={{ r: 4, opacity: 0 }}
                        animate={{ r: 26, opacity: [0, 0.55, 0] }}
                        transition={{ duration: 0.9, ease: 'easeOut' }}
                      />
                    </svg>
                  ) : null}
                </span>
                <div className="home-story-words">
                  <motion.p className="home-story-when" initial={reduced ? false : 'hidden'} animate={state} variants={rise(0)}>
                    {stop.when}
                  </motion.p>
                  <motion.h3 className="home-story-place" initial={reduced ? false : 'hidden'} animate={state} variants={write}>
                    {stop.place}
                  </motion.h3>
                  <motion.p className="home-story-lines" initial={reduced ? false : 'hidden'} animate={state} variants={rise(0.15)}>
                    {stop.lines}
                  </motion.p>
                </div>
              </li>
            );
          })}
        </ol>

        {/* Where the road runs out: the paper plane takes off from the end of it, and the margin points on. */}
        <div className="home-story-end">
          <div ref={paperRef} className="home-story-paper">
            <PaperPlane drawn={landed} className="w-full" />
          </div>
          <motion.div className="home-story-notes" initial={reduced ? false : 'hidden'} animate={landed ? 'shown' : 'hidden'} variants={rise(0.6)}>
            <button type="button" onClick={() => onNavigate({ tab: 'contact' })} className="sk-note group cursor-pointer rounded-md text-lg focus-ring">
              Say hello
              <Sketch
                drawing={ARROW_RIGHT}
                duration={0.4}
                delay={0.3}
                weight={1.3}
                className="ml-2 inline-block h-auto w-7 align-middle transition-transform duration-300 group-hover:translate-x-1"
              />
            </button>
            <button type="button" onClick={() => onNavigate({ tab: 'experience' })} className="sk-note group cursor-pointer rounded-md text-lg focus-ring">
              The work, in detail
              <Sketch
                drawing={ARROW_RIGHT}
                duration={0.4}
                delay={0.3}
                weight={1.3}
                className="ml-2 inline-block h-auto w-7 align-middle transition-transform duration-300 group-hover:translate-x-1"
              />
            </button>
          </motion.div>
        </div>

        {/* The road: dashed like the flight on the map, and shown only as far as the solid copy in its mask has been drawn. */}
        <svg className="home-story-road" aria-hidden>
          <defs>
            <mask id={maskId} maskUnits="userSpaceOnUse" x="-200" y="-200" width="4000" height="20000">
              <motion.path ref={inkRef} className="home-story-ink" style={{ pathLength: reduced ? 1 : progress, opacity: reduced ? 1 : inkOpacity }} />
            </mask>
          </defs>
          <path ref={roadRef} className="home-story-dash" mask={`url(#${maskId})`} />
          {reduced ? null : (
            <g ref={planeRef} className="home-story-plane" style={{ opacity: 0 }}>
              {PLANE.fills.map((fill) => (
                <path key={fill.d} d={fill.d} />
              ))}
            </g>
          )}
        </svg>
      </div>

      <SiteFooter className="mt-24 md:mt-32" />
    </section>
  );
}
