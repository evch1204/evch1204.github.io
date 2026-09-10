import { BRAND, SOCIAL_LINKS } from '@/content/site';
import NavPill from './NavPill';
import type { Tab } from './nav';

/**
 * Navigation + social links, on one row on every page. Home hides the social
 * links behind a same-sized spacer: they are drawn by the home screen instead,
 * because they have to be able to fall.
 */
export default function Header({
  activeTab,
  onSelect,
}: {
  activeTab: Tab;
  onSelect: (tab: Tab) => void;
}) {
  return (
    <header className="fixed top-4 md:top-8 left-0 right-0 z-50 px-4 md:px-6 flex items-center gap-3 md:gap-4">
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
        {activeTab === 'home' ? (
          <div
            className="flex items-center justify-end gap-4 md:gap-5 pointer-events-none opacity-0 select-none"
            aria-hidden
          >
            <span className="block w-[22px] h-[22px]" />
            <span className="block w-[22px] h-[22px]" />
            <span className="block w-[22px] h-[22px]" />
          </div>
        ) : (
          SOCIAL_LINKS.map(({ id, label, href, Icon }) => (
            <a
              key={id}
              href={href}
              target={href.startsWith('mailto:') ? undefined : '_blank'}
              rel={href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
              className="text-black hover:opacity-75 transition-all hover:scale-110 p-1"
              aria-label={label}
            >
              <Icon size={22} />
            </a>
          ))
        )}
      </div>
    </header>
  );
}
