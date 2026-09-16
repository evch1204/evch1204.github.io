import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import type { CtaKind } from '@/pages/home/usePhysicsPlayground';

type PhysBlockProps = Omit<ComponentPropsWithoutRef<'span'>, 'className' | 'children'> & {
  /** Physics class: the engine copies it onto the clone and the CSS styles both through it. */
  cls: string;
  /** Classes the source span alone wears when they differ from `cls` (layout, not physics). */
  sourceCls?: string;
  /** What a tap on this block's clone should run. */
  cta?: CtaKind;
  /** Block whose markup — an icon and a span or two — has to be cloned, not just its text. */
  rich?: boolean;
  children: ReactNode;
};

/**
 * One fallable word. The engine walks `[data-phys="1"]` in DOM order and reads
 * `data-phys-cls` off each hit, while the stylesheet matches source and clone
 * together (`:is(.word-block, .phys-block).fact`) — so the class and the
 * attribute have to say the same thing. Writing the pair in one place is what
 * keeps them from drifting.
 */
export default function PhysBlock({
  cls,
  sourceCls = cls,
  cta,
  rich,
  children,
  ...rest
}: PhysBlockProps) {
  return (
    <span
      className={`word-block ${sourceCls}`}
      data-phys="1"
      data-phys-cls={cls}
      data-phys-cta={cta}
      data-phys-html={rich ? '1' : undefined}
      {...rest}
    >
      {children}
    </span>
  );
}
