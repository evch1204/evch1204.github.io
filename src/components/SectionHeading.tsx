import type { ReactNode } from 'react';

/**
 * The "rule + uppercase label" heading. `h3` opens a block inside a page
 * section; a `Section` renders its own title through this as the page's `h2`.
 */
export default function SectionHeading({
  as: Heading = 'h3',
  className = 'mb-6',
  children,
}: {
  as?: 'h2' | 'h3';
  /** Replaces the default bottom margin. */
  className?: string;
  children: ReactNode;
}) {
  return (
    <Heading
      className={`flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400 ${className}`}
    >
      <span className="h-px w-12 bg-zinc-200" />
      {children}
    </Heading>
  );
}
