import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { EASE } from '@/lib/motion';
import SketchTitle from './sketch/SketchTitle';

/**
 * A page's top-level section: the fade-and-slide that plays as tabs swap, plus
 * the hand-written title it opens with, its stroke drawn under it. `actions`
 * sits on the right of that title row — a pill or two, never more. The first
 * section of a page carries the page's `h1`; a second one passes `as="h2"`.
 */
export default function Section({
  title,
  as = 'h1',
  actions,
  children,
}: {
  /** Left out by a page that writes its own headline. */
  title?: string;
  as?: 'h1' | 'h2';
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="w-full"
    >
      {/* The same row with or without actions; the top padding is the room the tilted title climbs into. */}
      {title ? (
        <div className="mb-10 flex items-end justify-between gap-4 pt-3">
          <SketchTitle as={as}>{title}</SketchTitle>
          {actions}
        </div>
      ) : null}
      {children}
    </motion.section>
  );
}
