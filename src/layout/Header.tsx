import { motion, useReducedMotion } from 'motion/react';
import { BRAND, SOCIAL_LINKS } from '@/content/site';
import { linkProps } from '@/lib/links';
import { EASE } from '@/lib/motion';
import NavPill from './NavPill';
import type { Tab } from './nav';

/**
 * Navigation + social links, on one row on every page. While the hello plays
 * the row waits out of sight and out of reach, then drops in as the word
 * leaves; `initial` is off so a load that skips the hello shows it at once.
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
      className="fixed top-4 md:top-8 left-0 right-0 z-50 px-4 md:px-6 md:h-[var(--header-h)] flex items-center gap-3 md:gap-4"
    >
      <div className="flex-1 min-w-0 flex items-center justify-start">
        <button
          type="button"
          onClick={() => onSelect('home')}
          className="text-left text-base sm:text-lg font-bold tracking-tight text-zinc-900 hover:text-black transition-colors truncate max-w-[min(100%,14rem)]"
        >
          {BRAND}
        </button>
      </div>
      <NavPill activeTab={activeTab} onSelect={onSelect} />
      <div className="flex-1 min-w-0 flex justify-end items-center gap-4 md:gap-5">
        {SOCIAL_LINKS.map(({ id, label, href, Icon }) => (
          <a
            key={id}
            href={href}
            {...linkProps(href)}
            className="text-black hover:opacity-75 transition-all hover:scale-110 p-1"
            aria-label={label}
          >
            <Icon size={22} />
          </a>
        ))}
      </div>
    </motion.header>
  );
}
