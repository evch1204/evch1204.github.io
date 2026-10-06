import { motion, useReducedMotion } from 'motion/react';
import { EASE } from '@/lib/motion';
import { MOUSE } from '@/pages/home/sketch';
import Pen from './Pen';

type ScrollHintProps = {
  /** The ink has reached it: draw the mouse, then say what it is for. */
  drawn: boolean;
  /** No drops this visit: it arrives last, on its own. */
  stagger: boolean;
  onExplore: () => void;
};

/**
 * `Scroll to explore`, at the foot of the sheet: the traced mouse with its
 * wheel ticking, the words, a chevron. A tap, or a scroll of the wheel on
 * the home, opens the next tab.
 */
export default function ScrollHint({ drawn, stagger, onExplore }: ScrollHintProps) {
  const reduced = useReducedMotion();
  const delay = stagger ? 1.8 : 0;
  return (
    <motion.button
      type="button"
      className="home-hint focus-ring"
      data-ink="mouse"
      data-ink-at="7"
      initial={{ opacity: 0 }}
      animate={{ opacity: drawn ? 1 : 0 }}
      transition={{ duration: 0.4, ease: EASE, delay: drawn ? delay : 0 }}
      inert={!drawn}
      onClick={onExplore}
    >
      <svg className="home-hint-mouse" viewBox="748 878 36 44" aria-hidden>
        <Pen strokes={MOUSE} drawn={drawn} duration={0.45} delay={delay} />
        <path className={reduced ? undefined : 'home-hint-wheel'} d="M 766 888 V 895" />
      </svg>
      <motion.span
        initial={{ opacity: 0, y: 6 }}
        animate={drawn ? { opacity: 1, y: 0 } : { opacity: 0, y: reduced ? 0 : 6 }}
        transition={{ duration: 0.6, ease: EASE, delay: drawn ? delay + 0.35 : 0 }}
      >
        Scroll to explore
      </motion.span>
      <motion.svg
        className="home-hint-chevron"
        viewBox="0 0 16 10"
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: drawn ? 1 : 0 }}
        transition={{ duration: 0.5, ease: EASE, delay: drawn ? delay + 0.6 : 0 }}
      >
        <path d="M 2 2 L 8 8 L 14 2" />
      </motion.svg>
    </motion.button>
  );
}
