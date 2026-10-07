import { motion, useReducedMotion } from 'motion/react';
import Pen from '@/components/sketch/Pen';
import { ARROW_DOWN } from '@/components/sketch/marks';
import { EASE } from '@/lib/motion';
import { MOUSE } from '@/pages/home/sketch';

type ScrollHintProps = {
  /** The page is being written: draw the mouse when its turn comes, then say what it is for. */
  shown: boolean;
  /** Seconds into the writing at which its turn comes: it is the last thing on the sheet. */
  delay: number;
  onExplore: () => void;
};

/**
 * `Scroll to explore`, at the foot of the sheet: the traced mouse, the
 * words, and the arrow the sketch draws beside them. It means what it says:
 * the sheet scrolls, and a tap on the hint scrolls it for the reader.
 */
export default function ScrollHint({ shown, delay, onExplore }: ScrollHintProps) {
  const reduced = useReducedMotion();
  return (
    <motion.button
      type="button"
      className="home-hint focus-ring"
      initial={{ opacity: 0 }}
      animate={{ opacity: shown ? 1 : 0 }}
      transition={{ duration: 0.4, ease: EASE, delay: shown ? delay : 0 }}
      inert={!shown}
      onClick={onExplore}
    >
      <svg className="home-hint-mouse sk-art" viewBox={MOUSE.box.join(' ')} aria-hidden>
        <Pen drawing={MOUSE} drawn={shown} duration={0.45} delay={delay} weight={1.15} />
      </svg>
      <motion.span
        initial={{ opacity: 0, y: 6 }}
        animate={shown ? { opacity: 1, y: 0 } : { opacity: 0, y: reduced ? 0 : 6 }}
        transition={{ duration: 0.6, ease: EASE, delay: shown ? delay + 0.35 : 0 }}
      >
        Scroll to explore
      </motion.span>
      <svg className="home-hint-arrow sk-art" viewBox={ARROW_DOWN.box.join(' ')} aria-hidden>
        <Pen drawing={ARROW_DOWN} drawn={shown} duration={0.4} delay={delay + 0.6} weight={1.2} />
      </svg>
    </motion.button>
  );
}
