import { useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { PEN_EASE } from '@/lib/motion';
import type { Drawing } from './drawing';

type PenProps = {
  drawing: Drawing;
  /** True once the ink has arrived: write the strokes. */
  drawn: boolean;
  /** Seconds the whole drawing takes when it is written one stroke after another. */
  duration?: number;
  /** Seconds before the pen starts, for a drawing that arrives a beat after another. */
  delay?: number;
  /**
   * Write the drawing outwards from a point instead of stroke after stroke: every stroke starts
   * when a ring spreading from (`x`, `y`) reaches it, and the ring takes `seconds` to reach the
   * farthest. For a drawing too big for one pen: the map.
   */
  wave?: { x: number; y: number; seconds: number };
  /** Scales every stroke's width, for a drawing shown much larger or smaller than it was traced. */
  weight?: number;
  className?: string;
};

/** Where a stroke's path begins. */
const startOf = (d: string) => {
  const m = /^M(-?[\d.]+) (-?[\d.]+)/.exec(d);
  return m ? { x: Number(m[1]), y: Number(m[2]) } : { x: 0, y: 0 };
};

/**
 * A traced drawing written in by the pen, the way a hand would: a long
 * outline takes its time, a tick is over at once, and each line keeps the
 * weight and the darkness it had on the sheet. The solid areas are inked in
 * as the pen passes them. Each path is dashed to its own length by Motion, so
 * nothing is measured here. Goes inside an `<svg>`.
 */
export default function Pen({ drawing, drawn, duration = 1, delay = 0, wave, weight = 1, className = '' }: PenProps) {
  const reduced = useReducedMotion();
  const { strokes, fills } = drawing;
  const waveX = wave?.x, waveY = wave?.y, waveSeconds = wave?.seconds;

  /* When each stroke starts and how long it takes. */
  const timing = useMemo(() => {
    if (waveX !== undefined && waveY !== undefined && waveSeconds !== undefined) {
      const away = strokes.map((s) => {
        const at = startOf(s.d);
        return Math.hypot(at.x - waveX, at.y - waveY);
      });
      const farthest = Math.max(1, ...away);
      return strokes.map((s, i) => ({
        start: delay + (away[i] / farthest) * waveSeconds,
        seconds: Math.min(0.75, Math.max(0.18, s.len / 240)),
      }));
    }
    // One after another: the pen picks up where the last stroke ended, and each gets its share by length.
    const total = strokes.reduce((n, s) => n + s.len, 0) || 1;
    let at = delay;
    return strokes.map((s) => {
      const seconds = (s.len / total) * duration;
      const start = at;
      at += seconds;
      return { start, seconds };
    });
  }, [strokes, delay, duration, waveX, waveY, waveSeconds]);
  const span = waveSeconds ?? duration;

  return (
    <g className={`sk-pen ${className}`}>
      {strokes.map((s, i) => (
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
                  pathLength: { duration: timing[i].seconds, delay: drawn ? timing[i].start : 0, ease: s.len > 60 ? PEN_EASE : 'linear' },
                  opacity: { duration: 0.01, delay: drawn ? timing[i].start : 0 },
                }
          }
        />
      ))}
      {fills.map((fill, i) => (
        <motion.path
          key={`fill-${i}`}
          className="sk-solid"
          d={fill.d}
          initial={{ opacity: reduced ? 1 : 0 }}
          animate={{ opacity: drawn ? 1 : 0 }}
          transition={reduced ? { duration: 0 } : { duration: 0.35, delay: drawn ? delay + fill.at * span : 0 }}
        />
      ))}
    </g>
  );
}
