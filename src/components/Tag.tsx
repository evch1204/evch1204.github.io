import type { ReactNode } from 'react';
import Frame from './sketch/Frame';

/**
 * A word in a pencilled loop, in the two weights the pages use: `default` for
 * a row of tags under a heading, `detail` for the darker chip that carries a
 * technology or a skill in a meta strip.
 */
const TAG_CLASSES = {
  /** Tag rows: project cards, the featured card, an expanded experience row. */
  default: 'sk-chip',
  /** Technology and skill chips in the project page's meta strip and the resume panel. */
  detail: 'sk-chip !text-ink',
} as const;

type TagVariant = keyof typeof TAG_CLASSES;

export default function Tag({
  variant = 'default',
  children,
}: {
  variant?: TagVariant;
  children: ReactNode;
}) {
  return (
    <span className={TAG_CLASSES[variant]}>
      <Frame r={999} weight={1.2} tone={variant === 'detail' ? 0.6 : 0.45} />
      {children}
    </span>
  );
}
