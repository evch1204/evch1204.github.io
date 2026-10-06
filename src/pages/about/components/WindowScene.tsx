import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'motion/react';
import Pen from '@/components/sketch/Pen';
import { EASE } from '@/lib/motion';
import { WINDOW } from '@/pages/about/sketch';

/** The note pinned beside the window, each line where the sketch wrote it, on the same slant. */
const NOTE = [
  { text: 'Better', x: 1212.5, y: 161 },
  { text: 'Solutions', x: 1214.5, y: 177.5 },
  { text: 'Through', x: 1223, y: 192.5 },
  { text: 'Technology', x: 1220, y: 211 },
];
const SLANT = -15.5;

/**
 * The About page's picture: the desk by the window, traced from the sketch,
 * with home and here in the one view. Taipei 101 stands over the skyline and
 * the Golden Gate spans the bay in front of it. It is written in from the
 * top of the sheet down the first time it scrolls into view, and the note
 * comes up beside it once the window frame is there to hang it by.
 */
export default function WindowScene({ className = '' }: { className?: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' });
  const reduced = useReducedMotion();
  return (
    <svg
      ref={ref}
      viewBox={WINDOW.box.join(' ')}
      className={`sk-art h-auto w-full ${className}`}
      role="img"
      aria-label="A hand-drawn desk by a window: a laptop, a plant, two cups and a book, and through the glass Taipei 101 with the Golden Gate Bridge in front of it. A note beside it reads: Better solutions through technology."
    >
      <Pen drawing={WINDOW} drawn={inView} duration={3.4} delay={0.2} weight={0.9} />
      <motion.g
        initial={{ opacity: reduced ? 1 : 0 }}
        animate={{ opacity: inView ? 1 : 0 }}
        transition={{ duration: reduced ? 0 : 0.7, delay: inView ? 0.9 : 0, ease: EASE }}
        aria-hidden
      >
        {NOTE.map(({ text, x, y }) => (
          <text key={text} x={x} y={y} transform={`rotate(${SLANT} ${x} ${y})`} className="fill-ink text-[10.6px] font-medium">
            {text}
          </text>
        ))}
      </motion.g>
    </svg>
  );
}
