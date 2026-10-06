import { useEffect, type RefObject } from 'react';
import { motion, useReducedMotion } from 'motion/react';

/**
 * One continuous monoline stroke, drawn upright and slanted by the group's
 * skew, so the dash animation writes it the way a pen would.
 */
const HELLO_PATH =
  'M 20 118 C 34 96, 50 60, 56 30 C 58 16, 44 12, 42 30 C 40 60, 44 110, 48 150 ' +
  'C 50 120, 60 100, 70 100 C 82 100, 78 128, 74 150 C 78 160, 100 148, 120 118 ' +
  'C 124 106, 102 100, 98 122 C 94 146, 118 160, 140 136 C 152 120, 170 80, 180 48 ' +
  'C 186 26, 212 20, 212 42 C 212 70, 190 112, 176 150 C 174 158, 184 156, 194 140 ' +
  'C 206 120, 224 80, 234 48 C 240 26, 266 20, 266 42 C 266 70, 244 112, 230 150 ' +
  'C 228 158, 238 156, 248 140 C 258 122, 272 108, 280 108 C 266 104, 254 122, 258 140 ' +
  'C 262 158, 286 158, 292 138 C 296 122, 290 108, 280 108 C 286 102, 296 108, 306 114';

/** Seconds: the pause before the pen starts, the writing itself, and the hold after. */
const START = 0.2;
const DRAW = 2;
const HOLD = 0.42;
/** The pen: eases off the mark and slows gently into the final tail. */
const PEN_EASE = [0.45, 0.02, 0.2, 1] as const;
/** The drain: slow to let go of the first stroke, then gone. */
const DRAIN = 1.1;
const DRAIN_EASE = [0.5, 0, 0.75, 0.4] as const;

type HelloIntroProps = {
  /** The stroke, for the tour to read where its tail is. */
  pathRef: RefObject<SVGPathElement | null>;
  /** True once the word should drain out through its tail. */
  draining: boolean;
  /** The word has been written and held: time for the ink to leave. Must be stable. */
  onWritten: () => void;
  /** The reader tapped or pressed a key during the writing: straight to the home. Must be stable. */
  onSkip: () => void;
};

/**
 * The Mac's first-boot hello: one stroke written in real time, held a beat,
 * then drained out through the tail of the o, where the pen tour picks the
 * ink up. The sheet behind it lifts as the drain starts, so the page is there
 * for the pen to draw on.
 */
export default function HelloIntro({ pathRef, draining, onWritten, onSkip }: HelloIntroProps) {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (draining) return;
    const total = reduced ? 0.9 : START + DRAW + HOLD;
    const id = window.setTimeout(onWritten, total * 1000);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') onSkip();
    };
    window.addEventListener('pointerdown', onSkip);
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener('pointerdown', onSkip);
      window.removeEventListener('keydown', onKey);
    };
  }, [draining, onWritten, onSkip, reduced]);

  return (
    <motion.div className="hello-intro" aria-hidden exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
      <motion.div
        className="hello-intro-sheet"
        initial={false}
        animate={{ opacity: draining ? 0 : 1 }}
        transition={{ duration: 0.5 }}
      />
      <svg className="hello-intro-mark" viewBox="-10 0 330 180">
        <g transform="translate(26 0) skewX(-10)">
          <motion.path
            ref={pathRef}
            d={HELLO_PATH}
            initial={{ pathLength: reduced ? 1 : 0, pathOffset: 0 }}
            animate={draining ? { pathLength: 1, pathOffset: 1 } : { pathLength: 1, pathOffset: 0 }}
            transition={
              draining
                ? { duration: DRAIN, ease: DRAIN_EASE }
                : { duration: reduced ? 0 : DRAW, delay: START, ease: PEN_EASE }
            }
          />
        </g>
      </svg>
    </motion.div>
  );
}
