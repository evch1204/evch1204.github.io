import { useRef } from 'react';
import { useInView } from 'motion/react';
import Pen from '@/components/sketch/Pen';
import { WINDOW } from '@/pages/about/sketch';

/**
 * The About page's picture: the desk by the window, traced from the sketch,
 * with home and here in the one view. Taipei 101 stands over the skyline and
 * the Golden Gate spans the bay in front of it. It is written in from the
 * top of the sheet down the first time it scrolls into view.
 */
export default function WindowScene({ className = '' }: { className?: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' });
  return (
    <svg
      ref={ref}
      viewBox={WINDOW.box.join(' ')}
      className={`sk-art h-auto w-full ${className}`}
      role="img"
      aria-label="A hand-drawn desk by a window: a laptop, a plant, two cups and a book, and through the glass Taipei 101 with the Golden Gate Bridge in front of it."
    >
      <Pen drawing={WINDOW} drawn={inView} duration={3.4} delay={0.2} weight={0.9} />
    </svg>
  );
}
