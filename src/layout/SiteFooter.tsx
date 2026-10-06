import Sketch from '@/components/sketch/Sketch';
import { SQUIGGLE } from '@/components/sketch/marks';
import { BRAND, EMAIL, MAILTO, NAME, SOCIAL_LINKS } from '@/content/site';
import { linkProps } from '@/lib/links';

/** The profile links; the email already has its own line above them. */
const FOOTER_LINKS = SOCIAL_LINKS.filter((link) => link.id !== 'mail');

/**
 * The one footer, under every scrolling tab. The page closes the way the
 * sketch's pages do, with a wavy line drawn across the foot of the sheet,
 * and under it the name, the address and the profile links.
 */
export default function SiteFooter({ className = '' }: { className?: string }) {
  return (
    <footer className={className}>
      <Sketch drawing={SQUIGGLE} duration={1.1} weight={1.6} className="mb-8 h-auto w-[min(100%,22rem)] opacity-80" />
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col gap-1 items-center md:items-start text-center md:text-left">
          <div className="text-lg font-bold tracking-wide text-ink">{BRAND}.</div>
          <a href={MAILTO} className="sk-link text-sm !font-medium text-pencil">
            {EMAIL}
          </a>
        </div>
        <p className="text-[13px] text-graphite font-medium">© 2026 {NAME}. All rights reserved.</p>
        <div className="flex gap-5">
          {FOOTER_LINKS.map(({ id, label, href, Icon }) => (
            <a
              key={id}
              href={href}
              {...linkProps(href)}
              className="rounded-md text-pencil transition-[color,transform] duration-300 hover:-rotate-6 hover:text-ink focus-ring"
              aria-label={label}
            >
              <Icon size={20} strokeWidth={1.8} />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
