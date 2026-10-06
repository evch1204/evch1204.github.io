import { motion, useReducedMotion } from 'motion/react';
import Pen from '@/components/sketch/Pen';
import { ARROW_DOWN } from '@/components/sketch/marks';
import { EASE } from '@/lib/motion';
import { MOUSE } from '@/pages/home/sketch';

type ScrollHintProps = {
  /** The ink has reached it: draw the mouse, then say what it is for. */
  drawn: boolean;
  /** No drops this visit: it arrives last, on its own. */
  stagger: boolean;
  onExplore: () => void;
};

/**
 * `Scroll to explore`, at the foot of the sheet: the traced mouse, the
 * words, and the arrow the sketch draws beside them. A tap, or a scroll of
 * the wheel on the home, opens the next tab.
 */
export default function ScrollHint({ drawn, stagger, onExplore }: ScrollHintProps) {
  const reduced = useReducedMotion();
  const delay = stagger ? 1.8 : 0;
  return (
    <motion.button
      type="button"
      className="home-hint focus-ring"
      data-ink="mouse"
      data-ink-at="3"
      initial={{ opacity: 0 }}
      animate={{ opacity: drawn ? 1 : 0 }}
      transition={{ duration: 0.4, ease: EASE, delay: drawn ? delay : 0 }}
      inert={!drawn}
      onClick={onExplore}
    >
      <svg className="home-hint-mouse sk-art" viewBox={MOUSE.box.join(' ')} aria-hidden>
        <Pen drawing={MOUSE} drawn={drawn} duration={0.45} delay={delay} weight={1.15} />
      </svg>
      <motion.span
        initial={{ opacity: 0, y: 6 }}
        animate={drawn ? { opacity: 1, y: 0 } : { opacity: 0, y: reduced ? 0 : 6 }}
        transition={{ duration: 0.6, ease: EASE, delay: drawn ? delay + 0.35 : 0 }}
      >
        Scroll to explore
      </motion.span>
      <svg className="home-hint-arrow sk-art" viewBox={ARROW_DOWN.box.join(' ')} aria-hidden>
        <Pen drawing={ARROW_DOWN} drawn={drawn} duration={0.4} delay={delay + 0.6} weight={1.2} />
      </svg>
    </motion.button>
  );
}
