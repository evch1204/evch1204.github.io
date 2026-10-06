import { useEffect, useRef, useState, type ReactNode } from 'react';
import { animate } from 'motion';
import { motion, useReducedMotion } from 'motion/react';
import Pen from '@/components/sketch/Pen';
import type { Drawing } from '@/components/sketch/drawing';
import { EASE } from '@/lib/motion';
import { BOOK, FLIGHT, LAPTOP, MAP, MUG, PERSON, PLANE, SCREEN, STEAM, SURFACE } from '@/pages/home/sketch';

/** The two ends of the route on the sheet, and the arc between them, fitted to the sketch's dashes. */
const SANTA_CLARA = { x: 706, y: 403 };
const TAIWAN = { x: 1367, y: 476 };
const ROUTE = `M ${SANTA_CLARA.x} ${SANTA_CLARA.y} Q 1036.5 288.5 ${TAIWAN.x} ${TAIWAN.y}`;
/** Where along the route (0 at Santa Clara, 1 at Taiwan) the plane is when the sheet is at rest: where the sketch has it. */
const REST = 0.44;
/** Where the traced plane sits on the sheet: the centre it is turned about and moved from. */
const PLANE_HOME = { x: PLANE.box[0] + PLANE.box[2] / 2, y: PLANE.box[1] + PLANE.box[3] / 2 };

/**
 * The scene's own clock, in seconds from the moment the ink lands on Taiwan.
 * The map spreads out from the pin; the flight leaves a beat later, westwards,
 * and its dashes reach Santa Clara as the far coasts are finishing; the plane
 * rides the front of the dashes as far as its place over the Atlantic; the
 * desk, close by the pin, is drawn thing by thing while the map is still
 * spreading.
 */
const T = {
  map: { at: 0.05, spread: 1.7 },
  flight: { at: 0.35, seconds: 1.35 },
  surface: { at: 0.8, seconds: 0.35 },
  person: { at: 0.9, seconds: 1.1 },
  laptop: { at: 1.5, seconds: 0.6 },
  screen: { at: 2.05, seconds: 0.5 },
  mug: { at: 1.9, seconds: 0.5 },
  steam: { at: 2.4, seconds: 0.4 },
  book: { at: 2.2, seconds: 0.4 },
} as const;

/** ms between one rewriting of a living thing's moving part (the screen's lines, the steam) and the next. */
const LOOP = 1500;

/** The things on the desk that come alive under the pencil. */
type Part = 'person' | 'laptop' | 'mug' | 'book';

/** A drawing's box, grown a little: the patch of the sheet that wakes it. */
const patch = (...drawings: Drawing[]) => {
  const x0 = Math.min(...drawings.map((d) => d.box[0])) - 6;
  const y0 = Math.min(...drawings.map((d) => d.box[1])) - 6;
  const x1 = Math.max(...drawings.map((d) => d.box[0] + d.box[2])) + 6;
  const y1 = Math.max(...drawings.map((d) => d.box[1] + d.box[3])) + 6;
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
};

/**
 * One thing on the sheet that answers the pencil. While the pointer is over
 * its patch its lines boil, the way a hand-drawn film keeps a still drawing
 * alive (see `sk-alive`), and whatever in it can move, moves.
 */
function Thing({
  part,
  alive,
  onWake,
  onRest,
  hit,
  children,
}: {
  part: Part;
  alive: Part | null;
  onWake: (part: Part) => void;
  onRest: () => void;
  hit: ReturnType<typeof patch>;
  children: ReactNode;
}) {
  return (
    <g className={`home-thing${alive === part ? ' is-alive' : ''}`} onPointerEnter={() => onWake(part)} onPointerLeave={onRest}>
      {children}
      <rect className="home-hit" {...hit} />
    </g>
  );
}

/** The ring a pin throws when ink lands on it; every new `beat` throws another. */
function Ripple({ at, beat, delay = 0 }: { at: { x: number; y: number }; beat: number; delay?: number }) {
  return (
    <motion.circle
      key={beat}
      className="home-ripple"
      cx={at.x}
      cy={at.y}
      initial={{ r: 5, opacity: 0 }}
      animate={{ r: 30, opacity: [0, 0.55, 0] }}
      transition={{ duration: 0.9, ease: 'easeOut', delay }}
      aria-hidden
    />
  );
}

type SketchSceneProps = {
  /** The ink has landed on Taiwan: draw. */
  drawn: boolean;
  /** Seconds to hold everything back by, for a visit with no drop to wait for. */
  lead: number;
};

/**
 * The right-hand sheet: the world map with the flight from Taiwan to Santa
 * Clara, and under its south-east corner the person at the desk. Every line
 * is a traced stroke of the sketches. The hello's drop of ink lands as the
 * pin at Taiwan, and everything is drawn from there: the coasts outwards
 * from the pin, the flight westwards across them to the pin at Santa Clara,
 * and the desk beside it.
 *
 * Once drawn, the sheet answers the pencil. The person, the laptop, the mug
 * and the book come alive under it: the laptop's screen is written again and
 * again, the coffee steams. A pin throws its ring. And the plane, touched,
 * flies on to Santa Clara and comes round again from Taiwan.
 */
