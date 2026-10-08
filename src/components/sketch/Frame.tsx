import { useId, useLayoutEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'motion/react';
import { PEN_EASE } from '@/lib/motion';
import { boxOutline, seedOf } from './hand';

type FrameProps = {
  /** Corner radius in px; anything large makes a pill. */
  r?: number;
  /** Stroke width in px. */
  weight?: number;
  /** How dark the line is, 0 to 1: pencil for a chip, ink for a button. */
  tone?: number;
  /** Fill the shape with ink: a solid button, the blot behind the tab we are on. */
  fill?: boolean;
  /** A second, fainter pass of the pencil, a little off the first. */
  double?: boolean;
  /** Write the outline in the first time it scrolls into view, rather than having it there. */
  draw?: boolean;
  className?: string;
};

/**
 * The outline of whatever it is put inside, drawn by hand. It fills its
 * nearest positioned ancestor (give that `sk-frame`), measures it, and rules
 * its edge with a line that wanders a little and overshoots where it closes;
 * the outline is redrawn whenever the box changes size. The line sits on its
 * own layer over the box, out of the pointer's way, so nothing inside moves.
 */
export default function Frame({ r = 14, weight = 1.5, tone = 0.85, fill = false, double = false, draw = false, className = '' }: FrameProps) {
  const reduced = useReducedMotion();
  const seed = seedOf(useId());
  const ref = useRef<HTMLSpanElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -8% 0px' });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const w = el.offsetWidth, h = el.offsetHeight;
      setSize((prev) => (prev && prev.w === w && prev.h === h ? prev : { w, h }));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const written = !draw || reduced || inView;
  return (
    <span ref={ref} className={`sk-frame-art ${className}`} aria-hidden>
      {size && size.w > 0 && size.h > 0 ? (
        // Fills the box rather than taking the measured size: a box that is
        // animating stretches the last drawing to fit between measurements,
        // instead of showing it at a stale size, and at rest the two agree.
        <svg width="100%" height="100%" preserveAspectRatio="none" viewBox={`0 0 ${size.w} ${size.h}`}>
          {fill ? <path className="sk-frame-fill" d={boxOutline(size.w, size.h, r, seed, { closed: true })} /> : null}
          {double ? (
            <path
              d={boxOutline(size.w, size.h, r, seed + 7, { wander: 1 })}
              style={{ strokeWidth: weight * 0.7, strokeOpacity: written ? tone * 0.32 : 0, transition: 'stroke-opacity 0.5s 0.45s' }}
              transform="translate(1.5 2)"
            />
          ) : null}
          {draw && !reduced ? (
            <motion.path
              d={boxOutline(size.w, size.h, r, seed)}
              style={{ strokeWidth: weight, strokeOpacity: tone }}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: written ? 1 : 0, opacity: written ? 1 : 0 }}
              transition={{ pathLength: { duration: 0.9, ease: PEN_EASE }, opacity: { duration: 0.01 } }}
            />
          ) : (
            <path d={boxOutline(size.w, size.h, r, seed)} style={{ strokeWidth: weight, strokeOpacity: tone }} />
          )}
        </svg>
      ) : null}
    </span>
  );
}
