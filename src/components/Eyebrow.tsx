import type { ReactNode } from 'react';

/**
 * The small tracked-out label that opens a block — a card's category, a
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
  return (
    <Tag className={`text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400${className ? ` ${className}` : ''}`}>
      {children}
    </Tag>
  );
}
