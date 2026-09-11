import type { LucideIcon } from 'lucide-react';
import { linkProps } from '@/lib/links';

/**
 * The mono address chip: an icon and a truncating label in a rounded outline.
 * With an `href` it is a link that opens elsewhere; without one it is the muted
 * chip the profile uses for a fact that goes nowhere, like the city.
 */
const LINK =
  'inline-flex max-w-full items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 font-mono text-xs font-bold text-zinc-600 transition-colors hover:border-zinc-900 hover:text-zinc-900';
const MUTED =
  'inline-flex max-w-full items-center gap-2 rounded-full border border-zinc-100 bg-zinc-50 px-4 py-2 font-mono text-xs font-bold text-zinc-500';

export default function Chip({ Icon, href, children }: { Icon: LucideIcon; href?: string; children: string }) {
  const body = (
    <>
      <Icon size={14} className="shrink-0" />
      <span className="truncate">{children}</span>
    </>
  );
  if (!href) return <span className={MUTED}>{body}</span>;
  return (
    <a href={href} {...linkProps(href)} className={LINK}>
      {body}
    </a>
  );
}
