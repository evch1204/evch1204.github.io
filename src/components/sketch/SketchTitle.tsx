import type { ReactNode } from 'react';
import { UNDERLINE } from './marks';
import Sketch from './Sketch';

/**
 * A page's title as the sketch writes one: the words in the hand, tilted up
 * a little, with the traced stroke drawn under them.
 */
export default function SketchTitle({
  as: Heading = 'h1',
  className = '',
  children,
}: {
  as?: 'h1' | 'h2';
  className?: string;
  children: ReactNode;
}) {
  return (
    <Heading className={`sk-title ${className}`}>
      <span className="sk-title-words">{children}</span>
      <Sketch drawing={UNDERLINE} stretch duration={0.5} delay={0.2} weight={1.5} className="sk-title-line" />
    </Heading>
  );
}
