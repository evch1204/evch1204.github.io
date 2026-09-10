import { useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { NAV_TABS, type Tab } from './nav';

/**
 * The desktop tab row (phones get the TabBar instead). The dark pill is a single element that slides between the
 * buttons, so it has to measure where the active button actually sits — on
 * mount, whenever the tab changes and whenever the row is resized.
 */
export default function NavPill({
  activeTab,
  onSelect,
}: {
  activeTab: Tab;
  onSelect: (tab: Tab) => void;
}) {
  const navRef = useRef<HTMLElement>(null);
  const tabButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [navPill, setNavPill] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const measurePill = () => {
      const nav = navRef.current;
      if (!nav) return;
      const idx = NAV_TABS.findIndex((t) => t.id === activeTab);
      const btn = tabButtonRefs.current[idx];
      if (!btn || idx < 0) return;
      const nr = nav.getBoundingClientRect();
      const br = btn.getBoundingClientRect();
      setNavPill({ left: br.left - nr.left, width: br.width });
    };

    measurePill();
    const nav = navRef.current;
    if (!nav) return;
    const ro = new ResizeObserver(measurePill);
    ro.observe(nav);
    window.addEventListener('resize', measurePill);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measurePill);
    };
  }, [activeTab]);

  return (
    <nav
      ref={navRef}
      aria-label="Primary"
      className="relative shrink-0 p-1.5 bg-white/70 backdrop-blur-2xl border border-zinc-200/50 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.04)] hidden md:flex items-center gap-1"
    >
      <motion.div
        className="pointer-events-none absolute inset-y-1.5 z-0 rounded-full bg-zinc-900"
        initial={false}
        animate={{ left: navPill.left, width: navPill.width }}
        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
        aria-hidden
      />
      {NAV_TABS.map((tab, i) => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              tabButtonRefs.current[i] = el;
            }}
            type="button"
            onClick={() => onSelect(tab.id)}
            aria-current={active ? 'page' : undefined}
            className={`relative z-10 px-4 lg:px-6 py-2 text-sm font-semibold transition-colors duration-300 rounded-full ${
              active ? 'text-white' : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
