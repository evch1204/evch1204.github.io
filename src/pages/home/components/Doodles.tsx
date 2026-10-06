import { useEffect, useRef, type CSSProperties, type RefObject } from 'react';
import { motion, useReducedMotion, type Variants } from 'motion/react';
import { EASE } from '@/lib/motion';
import { DOODLES, type Destination } from '@/pages/home/doodles';
import '@/pages/home/styles/home-doodles.css';

const PEN_EASE = [0.45, 0.02, 0.2, 1] as const;

type DoodlesProps = {
  /** Which doodles the pen has reached, or every one of them. */
  drawn: ReadonlySet<string> | 'all';
  /** The pen is on its way round: show it. */
  touring: boolean;
  /** No pen this visit: the doodles arrive one after another on their own. */
  stagger: boolean;
  /** A tap on a doodle goes where it points. */
  onNavigate: (to: Destination) => void;
  penRef: RefObject<HTMLDivElement | null>;
};

/**
 * The ring of doodles in the white around the name, and the pen that draws
 * them. Each doodle is written in when the pen reaches it (or a beat after
 * the last, on a visit with no pen), bobs on its own clock, leans with the
 * pointer (deeper ones more), comes alive under the pointer and opens what it
 * draws when tapped.
 */
export default function Doodles({ drawn, touring, stagger, onNavigate, penRef }: DoodlesProps) {
  const reduced = useReducedMotion();
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced) return;
    const layer = layerRef.current;
    if (!layer) return;
    const onMove = (e: MouseEvent) => {
      layer.style.setProperty('--mx', (e.clientX / window.innerWidth - 0.5).toFixed(3));
      layer.style.setProperty('--my', (e.clientY / window.innerHeight - 0.5).toFixed(3));
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [reduced]);

  return (
    <div ref={layerRef} className={`home-doodles${touring ? ' is-touring' : ''}`}>
      {DOODLES.map((doodle, i) => {
        const shown = drawn === 'all' || drawn.has(doodle.id);
        const delay = stagger ? 0.55 + i * 0.07 : 0;
        const appear: Variants = {
          hidden: { opacity: 0, scale: 0.92 },
          shown: { opacity: 1, scale: 1, transition: { duration: 0.8, ease: EASE, delay } },
        };
        /* Every stroke of a drawing is written in the same window, so the scene arrives as one. */
        const write: Variants = {
          hidden: { pathLength: reduced ? 1 : 0 },
          shown: { pathLength: 1, transition: { duration: reduced ? 0 : 1, ease: PEN_EASE, delay } },
        };
        const style = {
          '--cx': `${doodle.at.x}%`,
          '--cy': `${doodle.at.y}%`,
          '--size': doodle.size,
          '--depth': doodle.depth,
          '--bob': `${doodle.bob}s`,
          '--phase': `${doodle.phase}s`,
          ...(doodle.phone && { '--phone-x': `${doodle.phone.x}%`, '--phone-y': `${doodle.phone.y}%` }),
        } as CSSProperties;
        return (
          <motion.button
            key={doodle.id}
            type="button"
            className={`home-doodle focus-ring${doodle.phone ? ' home-doodle-phone' : ''}`}
            data-doodle={doodle.id}
            aria-label={doodle.label}
            style={style}
            initial="hidden"
            animate={shown ? 'shown' : 'hidden'}
            onClick={() => onNavigate(doodle.to)}
          >
            <motion.span className="home-doodle-in" variants={appear}>
              <span className="home-doodle-bob">
                <svg viewBox="0 0 120 120" aria-hidden>
                  {doodle.paths.map((p) => (
                    <motion.path key={p.d} d={p.d} className={p.part && `part-${p.part}`} variants={write} />
                  ))}
                </svg>
                <span className="home-doodle-label" aria-hidden>
                  {doodle.label}
                </span>
              </span>
            </motion.span>
          </motion.button>
        );
      })}

      <div ref={penRef} className="home-pen" aria-hidden />
    </div>
  );
}
