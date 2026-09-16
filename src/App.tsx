import { useCallback, useState, useEffect, type ComponentType } from 'react';
import { AnimatePresence } from 'motion/react';
import Header from '@/layout/Header';
import SiteFooter from '@/layout/SiteFooter';
import TabBar from '@/layout/TabBar';
import { NAV_TABS, type Tab } from '@/layout/nav';
import HomeScreen from '@/pages/home/HomeScreen';
import AboutPage from '@/pages/about/AboutPage';
import ExperiencePage from '@/pages/experience/ExperiencePage';
import ProjectsPage from '@/pages/projects/ProjectsPage';
import ContactPage from '@/pages/contact/ContactPage';

/** Home is the deliberate exception: it stays mounted, so it is not in here. */
const TAB_PAGES: Record<Exclude<Tab, 'home'>, ComponentType> = {
  about: AboutPage,
  experience: ExperiencePage,
  projects: ProjectsPage,
  contact: ContactPage,
};

/** The tab named by a history entry, if it names one we still have. */
function tabInState(state: unknown): Tab | null {
  if (state && typeof state === 'object' && 'tab' in state) {
    const tab = state.tab;
    if (NAV_TABS.some((t) => t.id === tab)) return tab as Tab;
  }
  return null;
}

/**
 * The site. Every tab has a history entry, so Back walks back through the tabs
 * and out of the site only once it reaches the entry it arrived on, and a
 * reload comes back to the tab the reader was on. The project page writes its
 * own `project` into the same entries — see `useProjectRouting` — which is why
 * the tab, not the page, is what the entry is keyed on.
 */
export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>(() => tabInState(history.state) ?? 'home');
  const isHome = activeTab === 'home';
  const Page = isHome ? null : TAB_PAGES[activeTab];

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [activeTab]);

  useEffect(() => {
    // The browser would restore a scroll position the instant an entry pops — before the tab it belongs to is back.
    history.scrollRestoration = 'manual';
    // Name the entry we arrived on, keeping whatever the project page has already put there.
    history.replaceState({ ...history.state, tab: activeTab }, '');
    // Mounted for the site's life: the tab a popped entry names is the tab to show.
    const onPop = () => setActiveTab(tabInState(history.state) ?? 'home');
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
    // Mount only: `activeTab` is read for the entry we arrived on, and re-running would name the wrong one.
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /** The one way into a tab: the header, the phone tab bar and the home screen's own link all come through here. */
  const selectTab = useCallback(
    (tab: Tab) => {
      // Already here: no second entry for the tab the reader is on.
      if (tab === activeTab) return;
      history.pushState({ tab }, '');
      setActiveTab(tab);
    },
    [activeTab],
  );

  return (
    <div className="min-h-screen bg-page font-sans selection:bg-zinc-900 selection:text-white overflow-x-clip">
      {/* Background Accents */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-zinc-100/50 blur-[60px] md:blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-zinc-100/50 blur-[60px] md:blur-[120px]" />
      </div>

      <Header activeTab={activeTab} onSelect={selectTab} />

      {/* Always mounted so home physics / block positions survive tab switches; full refresh still resets. */}
      <div
        className={`fixed inset-0 z-0 overflow-hidden bg-page ${
          isHome ? '' : 'pointer-events-none invisible'
        }`}
        aria-hidden={!isHome}
      >
        <HomeScreen isPaused={!isHome} onViewProjects={() => selectTab('projects')} />
      </div>

      {/* Bottom padding clears the phone tab bar (and the home-button inset under it). */}
      {Page && (
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-24 md:pt-32 pb-[calc(var(--tabbar-h)+2rem+env(safe-area-inset-bottom))] md:pb-32">
        <AnimatePresence mode="wait">
          <Page key={activeTab} />
        </AnimatePresence>

        <SiteFooter className="mt-24 md:mt-40 pt-12" />
      </main>
      )}

      <TabBar activeTab={activeTab} onSelect={selectTab} />
    </div>
  );
}
