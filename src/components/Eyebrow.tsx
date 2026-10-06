import type { ReactNode } from 'react';

/**
 * The small pencilled label that opens a block — a card's category, a
 * case-study section, a register row's name. It carries no margin of its own:
 * the caller sets the gap to what follows.
 */
export default function Eyebrow({
  as: Tag = 'p',
  className = '',
  children,
}: {
  as?: 'p' | 'h3' | 'h4' | 'dt';
  className?: string;
  children: ReactNode;
}) {
  return <Tag className={`text-[13px] font-semibold text-graphite${className ? ` ${className}` : ''}`}>{children}</Tag>;
}
