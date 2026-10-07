import { motion, useReducedMotion } from 'motion/react';
import { EASE } from '@/lib/motion';
import Frame from '@/components/sketch/Frame';
import { NAV_TABS, type Tab } from './nav';

/**
 * Phone navigation. The desktop pill needs ~500px and there is nowhere near
 * that below `md`, so the same tabs sit along the bottom edge instead, where a
 * thumb can reach them, under a line ruled by hand. Its height is
 * `--tabbar-h` — see src/index.css. Like the header, it waits under the
 * hello, out of reach, and rises in as the word leaves.
 */
export default function TabBar({
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
    <motion.nav
      aria-label="Primary"
      initial={false}
      animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: reduced ? 0 : 10 }}
      transition={{ duration: 0.8, ease: EASE, delay: revealed ? 0.35 : 0 }}
      inert={!revealed}
      className="sk-rule fixed inset-x-0 bottom-0 z-50 bg-page/90 backdrop-blur-md pb-[env(safe-area-inset-bottom)] md:hidden [--sk-o:0.7]"
    >
      <div className="flex h-[var(--tabbar-h)] items-stretch">
        {NAV_TABS.map(({ id, label, Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors ${
                active ? 'text-ink' : 'text-graphite'
              }`}
            >
              {/* The same blot of ink as the desktop pill, shrunk to the icon. */}
              <span className="relative isolate flex h-7 items-center justify-center px-4">
                {active ? <Frame r={999} fill tone={1} className="sk-under" /> : null}
                <Icon size={20} strokeWidth={1.9} className={active ? 'text-page' : undefined} aria-hidden />
              </span>
              <span className="text-[11px] font-semibold">{label}</span>
            </button>
          );
        })}
      </div>
    </motion.nav>
  );
}
