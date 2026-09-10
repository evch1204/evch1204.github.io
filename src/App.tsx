import { useState, useEffect } from 'react';
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

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans selection:bg-zinc-900 selection:text-white overflow-x-hidden">
      {/* Background Accents */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-zinc-100/50 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-zinc-100/50 blur-[120px]" />
      </div>

      <Header activeTab={activeTab} onSelect={setActiveTab} />

      {/* Always mounted so home physics / block positions survive tab switches; full refresh still resets. */}
      <div
        className={`fixed inset-0 z-0 overflow-hidden bg-[#FAFAFA] ${
          activeTab !== 'home' ? 'pointer-events-none invisible' : ''
        }`}
        aria-hidden={activeTab !== 'home'}
      >
        <HomeScreen isPaused={activeTab !== 'home'} onViewProjects={() => setActiveTab('projects')} />
      </div>

      {/* Bottom padding clears the phone tab bar (and the home-button inset under it). */}
      {activeTab !== 'home' && (
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-24 md:pt-32 pb-[calc(var(--tabbar-h)+2rem+env(safe-area-inset-bottom))] md:pb-32">
        <AnimatePresence mode="wait">
          {activeTab === 'about' && <AboutPage key="about" />}
          {activeTab === 'experience' && <ExperiencePage key="experience" />}
          {activeTab === 'projects' && <ProjectsPage key="projects" />}
          {activeTab === 'contact' && <ContactPage key="contact" />}
        </AnimatePresence>

        <SiteFooter className="mt-24 md:mt-40 pt-12" />
      </main>
      )}

      <TabBar activeTab={activeTab} onSelect={setActiveTab} />
    </div>
  );
}
