import type { ReactNode } from 'react';

/** The "rule + uppercase label" heading that opens a block inside a page section. */
export default function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-6 flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">
      <span className="h-px w-12 bg-zinc-200" />
      {children}
    </h3>
  );
}
