import { useRef } from 'react';
import { useInView } from 'motion/react';
import Pen from '@/components/sketch/Pen';
import { PAPER_PLANE, TRAIL } from '@/pages/contact/sketch';

/** Seconds the trail takes to write, dash after dash; the plane is drawn as the last dash lands. */
const TRAIL_SECONDS = 1.5;

/** The box that holds both drawings: they share the collage sheet's coordinates. */
const BOX = (() => {
  const x0 = Math.min(TRAIL.box[0], PAPER_PLANE.box[0]);
  const y0 = Math.min(TRAIL.box[1], PAPER_PLANE.box[1]);
  const x1 = Math.max(TRAIL.box[0] + TRAIL.box[2], PAPER_PLANE.box[0] + PAPER_PLANE.box[2]);
  const y1 = Math.max(TRAIL.box[1] + TRAIL.box[3], PAPER_PLANE.box[1] + PAPER_PLANE.box[3]);
  return `${x0} ${y0} ${x1 - x0} ${y1 - y0}`;
})();

/**
 * The paper plane beside the headline, traced from the sketch. Its trail is
 * written the way it was flown, from where the plane set off, round the loop
 * and up, and the plane itself is drawn at the end of it.
 */
export default function PaperPlane({ className = '' }: { className?: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true });
  return (
    <svg ref={ref} viewBox={BOX} className={`sk-art h-auto ${className}`} aria-hidden>
      <Pen drawing={TRAIL} drawn={inView} duration={TRAIL_SECONDS} delay={0.5} weight={1.25} />
      <Pen drawing={PAPER_PLANE} drawn={inView} duration={0.6} delay={0.5 + TRAIL_SECONDS} weight={1.15} />
    </svg>
  );
}
