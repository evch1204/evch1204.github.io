import { useState, useEffect, type ComponentType } from 'react';
import { AnimatePresence } from 'motion/react';
import SiteFooter from '@/components/SiteFooter';
import Header from '@/layout/Header';
import TabBar from '@/layout/TabBar';
import type { Tab } from '@/layout/nav';
import HomeScreen from './pages/home/HomeScreen';
import AboutPage from './pages/about/AboutPage';
import ExperiencePage from './pages/experience/ExperiencePage';
import ProjectsPage from './pages/projects/ProjectsPage';
import ContactPage from './pages/contact/ContactPage';

/** Home is the deliberate exception: it stays mounted, so it is not in here. */
const TAB_PAGES: Record<Exclude<Tab, 'home'>, ComponentType> = {
  about: AboutPage,
  experience: ExperiencePage,
  projects: ProjectsPage,
  contact: ContactPage,
};

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const isHome = activeTab === 'home';
  const Page = isHome ? null : TAB_PAGES[activeTab];

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans selection:bg-zinc-900 selection:text-white overflow-x-hidden">
      {/* Background Accents */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-zinc-100/50 blur-[60px] md:blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-zinc-100/50 blur-[60px] md:blur-[120px]" />
      </div>

      <Header activeTab={activeTab} onSelect={setActiveTab} />

      {/* Always mounted so home physics / block positions survive tab switches; full refresh still resets. */}
      <div
        className={`fixed inset-0 z-0 overflow-hidden bg-[#FAFAFA] ${
          isHome ? '' : 'pointer-events-none invisible'
        }`}
        aria-hidden={!isHome}
      >
        <HomeScreen isPaused={!isHome} onViewProjects={() => setActiveTab('projects')} />
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

      <TabBar activeTab={activeTab} onSelect={setActiveTab} />
    </div>
  );
}
