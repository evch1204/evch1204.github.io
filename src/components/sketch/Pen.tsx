import { motion, useReducedMotion } from 'motion/react';
import { PEN_EASE } from '@/lib/motion';
import type { Drawing } from './drawing';

type PenProps = {
  drawing: Drawing;
  /** True once the ink has arrived: write the strokes. */
  drawn: boolean;
  /** Seconds the whole drawing takes; each stroke gets its share by length. */
  duration: number;
  /** Seconds before the pen starts, for a drawing that arrives a beat after another. */
  delay?: number;
  /** Scales every stroke's width, for a drawing shown much larger or smaller than it was traced. */
  weight?: number;
  className?: string;
};

/**
 * A traced drawing written in one stroke after another, the way a hand
 * would: a long outline takes its time, a tick is over at once, and each
 * line keeps the weight and the darkness it had on the sheet. The solid
 * areas are inked in as the pen passes them. Each path is dashed to its own
 * length by Motion, so nothing is measured here. Goes inside an `<svg>`.
 */
export default function Pen({ drawing, drawn, duration, delay = 0, weight = 1, className = '' }: PenProps) {
  const reduced = useReducedMotion();
  const { strokes, fills } = drawing;
  const total = strokes.reduce((n, s) => n + s.len, 0) || 1;
  /* When each stroke starts: the pen picks up where the last one ended. */
  const starts = strokes.reduce<number[]>(
    (acc, _, i) => [...acc, i ? acc[i - 1] + (strokes[i - 1].len / total) * duration : delay],
    [],
  );
  return (
    <g className={`sk-pen ${className}`}>
      {strokes.map((s, i) => {
        const d = (s.len / total) * duration;
        return (
          /* Hidden until the pen reaches it: a zero-length stroke with round caps would show as a dot. */
          <motion.path
            key={i}
            d={s.d}
            style={{ strokeWidth: (s.w ?? 1.6) * weight, strokeOpacity: s.o }}
            initial={{ pathLength: reduced ? 1 : 0, opacity: reduced ? 1 : 0 }}
            animate={{ pathLength: drawn ? 1 : 0, opacity: drawn ? 1 : 0 }}
            transition={
              reduced
                ? { duration: 0 }
                : {
                    pathLength: { duration: d, delay: drawn ? starts[i] : 0, ease: s.len > 60 ? PEN_EASE : 'linear' },
                    opacity: { duration: 0.01, delay: drawn ? starts[i] : 0 },
                  }
            }
          />
        );
      })}
      {fills.map((fill, i) => (
        <motion.path
          key={`fill-${i}`}
          className="sk-solid"
          d={fill.d}
          initial={{ opacity: reduced ? 1 : 0 }}
          animate={{ opacity: drawn ? 1 : 0 }}
          transition={reduced ? { duration: 0 } : { duration: 0.35, delay: drawn ? delay + fill.at * duration : 0 }}
        />
      ))}
    </g>
  );
}
