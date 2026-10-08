import { Play } from 'lucide-react';
import { motion } from 'motion/react';
import Frame from '@/components/sketch/Frame';
import { EASE } from '@/lib/motion';

/**
 * The way into the demo video, on the hero picture itself: a blot of ink
 * with a play mark in it, centred, and "Watch demo" written under it so it
 * reads as the demo and not as the screenshot being a video. `delay` holds
 * it back while the frame is still in flight from the card, like the arrows.
 */
export default function DemoPlayButton({ delay, onClick }: { delay: number; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-haspopup="dialog"
      aria-label="Watch the demo video"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.3, delay, ease: EASE } }}
      className="group absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2 rounded-2xl p-2 focus-ring md:gap-3"
    >
      <span className="relative isolate flex h-16 w-16 items-center justify-center rounded-full text-page shadow-[0_10px_30px_rgba(0,0,0,0.3)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105 md:h-20 md:w-20">
        <Frame r={999} weight={1.8} tone={1} fill className="sk-under" />
        <Play size={30} fill="currentColor" className="ml-1 md:ml-1.5" aria-hidden />
      </span>
      <span className="sk-btn px-4 py-1.5 text-sm shadow-[0_6px_20px_rgba(0,0,0,0.25)] rounded-full">
        <Frame r={999} weight={1.6} tone={1} fill className="sk-under" />
        Watch demo
      </span>
    </motion.button>
  );
}
