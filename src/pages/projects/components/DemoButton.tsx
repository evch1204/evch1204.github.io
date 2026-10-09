import type { Ref } from 'react';
import { Play } from 'lucide-react';
import { motion } from 'motion/react';
import Frame from '@/components/sketch/Frame';
import { EASE } from '@/lib/motion';

/**
 * How each blot of ink is ruled: a pill, the ink's own weight, at full tone.
 * The demo's stage redraws the blots with the same pen, so its stand-in is
 * the button and not a likeness of it.
 */
export const BLOT = { r: 999, weight: 1.6, tone: 1 } as const;

/** The soft shadow a blot casts on the picture, so it reads as stuck on rather than printed. */
export const BLOT_SHADOW = 'drop-shadow(0 8px 24px rgba(0,0,0,0.22))';

/**
 * The way into the demo video: two blots of ink stuck on the hero frame's
 * bottom edge, right side, straddling the line — half on the picture, half
 * off it — like a sticker on a photo. It covers a sliver of the picture and
 * nothing else. A circle with the play mark, and "Watch demo" beside it.
 *
 * `delay` holds it back while the frame is still in flight from the card,
 * like the arrows. `hidden` keeps its place but not its ink: while the demo is
 * open the stage draws a stand-in exactly here, and takes the pen from it.
 * `circleRef` and `labelRef` are the two blots, for the stage to measure.
 */
export default function DemoButton({
  delay,
  onClick,
  hidden = false,
  circleRef,
  labelRef,
}: {
  delay: number;
  onClick: () => void;
  hidden?: boolean;
  circleRef: Ref<HTMLSpanElement>;
  labelRef: Ref<HTMLSpanElement>;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-haspopup="dialog"
      aria-label="Watch the demo video"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.3, delay, ease: EASE } }}
      style={{ visibility: hidden ? 'hidden' : undefined }}
      // The lift is the whole sticker's, so the label's own `.sk-btn` lift is switched off below.
      className="absolute bottom-0 right-4 z-10 flex translate-y-1/2 items-center gap-2 rounded-full transition-[translate] duration-[350ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:translate-y-[calc(50%-2px)] focus-ring motion-reduce:transition-none motion-reduce:hover:translate-y-1/2 md:right-6"
    >
      <span
        ref={circleRef}
        className="sk-frame relative isolate flex h-12 w-12 items-center justify-center rounded-full text-page shadow-[0_8px_24px_rgba(0,0,0,0.22)]"
      >
        <Frame {...BLOT} fill className="sk-under" />
        {/* A triangle's weight sits left of its box: a pixel to the right and it looks centred. */}
        <Play size={20} fill="currentColor" className="translate-x-px" aria-hidden />
      </span>
      <span ref={labelRef} className="sk-btn translate-none rounded-full px-4 py-1.5 text-sm shadow-[0_8px_24px_rgba(0,0,0,0.22)]">
        <Frame {...BLOT} fill className="sk-under" />
        Watch demo
      </span>
    </motion.button>
  );
}
