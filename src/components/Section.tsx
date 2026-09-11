import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import SectionHeading from './SectionHeading';

/**
 * A page's top-level section: the fade-and-slide that plays as tabs swap, plus
 * the "— LABEL" heading it opens with. `actions` sits on the right of that
 * title row — a pill or two, never more.
 */
export default function Section({
  title,
  actions,
  children,
}: {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="w-full"
    >
      {actions ? (
        <div className="mb-7 flex items-center justify-between gap-4">
          <SectionHeading as="h2" className="mb-0">
            {title}
          </SectionHeading>
          {actions}
        </div>
      ) : (
        <SectionHeading as="h2" className="mb-7">
          {title}
        </SectionHeading>
      )}
      {children}
    </motion.section>
  );
}
