import { motion, useReducedMotion } from 'motion/react';
import { BRAND, SOCIAL_LINKS } from '@/content/site';
import { linkProps } from '@/lib/links';
import { EASE } from '@/lib/motion';
import NavPill from './NavPill';
import type { Tab } from './nav';

/**
 * Navigation + social links, on one row on every page, in the sketch's hand:
 * the name written, the tabs in a pencilled pill, the icons with the pen's
 * tremor. While the hello plays the row waits out of sight and out of reach,
 * then drops in as the word leaves; `initial` is off so a load that skips the
 * hello shows it at once.
 */
export default function Header({
  activeTab,
  onSelect,
  revealed,
}: {
  activeTab: Tab;
  onSelect: (tab: Tab) => void;
  revealed: boolean;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.header
      initial={false}
      animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: reduced ? 0 : -10 }}
      transition={{ duration: 0.8, ease: EASE, delay: revealed ? 0.35 : 0 }}
      inert={!revealed}
      className="fixed top-4 md:top-7 left-0 right-0 z-50 px-4 md:px-8 md:h-[var(--header-h)] flex items-center gap-3 md:gap-4"
    >
      <div className="flex-1 min-w-0 flex items-center justify-start">
        <button
          type="button"
          onClick={() => onSelect('home')}
          className="rounded-md text-left text-xl sm:text-2xl font-semibold tracking-wide text-ink truncate max-w-[min(100%,14rem)] -rotate-2 transition-transform duration-300 hover:-rotate-3 focus-ring"
        >
          {BRAND}
        </button>
      </div>
      <NavPill activeTab={activeTab} onSelect={onSelect} />
      <div className="flex-1 min-w-0 flex justify-end items-center gap-3 md:gap-4">
        {SOCIAL_LINKS.map(({ id, label, href, Icon }) => (
          <a
            key={id}
            href={href}
            {...linkProps(href)}
            className="rounded-md p-1 text-ink transition-transform duration-300 hover:-translate-y-0.5 hover:-rotate-6 focus-ring"
            aria-label={label}
          >
            <Icon size={23} strokeWidth={1.8} />
          </a>
        ))}
      </div>
    </motion.header>
  );
}
