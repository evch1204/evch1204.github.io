import { motion, useReducedMotion } from 'motion/react';
import { PEN_EASE } from '@/lib/motion';
import type { Stroke } from '@/pages/home/sketch';

type PenProps = {
  /** The strokes, in the order the pen writes them. */
  strokes: Stroke[];
  /** True once the ink has arrived: write the strokes. */
  drawn: boolean;
  /** Seconds the whole drawing takes; each stroke gets its share by length. */
  duration: number;
  /** Seconds before the pen starts, for a scene that arrives a beat after another. */
  delay?: number;
  className?: string;
};

/**
 * A group of traced strokes written in one after another, the way a hand
 * would: a long outline takes its time, a tick is over at once. Each path is
 * dashed to its own length by Motion, so nothing is measured here.
 */
export default function Pen({ strokes, drawn, duration, delay = 0, className }: PenProps) {
  const reduced = useReducedMotion();
  const total = strokes.reduce((n, s) => n + s.len, 0) || 1;
  /* When each stroke starts: the pen picks up where the last one ended. */
  const starts = strokes.reduce<number[]>(
    (acc, _, i) => [...acc, i ? acc[i - 1] + (strokes[i - 1].len / total) * duration : delay],
    [],
  );
  return (
    <g className={className}>
      {strokes.map((s, i) => {
        const d = (s.len / total) * duration;
        const start = starts[i];
        return (
          /* Hidden until the pen reaches it: a zero-length stroke with round caps would show as a dot. */
          <motion.path
            key={i}
            d={s.d}
            initial={{ pathLength: reduced ? 1 : 0, opacity: reduced ? 1 : 0 }}
            animate={{ pathLength: drawn ? 1 : 0, opacity: drawn ? 1 : 0 }}
            transition={
              reduced
                ? { duration: 0 }
                : {
                    pathLength: { duration: d, delay: drawn ? start : 0, ease: s.len > 60 ? PEN_EASE : 'linear' },
                    opacity: { duration: 0.01, delay: drawn ? start : 0 },
                  }
            }
          />
        );
      })}
    </g>
  );
}
