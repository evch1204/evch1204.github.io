import type { LucideIcon } from 'lucide-react';
import { linkProps } from '@/lib/links';
import Frame from './sketch/Frame';

/**
 * The address chip: an icon and a truncating label in a pencilled loop. With
 * an `href` it is a link that opens elsewhere; without one it is the quieter
 * chip the profile uses for a fact that goes nowhere, like the city.
 */
const CHIP = 'sk-chip !px-3.5 !py-1.5 !text-sm';

export default function Chip({ Icon, href, children }: { Icon: LucideIcon; href?: string; children: string }) {
  const body = (
    <>
      <Icon size={15} strokeWidth={1.8} className="shrink-0" />
      <span className="truncate">{children}</span>
    </>
  );
  if (!href) {
    return (
      <span className={CHIP}>
        <Frame r={999} weight={1.2} tone={0.4} />
        {body}
      </span>
    );
  }
  return (
    <a href={href} {...linkProps(href)} className={`${CHIP} !text-ink rounded-full focus-ring`}>
      <Frame r={999} weight={1.3} tone={0.7} />
      {body}
    </a>
  );
}
