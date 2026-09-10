import type { ReactNode } from 'react';

/**
 * The rounded chip, in the two sizes the pages actually use. There were five
 * hand-written class strings differing by a pixel or two of padding; those were
 * drift, not design, so they collapsed into one.
 */
const TAG_CLASSES = {
  /** Tag rows: project cards, the featured card, an expanded experience row. */
  default: 'text-[10px] font-bold px-3 py-1.5 rounded-full bg-zinc-100 text-zinc-500 uppercase tracking-wider',
  /** Technology and skill chips in the project modal and the resume panel. */
  detail: 'inline-block rounded-full bg-zinc-100 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-600',
} as const;

type TagVariant = keyof typeof TAG_CLASSES;

export default function Tag({
  variant = 'default',
  children,
}: {
  variant?: TagVariant;
  children: ReactNode;
}) {
  return <span className={TAG_CLASSES[variant]}>{children}</span>;
}
