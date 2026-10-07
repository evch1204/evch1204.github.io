import { useRef } from 'react';
import { useInView } from 'motion/react';
import type { Drawing } from './drawing';
import Pen from './Pen';

type SketchProps = {
  drawing: Drawing;
  /** Seconds the drawing takes to write. */
  duration?: number;
  delay?: number;
  weight?: number;
  /** Names the picture for a screen reader; without it the drawing is decoration. */
  label?: string;
  /** Fill the box it is given instead of keeping its proportions: for an underline as wide as its words. */
  stretch?: boolean;
  className?: string;
};

/**
 * A traced drawing on its own: an SVG the size of the drawing's box, written
 * in by the pen the first time it scrolls into view.
 */
export default function Sketch({ drawing, duration = 0.9, delay = 0, weight, label, stretch = false, className = '' }: SketchProps) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -6% 0px' });
  return (
    <svg
      ref={ref}
      viewBox={drawing.box.join(' ')}
      preserveAspectRatio={stretch ? 'none' : undefined}
      className={`sk-art ${className}`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <Pen drawing={drawing} drawn={inView} duration={duration} delay={delay} weight={weight} />
    </svg>
  );
}
