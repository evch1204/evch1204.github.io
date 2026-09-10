import { NAV_TABS, type Tab } from './nav';

/**
 * Phone navigation. The desktop pill needs ~500px and there is nowhere near
 * that below `md`, so the same tabs sit along the bottom edge instead, where a
 * thumb can reach them. Its height is `--tabbar-h` — see src/index.css.
 */
export default function TabBar({ activeTab, onSelect }: { activeTab: Tab; onSelect: (tab: Tab) => void }) {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200/60 bg-white/80 backdrop-blur-2xl pb-[env(safe-area-inset-bottom)] md:hidden"
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
              className={`flex flex-1 flex-col items-center justify-center gap-1 transition-colors ${
                active ? 'text-zinc-900' : 'text-zinc-400'
              }`}
            >
              {/* Same filled lozenge as the desktop pill, shrunk to the icon. */}
              <span
                className={`flex h-7 items-center justify-center rounded-full px-4 transition-colors duration-300 ${
                  active ? 'bg-zinc-900 text-white' : ''
                }`}
              >
                <Icon size={20} strokeWidth={2} aria-hidden />
              </span>
              <span className="text-[10px] font-semibold tracking-wide">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
