import { useEffect, useRef, type CSSProperties } from 'react';
import { motion, useReducedMotion, type Variants } from 'motion/react';
import { EASE } from '@/lib/motion';
import { DOODLES, type Destination } from '@/pages/home/doodles';
import '@/pages/home/styles/home-doodles.css';

const PEN_EASE = [0.45, 0.02, 0.2, 1] as const;

type DoodlesProps = {
  /** Follows the hero: the doodles are written in once this is true. */
  shown: boolean;
  /** Seconds after the reveal starts before the first one is written. */
  lead: number;
  /** A tap on a doodle goes where it points. */
  onNavigate: (to: Destination) => void;
};

/**
 * The ring of doodles in the white around the name. Each is written in a
 * beat after the last, bobs on its own clock, leans with the pointer (deeper
 * ones more), comes alive under the pointer and opens what it draws when
 * tapped. Motion writes the strokes and the reveal; the bob, the lean and the
 * hover life are CSS, and the pointer only writes two variables on the layer.
 */
export default function Doodles({ shown, lead, onNavigate }: DoodlesProps) {
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
    <motion.div ref={layerRef} className="home-doodles" initial="hidden" animate={shown ? 'shown' : 'hidden'}>
      {DOODLES.map((doodle, i) => {
        const delay = lead + 0.55 + i * 0.07;
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
          <button
            key={doodle.id}
            type="button"
            className={`home-doodle focus-ring${doodle.phone ? ' home-doodle-phone' : ''}`}
            data-doodle={doodle.id}
            aria-label={doodle.label}
            style={style}
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
          </button>
        );
      })}
    </motion.div>
  );
}
