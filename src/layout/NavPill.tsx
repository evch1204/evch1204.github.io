import { useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import Frame from '@/components/sketch/Frame';
import { NAV_TABS, type Tab } from './nav';

/**
 * The desktop tab row (phones get the TabBar instead): a pill outlined in
 * pencil, with a blot of ink behind the tab we are on. The blot is a single
 * element that slides between the buttons, so it has to measure where the
 * active button actually sits — on mount, whenever the tab changes and
 * whenever the row is resized.
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
      className="sk-frame shrink-0 p-1.5 rounded-full bg-page/85 backdrop-blur-md hidden md:flex items-center gap-1"
    >
      <Frame r={999} weight={1.6} tone={0.9} />
      <motion.div
        className="pointer-events-none absolute inset-y-1.5 z-0"
        initial={false}
        animate={{ left: navPill.left, width: navPill.width }}
        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
        aria-hidden
      >
        <Frame r={999} fill tone={1} />
      </motion.div>
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
            className={`relative z-10 px-4 lg:px-5 py-2 text-[15px] leading-[22px] font-semibold transition-colors duration-300 rounded-full focus-ring ${
              active ? 'text-page' : 'text-pencil hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