export default function SketchScene({ drawn, lead }: SketchSceneProps) {
  const reduced = useReducedMotion();
  const routeRef = useRef<SVGPathElement>(null);
  const planeRef = useRef<SVGGElement>(null);
  /** Sends the plane round again; set once the route can be measured. */
  const again = useRef<() => void>(() => {});
  const flightEnd = lead + T.flight.at + T.flight.seconds;

  const [alive, setAlive] = useState<Part | null>(null);
  /** Counts that restart a moving part: each new number writes it afresh. */
  const [beats, setBeats] = useState({ screen: 0, steam: 0, taiwan: 0, santaClara: 0 });
  const bump = (key: keyof typeof beats) => setBeats((b) => ({ ...b, [key]: b[key] + 1 }));
  const loop = useRef(0);

  const wake = (part: Part) => {
    setAlive(part);
    window.clearInterval(loop.current);
    if (reduced || (part !== 'laptop' && part !== 'mug')) return;
    const key = part === 'laptop' ? 'screen' : 'steam';
    bump(key);
    loop.current = window.setInterval(() => bump(key), LOOP);
  };
  const rest = () => {
    setAlive(null);
    window.clearInterval(loop.current);
  };
  useEffect(() => () => window.clearInterval(loop.current), []);

  /* The plane: off the ground at Taiwan with the first dash, settling into its place over the Atlantic. */
  useEffect(() => {
    const route = routeRef.current;
    const plane = planeRef.current;
    if (!route || !plane || !drawn) return;
    const length = route.getTotalLength();
    const point = (t: number) => route.getPointAtLength(length * Math.min(1, Math.max(0, t)));
    const bearing = (from: DOMPoint, to: DOMPoint) => (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
    // The traced plane points eastwards along the route where the sketch drew it. It flies west, so it is turned about.
    const traced = bearing(point(REST), point(REST + 0.004));
    const place = (t: number) => {
      const p = point(t);
      const west = t > 0.004 ? bearing(p, point(t - 0.004)) : bearing(point(0.004), point(0));
      plane.setAttribute(
        'transform',
        `translate(${p.x - PLANE_HOME.x} ${p.y - PLANE_HOME.y}) rotate(${west - traced} ${PLANE_HOME.x} ${PLANE_HOME.y})`,
      );
    };
    const show = (on: boolean) => plane.style.setProperty('opacity', on ? '1' : '0');
    if (reduced) {
      place(REST);
      show(true);
      return;
    }

    let over = false;
    let busy = true;
    let controls: ReturnType<typeof animate> | undefined;
    let pause = 0;
    const fly = (from: number, to: number, seconds: number) =>
      new Promise<void>((done) => {
        controls = animate(from, to, { duration: seconds, ease: EASE, onUpdate: place, onComplete: () => done() });
      });
    const wait = (ms: number) =>
      new Promise<void>((done) => {
        pause = window.setTimeout(done, ms);
      });

    place(1);
    const takeoff = window.setTimeout(
      () => {
        show(true);
        void fly(1, REST, T.flight.seconds * 0.8).then(() => {
          busy = false;
        });
      },
      (lead + T.flight.at) * 1000,
    );

    // Touched, the plane finishes the flight: down into Santa Clara, then round again from Taiwan to where it rests.
    again.current = async () => {
      if (busy || over) return;
      busy = true;
      await fly(REST, 0, 1.2);
      if (over) return;
      show(false);
      setBeats((b) => ({ ...b, santaClara: b.santaClara + 1 }));
      await wait(700);
      if (over) return;
      place(1);
      show(true);
      setBeats((b) => ({ ...b, taiwan: b.taiwan + 1 }));
      await fly(1, REST, 1.5);
      busy = false;
    };

    return () => {
      over = true;
      again.current = () => {};
      window.clearTimeout(takeoff);
      window.clearTimeout(pause);
      controls?.stop();
    };
    // `lead` is read once with the first draw; nothing re-flies.
  }, [drawn, reduced]); // eslint-disable-line react-hooks/exhaustive-deps

  const pin = (delay: number) => ({
    initial: { scale: 0, opacity: 0 },
    animate: drawn ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 },
    transition: { duration: reduced ? 0 : 0.45, ease: EASE, delay: drawn ? delay : 0 },
  });
  const fade = (delay: number) => ({
    initial: { opacity: 0 },
    animate: { opacity: drawn ? 1 : 0 },
    transition: { duration: reduced ? 0 : 0.6, ease: EASE, delay: drawn ? delay : 0 },
  });
  /** A part that is written again while its thing is alive: on its first writing it keeps its place in the clock. */
  const rewrite = (beat: number, first: { at: number; seconds: number }) =>
    beat ? { key: beat, duration: first.seconds * 1.6, delay: 0 } : { key: 0, duration: first.seconds, delay: lead + first.at };

  return (
    <svg
      className="home-scene sk-art"
      viewBox="500 210 1000 670"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="A hand-drawn world map with a flight from Taiwan to Santa Clara, California, and under it a person in a hoodie working at a laptop, a mug of coffee and a book beside them"
    >
      <Pen drawing={MAP} drawn={drawn} delay={lead + T.map.at} wave={{ ...TAIWAN, seconds: T.map.spread }} />

      {/* The flight: its dashes in the order they are flown, the pins at either end, their labels, and the plane on its arc. */}
      <path ref={routeRef} className="home-route" d={ROUTE} aria-hidden />
      <Pen drawing={FLIGHT} drawn={drawn} duration={T.flight.seconds} delay={lead + T.flight.at} />

      {/* Where the hello's drop lands; the pin is the drop, and the ring is the mark it makes landing. */}
      <circle data-ink-target cx={TAIWAN.x} cy={TAIWAN.y} r="1" fill="none" aria-hidden />
      {drawn && !reduced ? <Ripple at={TAIWAN} beat={beats.taiwan} delay={beats.taiwan ? 0 : lead} /> : null}
      {beats.santaClara && !reduced ? <Ripple at={SANTA_CLARA} beat={beats.santaClara} /> : null}
      <g onPointerEnter={() => bump('taiwan')}>
        <motion.circle
          className="home-pin"
          cx={TAIWAN.x}
          cy={TAIWAN.y}
          r="5"
          {...pin(lead)}
          style={{ transformOrigin: `${TAIWAN.x}px ${TAIWAN.y}px` }}
        />
        <circle className="home-hit" cx={TAIWAN.x} cy={TAIWAN.y} r="15" />
      </g>
      <g onPointerEnter={() => bump('santaClara')}>
        <motion.circle
          className="home-pin"
          cx={SANTA_CLARA.x}
          cy={SANTA_CLARA.y}
          r="5"
          {...pin(flightEnd - 0.1)}
          style={{ transformOrigin: `${SANTA_CLARA.x}px ${SANTA_CLARA.y}px` }}
        />
        <circle className="home-hit" cx={SANTA_CLARA.x} cy={SANTA_CLARA.y} r="15" />
      </g>
      <motion.g className="home-label" transform="rotate(-9 1415 445)" {...fade(lead + 0.3)}>
        <text x="1416" y="449">Taiwan</text>
      </motion.g>
      <motion.g className="home-label" transform="rotate(-9 640 400)" {...fade(flightEnd)}>
        <text x="641" y="395" textAnchor="end">
          Santa Clara
        </text>
        <text x="641" y="418" textAnchor="end" className="home-label-small">
          (California)
        </text>
      </motion.g>

      {/* The desk, thing by thing; each wakes under the pencil. A later thing lies over an earlier one where their patches meet. */}
      <Pen drawing={SURFACE} drawn={drawn} duration={T.surface.seconds} delay={lead + T.surface.at} />
      <Thing part="person" alive={alive} onWake={wake} onRest={rest} hit={patch(PERSON)}>
        <Pen drawing={PERSON} drawn={drawn} duration={T.person.seconds} delay={lead + T.person.at} />
      </Thing>
      <Thing part="book" alive={alive} onWake={wake} onRest={rest} hit={patch(BOOK)}>
        <Pen drawing={BOOK} drawn={drawn} duration={T.book.seconds} delay={lead + T.book.at} />
      </Thing>
      <Thing part="laptop" alive={alive} onWake={wake} onRest={rest} hit={patch(LAPTOP)}>
        <Pen drawing={LAPTOP} drawn={drawn} duration={T.laptop.seconds} delay={lead + T.laptop.at} />
        <Pen drawing={SCREEN} drawn={drawn} {...rewrite(beats.screen, T.screen)} />
      </Thing>
      <Thing part="mug" alive={alive} onWake={wake} onRest={rest} hit={patch(MUG, STEAM)}>
        <Pen drawing={MUG} drawn={drawn} duration={T.mug.seconds} delay={lead + T.mug.at} />
        <g className="home-steam">
          <Pen drawing={STEAM} drawn={drawn} {...rewrite(beats.steam, T.steam)} />
        </g>
      </Thing>

      {/* Last, so that it is over everything it flies across. */}
      <g
        ref={planeRef}
        className="home-plane sk-pen"
        style={{ opacity: 0 }}
        data-no-draw
        onPointerEnter={() => again.current()}
        onClick={() => again.current()}
        aria-hidden
      >
        {PLANE.fills.map((fill) => (
          <path key={fill.d} className="sk-solid" d={fill.d} />
        ))}
        <circle className="home-hit" cx={PLANE_HOME.x} cy={PLANE_HOME.y} r="20" />
      </g>
    </svg>
  );
}
