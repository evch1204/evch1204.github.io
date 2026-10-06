import { useEffect, useRef } from 'react';
import { animate } from 'motion';
import { motion, useReducedMotion } from 'motion/react';
import { EASE } from '@/lib/motion';
import { DESK, LAPTOP, MAP, MUG, NOTEBOOK, SHADE } from '@/pages/home/sketch';
import Pen from './Pen';

/** Seconds each drawing takes to write. */
export const SCENE_DURATION = { map: 2.4, laptop: 1.2, notebook: 0.7, mug: 0.6, desk: 0.5 } as const;

/** The two ends of the route on the sheet, and the arc the plane flies between them. */
const SANTA_CLARA = { x: 706, y: 403 };
const TAIWAN = { x: 1367, y: 476 };
const ROUTE = `M ${SANTA_CLARA.x} ${SANTA_CLARA.y} Q 1036.5 288.5 ${TAIWAN.x} ${TAIWAN.y}`;
/** How far along the route the plane is when the sheet is at rest: mid-Atlantic, as the sketch has it. */
const PLANE_AT = 0.44;
const PLANE =
  'M 14 0 L 5 -1.8 L -1 -12 L -5 -12 L -3 -2 L -9 -1.4 L -12 -5 L -15 -5 L -13.5 0 L -15 5 L -12 5 L -9 1.4 L -3 2 L -5 12 L -1 12 L 5 1.8 Z';

/** The code on the laptop's screen. */
const SCREEN = ['const me = {', '  location: "Taiwan",', '  base: "Santa Clara",', '  role: "Software Engineer"', '};'];
const NOTE = ['Build', 'Better', 'Things', ':)'];

type SketchSceneProps = {
  /** Which drawings the ink has reached, or every one of them. */
  drawn: ReadonlySet<string> | 'all';
  /** No drops this visit: the drawings arrive one after another on their own. */
  stagger: boolean;
};

/**
 * The right-hand sheet: the world map with the flight from Santa Clara to
 * Taiwan, and the desk under it with the laptop, the notebook and the mug.
 * Every line is a traced stroke of the sketch, written in when its drop
 * lands. The plane takes off once the map is drawn and flies out to where
 * the sketch has it; the labels and the code on the screen come up once
 * there is something to write them on.
 */
