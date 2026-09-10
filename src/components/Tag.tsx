import type { ReactNode } from 'react';

/**
 * The rounded chip, in the four sizes the pages actually use. They were five
 * hand-written class strings; the differences that survived are kept as variants
 * rather than smoothed over.
 */
const TAG_CLASSES = {
  /** Tag row on a project card. */
  card: 'text-[10px] font-bold px-3 py-1.5 rounded-full bg-zinc-100 text-zinc-500 uppercase tracking-wider',
  /** Tag row on the featured project — one step tighter vertically. */
  featured: 'text-[10px] font-bold px-3 py-1 rounded-full bg-zinc-100 text-zinc-500 uppercase tracking-wider',
  /** Technology and skill chips in the project modal and the resume panel. */
  detail: 'inline-block rounded-full bg-zinc-100 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-600',
  /** Stack chips inside an expanded experience row. */
  role: 'inline-block rounded-full bg-zinc-100 px-[11px] py-[5px] text-[10px] font-bold uppercase leading-none tracking-wider text-zinc-500',
} as const;

export type TagVariant = keyof typeof TAG_CLASSES;

export default function Tag({
  variant = 'card',
  children,
}: {
  variant?: TagVariant;
  children: ReactNode;
}) {
  return <span className={TAG_CLASSES[variant]}>{children}</span>;
}
