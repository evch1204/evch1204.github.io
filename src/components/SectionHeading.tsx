import type { ReactNode } from 'react';

/**
 * The heading of a block inside a page: the words in the hand with a short
 * stroke under them. `h3` opens a block inside a page section.
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
    <div className={className}>
      <Heading className="sk-heading">{children}</Heading>
    </div>
  );
}
