import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import SectionHeading from './SectionHeading';

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
      <SectionHeading as="h2" className="mb-7">
        {title}
      </SectionHeading>
      {children}
    </motion.section>
  );
}
