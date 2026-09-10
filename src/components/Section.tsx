import type { ReactNode } from 'react';
import { motion } from 'motion/react';

/**
 * A page's top-level section: the fade-and-slide that plays as tabs swap, plus
 * the "— LABEL" heading it opens with.
 */
export default function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="w-full"
    >
      <div className="mb-7">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400 mb-2 flex items-center gap-3">
          <span className="w-12 h-[1px] bg-zinc-200" />
          {title}
        </h2>
      </div>
      {children}
    </motion.section>
  );
}
