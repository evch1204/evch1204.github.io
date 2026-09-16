import { BRAND, EMAIL, MAILTO, NAME, SOCIAL_LINKS } from '@/content/site';
import { linkProps } from '@/lib/links';

/** The profile links; the email already has its own line above them. */
const FOOTER_LINKS = SOCIAL_LINKS.filter((link) => link.id !== 'mail');

/**
 * The one footer, shared by the home screen and every other tab. The tabs pass
 * the spacing that suits a long scrolling page; home pins it to the bottom of
 * the viewport. Everything inside stays identical so the pages can't drift.
 */
export default function SiteFooter({ className = '' }: { className?: string }) {
  return (
    <footer
      className={`font-sans border-t border-zinc-100 flex flex-col md:flex-row justify-between items-center gap-6 ${className}`}
    >
      <div className="flex flex-col gap-1.5 items-center md:items-start text-center md:text-left">
        <div className="text-sm font-bold tracking-tighter text-zinc-900">{BRAND}.</div>
        <a
          href={MAILTO}
          className="text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          {EMAIL}
        </a>
      </div>
      <p className="text-[11px] text-zinc-400 tracking-wide font-medium">
        © 2026 {NAME}. All rights reserved.
      </p>
      <div className="flex gap-6">
        {FOOTER_LINKS.map(({ id, label, href, Icon }) => (
          <a
            key={id}
            href={href}
            {...linkProps(href)}
            className="text-zinc-400 hover:text-black transition-colors"
            aria-label={label}
          >
            <Icon size={18} />
          </a>
        ))}
      </div>
    </footer>
  );
}