export default function SketchScene({ drawn, stagger }: SketchSceneProps) {
  const reduced = useReducedMotion();
  const routeRef = useRef<SVGPathElement>(null);
  const planeRef = useRef<SVGGElement>(null);
  const has = (id: string) => drawn === 'all' || drawn.has(id);
  const d = (delay: number) => (stagger ? delay : 0);

  const mapDrawn = has('map');
  const laptopDrawn = has('laptop');
  const notebookDrawn = has('notebook');

  /* The plane: off the ground as the last coastline is written, settling into its place over the Atlantic. */
  useEffect(() => {
    const route = routeRef.current;
    const plane = planeRef.current;
    if (!route || !plane || !mapDrawn) return;
    const length = route.getTotalLength();
    const place = (t: number) => {
      const p = route.getPointAtLength(length * t);
      const q = route.getPointAtLength(length * Math.min(1, t + 0.004));
      const angle = (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI;
      plane.setAttribute('transform', `translate(${p.x} ${p.y}) rotate(${angle})`);
    };
    if (reduced) {
      place(PLANE_AT);
      plane.style.opacity = '1';
      return;
    }
    let controls: ReturnType<typeof animate> | undefined;
    const takeoff = window.setTimeout(
      () => {
        plane.style.opacity = '1';
        controls = animate(0, PLANE_AT, { duration: 1.8, ease: EASE, onUpdate: place });
      },
      (d(0.6) + SCENE_DURATION.map * 0.85) * 1000,
    );
    return () => {
      window.clearTimeout(takeoff);
      controls?.stop();
    };
    // `stagger` is read once with the first draw; nothing re-flies.
  }, [mapDrawn, reduced]); // eslint-disable-line react-hooks/exhaustive-deps

  const pin = (shown: boolean, delay: number) => ({
    initial: { scale: 0, opacity: 0 },
    animate: shown ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 },
    transition: { duration: reduced ? 0 : 0.5, ease: EASE, delay: shown ? delay : 0 },
  });
  const fade = (shown: boolean, delay: number) => ({
    initial: { opacity: 0 },
    animate: { opacity: shown ? 1 : 0 },
    transition: { duration: reduced ? 0 : 0.6, ease: EASE, delay: shown ? delay : 0 },
  });

  return (
    <svg
      className="home-scene"
      viewBox="500 210 1000 660"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="A hand-drawn world map with a flight from Santa Clara, California to Taiwan, over a desk with a laptop, a notebook that says Build Better Things, and a mug of coffee"
    >
      <g data-ink="map" data-ink-at="0">
        <Pen strokes={SHADE} drawn={mapDrawn} duration={0.8} delay={d(0.5) + SCENE_DURATION.map * 0.6} className="home-shade" />
        <Pen strokes={MAP} drawn={mapDrawn} duration={SCENE_DURATION.map} delay={d(0.5)} className="home-map" />
      </g>

      {/* The flight: the pins at either end, their labels, and the plane on its arc. */}
      <path ref={routeRef} className="home-route" d={ROUTE} aria-hidden />
      <motion.circle
        className="home-pin"
        cx={SANTA_CLARA.x}
        cy={SANTA_CLARA.y}
        r="5"
        {...pin(mapDrawn, d(0.5) + SCENE_DURATION.map * 0.3)}
        style={{ transformOrigin: `${SANTA_CLARA.x}px ${SANTA_CLARA.y}px` }}
      />
      <motion.circle
        className="home-pin"
        cx={TAIWAN.x}
        cy={TAIWAN.y}
        r="5"
        {...pin(mapDrawn, d(0.5) + SCENE_DURATION.map * 0.95)}
        style={{ transformOrigin: `${TAIWAN.x}px ${TAIWAN.y}px` }}
      />
      <motion.g className="home-label" transform="rotate(-9 640 400)" {...fade(mapDrawn, d(0.5) + SCENE_DURATION.map * 0.4)}>
        <text x="641" y="395" textAnchor="end">
          Santa Clara
        </text>
        <text x="641" y="418" textAnchor="end" className="home-label-small">
          (California)
        </text>
      </motion.g>
      <motion.g className="home-label" transform="rotate(-9 1415 445)" {...fade(mapDrawn, d(0.5) + SCENE_DURATION.map)}>
        <text x="1416" y="449">Taiwan</text>
      </motion.g>
      <g ref={planeRef} className="home-plane" style={{ opacity: 0 }} aria-hidden>
        <path d={PLANE} />
      </g>

      {/* The desk. */}
      <g data-ink="desk" data-ink-at="5">
        <Pen strokes={DESK} drawn={has('desk')} duration={SCENE_DURATION.desk} delay={d(1.1)} />
      </g>
      <g data-ink="laptop" data-ink-at="2">
        <Pen strokes={LAPTOP} drawn={laptopDrawn} duration={SCENE_DURATION.laptop} delay={d(0.8)} />
      </g>
      <motion.g
        className="home-screen-code"
        transform="matrix(1 -0.045 0.14 1 0 0)"
        {...fade(laptopDrawn, d(0.8) + SCENE_DURATION.laptop)}
      >
        {SCREEN.map((line, i) => (
          <text key={line} x={840 + (line.startsWith(' ') ? 18 : 0)} y={746 + i * 17.5} xmlSpace="preserve">
            {line.trim()}
          </text>
        ))}
      </motion.g>
      <g data-ink="notebook" data-ink-at="3">
        <Pen strokes={NOTEBOOK} drawn={notebookDrawn} duration={SCENE_DURATION.notebook} delay={d(1.3)} />
      </g>
      <motion.g className="home-note" transform="rotate(-4 1215 770)" {...fade(notebookDrawn, d(1.3) + SCENE_DURATION.notebook)}>
        {NOTE.map((line, i) => (
          <text key={line} x="1216" y={742 + i * 20} textAnchor="middle">
            {line}
          </text>
        ))}
      </motion.g>
      <g data-ink="mug" data-ink-at="4">
        <Pen strokes={MUG} drawn={has('mug')} duration={SCENE_DURATION.mug} delay={d(1.5)} />
      </g>
    </svg>
  );
}
