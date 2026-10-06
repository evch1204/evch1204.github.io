import type { CSSProperties } from 'react';
import { motion, useReducedMotion, type Variants } from 'motion/react';
import { EASE, PEN_EASE } from '@/lib/motion';
import { DOODLES, type Destination } from '@/pages/home/doodles';

type DoodlesProps = {
  /** Which doodles a drop has reached, or every one of them. */
  drawn: ReadonlySet<string> | 'all';
  /** The drops are in the air: show them. */
  bursting: boolean;
  /** No drops this visit: the doodles arrive one after another on their own. */
  stagger: boolean;
  /** A tap on a doodle goes where it points. */
  onNavigate: (to: Destination) => void;
};

/** The spoken name: what it draws, and where a tap goes. */
const nameOf = (label: string, to: Destination) =>
  `${label}, opens ${to.project ? 'the project' : 'the Experience tab'}`;

/**
 * The ring of doodles in the white around the name, and the drops of ink
 * that draw them: one for each doodle and one for the dot under the name,
 * moved by the burst. Each doodle is written in when its drop lands (or a
 * beat after the last, on a visit with no drops) and then stays where the
 * ink left it, on the page: it only comes alive under the pointer, and opens
 * what it draws when tapped.
 */
export default function Doodles({ drawn, bursting, stagger, onNavigate }: DoodlesProps) {
  const reduced = useReducedMotion();

  return (
    <div className={`home-doodles${bursting ? ' is-bursting' : ''}`}>
      {DOODLES.map((doodle, i) => {
        const shown = drawn === 'all' || drawn.has(doodle.id);
        const delay = stagger ? 0.55 + i * 0.07 : 0;
        const appear: Variants = {
          hidden: { opacity: 0, scale: reduced ? 1 : 0.92 },
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
          ...(doodle.phone && { '--phone-x': `${doodle.phone.x}%`, '--phone-y': `${doodle.phone.y}%` }),
        } as CSSProperties;
        return (
          <motion.button
            key={doodle.id}
            type="button"
            className={`home-doodle focus-ring${doodle.phone ? ' home-doodle-phone' : ''}`}
            data-doodle={doodle.id}
            aria-label={nameOf(doodle.label, doodle.to)}
            style={style}
            initial="hidden"
            animate={shown ? 'shown' : 'hidden'}
            /* Until it is drawn there is nothing to tap, or to land on with Tab. */
            inert={!shown}
            onClick={() => onNavigate(doodle.to)}
          >
            <motion.span className="home-doodle-in" variants={appear}>
              <span className="home-doodle-art">
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

      {DOODLES.map((doodle) => (
        <span key={doodle.id} className="home-drop" data-drop={doodle.id} aria-hidden />
      ))}
      <span className="home-drop" data-drop="dot" aria-hidden />
    </div>
  );
}
