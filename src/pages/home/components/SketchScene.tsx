import { useEffect, useRef } from 'react';
import { animate } from 'motion';
import { motion, useReducedMotion } from 'motion/react';
import Pen from '@/components/sketch/Pen';
import { EASE } from '@/lib/motion';
import { DESK, FLIGHT, MAP, PLANE } from '@/pages/home/sketch';

/** The two ends of the route on the sheet, and the arc the plane flies between them, fitted to the sketch's dashes. */
const SANTA_CLARA = { x: 706, y: 403 };
const TAIWAN = { x: 1367, y: 476 };
const ROUTE = `M ${SANTA_CLARA.x} ${SANTA_CLARA.y} Q 1036.5 288.5 ${TAIWAN.x} ${TAIWAN.y}`;
/** How far along the route the plane is when the sheet is at rest: over the Atlantic, where the sketch has it. */
const PLANE_AT = 0.44;
/** Where the traced plane sits on the sheet: the centre it is turned about and moved from. */
const PLANE_HOME = { x: PLANE.box[0] + PLANE.box[2] / 2, y: PLANE.box[1] + PLANE.box[3] / 2 };

/**
 * The scene's own clock, in seconds from the moment the ink lands on Santa
 * Clara. The map spreads out from the pin; the flight leaves a beat later and
 * its dashes reach Taiwan as the far coasts are finishing; the plane rides the
 * front of the dashes as far as its place over the Atlantic; the desk is
 * drawn once the map is well under way.
 */
const T = {
  map: { at: 0.05, spread: 1.7 },
  flight: { at: 0.35, seconds: 1.35 },
  desk: { at: 1.0, seconds: 1.8 },
} as const;

type SketchSceneProps = {
  /** The ink has landed on Santa Clara: draw. */
  drawn: boolean;
  /** Seconds to hold everything back by, for a visit with no drop to wait for. */
  lead: number;
};

/**
 * The right-hand sheet: the world map with the flight from Santa Clara to
 * Taiwan, and under its south-east corner the person at the desk. Every line
 * is a traced stroke of the sketches. The hello's drop of ink lands as the
 * pin at Santa Clara, and everything is drawn from there: the coasts
 * outwards from the pin, the flight across them to the pin at Taiwan, and
 * then the desk.
 */
export default function SketchScene({ drawn, lead }: SketchSceneProps) {
  const reduced = useReducedMotion();
  const routeRef = useRef<SVGPathElement>(null);
  const planeRef = useRef<SVGGElement>(null);
  const flightEnd = lead + T.flight.at + T.flight.seconds;

  /* The plane: off the ground with the first dash, settling into its place over the Atlantic. */
  useEffect(() => {
    const route = routeRef.current;
    const plane = planeRef.current;
    if (!route || !plane || !drawn) return;
    const length = route.getTotalLength();
    const heading = (t: number) => {
      const p = route.getPointAtLength(length * t);
      const q = route.getPointAtLength(length * Math.min(1, t + 0.004));
      return { p, angle: (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI };
    };
    // The traced plane already points along the route where the sketch drew it; elsewhere it is turned by the difference.
    const rest = heading(PLANE_AT).angle;
    const place = (t: number) => {
      const { p, angle } = heading(t);
      plane.setAttribute(
        'transform',
        `translate(${p.x - PLANE_HOME.x} ${p.y - PLANE_HOME.y}) rotate(${angle - rest} ${PLANE_HOME.x} ${PLANE_HOME.y})`,
      );
    };
    if (reduced) {
      place(PLANE_AT);
      plane.style.opacity = '1';
      return;
    }
    place(0);
    let controls: ReturnType<typeof animate> | undefined;
    const takeoff = window.setTimeout(
      () => {
        plane.style.opacity = '1';
        controls = animate(0, PLANE_AT, { duration: T.flight.seconds * 0.8, ease: EASE, onUpdate: place });
      },
      (lead + T.flight.at) * 1000,
    );
    return () => {
      window.clearTimeout(takeoff);
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

  return (
    <svg
      className="home-scene sk-art"
      viewBox="500 210 1000 670"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="A hand-drawn world map with a flight from Santa Clara, California to Taiwan, and under it a person in a hoodie working at a laptop, a mug and a book beside them"
    >
      <Pen drawing={MAP} drawn={drawn} delay={lead + T.map.at} wave={{ ...SANTA_CLARA, seconds: T.map.spread }} />

      {/* The flight: its dashes in the order they are flown, the pins at either end, their labels, and the plane on its arc. */}
      <path ref={routeRef} className="home-route" d={ROUTE} aria-hidden />
      <Pen drawing={FLIGHT} drawn={drawn} duration={T.flight.seconds} delay={lead + T.flight.at} />

      {/* Where the hello's drop lands; the pin is the drop, and the ring is the mark it makes landing. */}
      <circle data-ink-target cx={SANTA_CLARA.x} cy={SANTA_CLARA.y} r="1" fill="none" aria-hidden />
      {reduced ? null : (
        <motion.circle
          className="home-ripple"
          cx={SANTA_CLARA.x}
          cy={SANTA_CLARA.y}
          initial={{ r: 5, opacity: 0 }}
          animate={drawn ? { r: 30, opacity: [0, 0.55, 0] } : { r: 5, opacity: 0 }}
          transition={{ duration: 0.9, ease: 'easeOut', delay: drawn ? lead : 0 }}
          aria-hidden
        />
      )}
      <motion.circle
        className="home-pin"
        cx={SANTA_CLARA.x}
        cy={SANTA_CLARA.y}
        r="5"
        {...pin(lead)}
        style={{ transformOrigin: `${SANTA_CLARA.x}px ${SANTA_CLARA.y}px` }}
      />
      <motion.circle
        className="home-pin"
        cx={TAIWAN.x}
        cy={TAIWAN.y}
        r="5"
        {...pin(flightEnd - 0.1)}
        style={{ transformOrigin: `${TAIWAN.x}px ${TAIWAN.y}px` }}
      />
      <motion.g className="home-label" transform="rotate(-9 640 400)" {...fade(lead + 0.3)}>
        <text x="641" y="395" textAnchor="end">
          Santa Clara
        </text>
        <text x="641" y="418" textAnchor="end" className="home-label-small">
          (California)
        </text>
      </motion.g>
      <motion.g className="home-label" transform="rotate(-9 1415 445)" {...fade(flightEnd)}>
        <text x="1416" y="449">Taiwan</text>
      </motion.g>
      <g ref={planeRef} className="sk-pen" style={{ opacity: 0 }} aria-hidden>
        {PLANE.fills.map((fill) => (
          <path key={fill.d} className="sk-solid" d={fill.d} />
        ))}
      </g>

      {/* The person at the desk. */}
      <Pen drawing={DESK} drawn={drawn} duration={T.desk.seconds} delay={lead + T.desk.at} />
    </svg>
  );
}
