import { ReactNode, useState, useEffect, useLayoutEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import HomeScreen from './HomeScreen';
import TechIWorkWith from './TechIWorkWith';
import { FEATURED_PROJECT, GRID_PROJECTS, type Project } from './projectsData';
import profilePhoto from '../images/your-photo.jpg';
import musclePhoto from '../images/muscle.jpg';
import {
  Github,
  Linkedin,
  Mail,
  MapPin,
  ArrowRight,
  X,
} from 'lucide-react';

type Tab = 'home' | 'about' | 'experience' | 'projects' | 'contact';

const NAV_TABS: { id: Tab; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'experience', label: 'Experience' },
  { id: 'projects', label: 'Projects' },
  { id: 'contact', label: 'Contact' },
];

function companyInitials(company: string) {
  const cleaned = company.replace(/[.,]/g, '').replace(/-/g, ' ').trim();
  const parts = cleaned.split(/\s+/).filter((w) => w.length > 0 && !/^(inc|llc|ltd|co)\.?$/i.test(w));
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  const w = parts[0] ?? cleaned;
  return w.slice(0, 2).toUpperCase() || '?';
}

/**
 * Loads a mark via Google’s public favicon service from the organization’s website domain.
 * LinkedIn does not provide stable, hotlinkable logo URLs to third parties.
 * Pass logoDomain="" for initials-only (no network).
 */
function CompanyLogo({ domain, company }: { domain?: string; company: string }) {
  const [failed, setFailed] = useState(false);

  if (domain === undefined) return null;

  const initials = companyInitials(company);
  const box = (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-[10px] font-bold tracking-tight text-zinc-600"
      aria-hidden
    >
      {initials}
    </div>
  );

  if (domain === '' || failed) {
    return box;
  }

  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`}
      alt=""
      width={40}
      height={40}
      className="h-10 w-10 shrink-0 rounded-lg border border-zinc-100 bg-white object-contain p-1"
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}

const Section = ({
  title,
  children,
  titleAlign = 'left',
}: {
  title: string;
  children: ReactNode;
  /** Center section label (e.g. under centered top nav). */
  titleAlign?: 'left' | 'center';
}) => (
  <motion.section
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
    className="w-full"
  >
    <div className={titleAlign === 'center' ? 'mb-7 flex justify-center' : 'mb-7'}>
      <h2
        className={`text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400 mb-2 flex items-center gap-3 ${
          titleAlign === 'center' ? 'justify-center' : ''
        }`}
      >
        {titleAlign === 'center' ? (
          <>
            <span className="hidden sm:block w-10 sm:w-12 h-[1px] bg-zinc-200 shrink-0" aria-hidden />
            {title}
            <span className="hidden sm:block w-10 sm:w-12 h-[1px] bg-zinc-200 shrink-0" aria-hidden />
          </>
        ) : (
          <>
            <span className="w-12 h-[1px] bg-zinc-200" />
            {title}
          </>
        )}
      </h2>
    </div>
    {children}
  </motion.section>
);

const ProjectCardButton = ({ project, onOpen }: { project: Project; onOpen: () => void }) => (
  <button
    type="button"
    onClick={onOpen}
    className="group relative w-full text-left p-8 rounded-[2rem] border border-zinc-100 bg-white/50 backdrop-blur-sm hover:bg-white hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all duration-500 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
  >
    <h3 className="text-lg font-semibold text-zinc-900 group-hover:text-black transition-colors tracking-tight mb-4 pr-8">
      {project.cardTitle}
    </h3>
    <p className="text-sm text-zinc-500 mb-8 leading-relaxed font-medium">{project.cardDescription}</p>
    <div className="flex flex-wrap gap-2">
      {project.cardTags.map((tag) => (
        <span
          key={tag}
          className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-zinc-100 text-zinc-500 uppercase tracking-wider"
        >
          {tag}
        </span>
      ))}
    </div>
  </button>
);

function ProjectDetailModal({ project, onClose }: { project: Project | null; onClose: () => void }) {
  useEffect(() => {
    if (!project) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [project, onClose]);

  useEffect(() => {
    if (project) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [project]);

  return (
    <AnimatePresence>
      {project ? (
        <motion.div
          key={project.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 pt-20 pb-12 sm:pt-24"
        >
          <button
            type="button"
            className="fixed inset-0 z-[101] bg-black/45 backdrop-blur-[1px]"
            aria-label="Close project details"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-modal-title"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="relative z-[102] my-auto w-full max-w-2xl rounded-[2rem] border border-zinc-100 bg-white p-8 sm:p-10 shadow-[0_32px_64px_rgba(0,0,0,0.12)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-6">
              <h2 id="project-modal-title" className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight pr-2">
                {project.modalTitle}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                aria-label="Close"
              >
                <X size={22} />
              </button>
            </div>

            <p className="text-sm text-zinc-600 leading-relaxed font-medium mb-8">{project.overview}</p>

            <div className="mb-8">
              <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-400 mb-3">Key Features</h3>
              <ul className="list-disc list-inside space-y-2 text-sm text-zinc-600 font-medium leading-relaxed">
                {project.keyFeatures.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>

            <div className="mb-10">
              <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-400 mb-3">Technologies Used</h3>
              <ul className="flex flex-wrap gap-2">
                {project.technologies.map((t) => (
                  <li key={t}>
                    <span className="inline-block text-[11px] font-bold px-3 py-1.5 rounded-full bg-zinc-100 text-zinc-600 uppercase tracking-wider">
                      {t}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-zinc-200 text-zinc-900 font-bold text-sm hover:bg-zinc-50 transition-colors"
              >
                Close
              </button>
              {project.githubUrl ? (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-zinc-900 text-white font-bold text-sm hover:bg-black transition-colors"
                >
                  <Github size={18} />
                  View on GitHub
                </a>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

const ExperienceItem = ({
  role,
  company,
  period,
  description,
  location,
  logoDomain,
}: {
  role: string;
  company: string;
  period: string;
  description: ReactNode;
  location?: string;
  /**
   * Company / school website domain for favicon (e.g. scu.edu).
   * Omit for no logo. Pass empty string for initials-only when there is no reliable domain.
   */
  logoDomain?: string;
}) => (
  <div className="relative pl-10 pb-16 last:pb-0 group">
    <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-zinc-100 group-last:bg-transparent" />
    <div className="absolute left-[-4px] top-1.5 w-2 h-2 rounded-full bg-zinc-200 ring-4 ring-white transition-all duration-300 group-hover:bg-zinc-900 group-hover:scale-125" />
    <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-3 gap-2">
      <div>
        <h3 className="text-lg font-bold text-zinc-900 tracking-tight">{role}</h3>
        <div className="mt-1 flex items-center gap-3 min-w-0">
          <CompanyLogo domain={logoDomain} company={company} />
          <p className="text-base font-bold text-zinc-900 tracking-tight leading-snug">{company}</p>
        </div>
      </div>
      <div className="flex flex-col md:items-end gap-1 shrink-0">
        <span className="text-[11px] font-bold text-zinc-400 bg-zinc-50 px-3 py-1 rounded-full border border-zinc-100 uppercase tracking-wider">
          {period}
        </span>
        {location ? (
          <p className="text-[10px] text-zinc-400 font-medium flex items-center gap-1">
            <MapPin size={10} /> {location}
          </p>
        ) : null}
      </div>
    </div>
    <div className="text-sm text-zinc-500 leading-relaxed font-medium max-w-2xl space-y-3 [&_strong]:text-zinc-800 [&_strong]:font-semibold">
      {description}
    </div>
  </div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [detailProject, setDetailProject] = useState<Project | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const tabButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [navPill, setNavPill] = useState({ left: 0, width: 0 });

  useEffect(() => {
    setDetailProject(null);
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [activeTab]);

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
    <div className="min-h-screen bg-[#FAFAFA] font-sans selection:bg-zinc-900 selection:text-white overflow-x-hidden">
      {/* Background Accents */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-zinc-100/50 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-zinc-100/50 blur-[120px]" />
      </div>

      {/* Navigation + social links (same row, all pages) */}
      <header className="fixed top-8 left-0 right-0 z-50 px-6 flex items-center gap-4">
        <div className="flex-1 min-w-0 flex items-center justify-start">
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            className="text-left text-base sm:text-lg font-bold tracking-tight text-zinc-900 hover:text-black transition-colors truncate max-w-[min(100%,14rem)]"
          >
            TEI CHANG
          </button>
        </div>
        <nav
          ref={navRef}
          className="relative shrink-0 p-1.5 bg-white/70 backdrop-blur-2xl border border-zinc-200/50 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.04)] flex items-center gap-1"
        >
          <motion.div
            className="pointer-events-none absolute inset-y-1.5 z-0 rounded-full bg-zinc-900"
            initial={false}
            animate={{ left: navPill.left, width: navPill.width }}
            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            aria-hidden
          />
          {NAV_TABS.map((tab, i) => (
            <button
              key={tab.id}
              ref={(el) => {
                tabButtonRefs.current[i] = el;
              }}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative z-10 px-6 py-2 text-sm font-semibold transition-colors duration-300 rounded-full ${
                activeTab === tab.id ? 'text-white' : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="flex-1 min-w-0 flex justify-end items-center gap-5">
          {activeTab === 'home' ? (
            <div className="flex items-center justify-end gap-5 pointer-events-none opacity-0 select-none" aria-hidden>
              <span className="block w-[22px] h-[22px]" />
              <span className="block w-[22px] h-[22px]" />
              <span className="block w-[22px] h-[22px]" />
            </div>
          ) : (
            <>
              <a
                href="https://github.com/evch1204"
                target="_blank"
                rel="noopener noreferrer"
                className="text-black hover:opacity-75 transition-all hover:scale-110 p-1"
                aria-label="GitHub"
              >
                <Github size={22} />
              </a>
              <a
                href="https://www.linkedin.com/in/evan-chang1/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-black hover:opacity-75 transition-all hover:scale-110 p-1"
                aria-label="LinkedIn"
              >
                <Linkedin size={22} />
              </a>
              <a
                href="mailto:changtei1204@gmail.com"
                className="text-black hover:opacity-75 transition-all hover:scale-110 p-1"
                aria-label="Email"
              >
                <Mail size={22} />
              </a>
            </>
          )}
        </div>
      </header>

      {/* Always mounted so home physics / block positions survive tab switches; full refresh still resets. */}
      <div
        className={`fixed inset-0 z-0 overflow-hidden bg-[#FAFAFA] ${
          activeTab !== 'home' ? 'pointer-events-none invisible' : ''
        }`}
        aria-hidden={activeTab !== 'home'}
      >
        <HomeScreen
          isPaused={activeTab !== 'home'}
          onViewProjects={() => setActiveTab('projects')}
          resumeUrl={`${import.meta.env.BASE_URL}resume.pdf`}
        />
      </div>

      {activeTab !== 'home' && (
      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-32 pb-32">
        <AnimatePresence mode="wait">
          {activeTab === 'about' && (
            <Section title="Profile" key="about">
              <div className="flex flex-col gap-12">
                <div className="grid gap-10 sm:gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(240px,320px)] lg:gap-14 lg:items-center">
                  <div className="min-w-0 space-y-5">
                    <div>
                      <motion.h1
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-4xl font-bold tracking-tighter text-zinc-900 sm:text-5xl lg:text-6xl"
                      >
                        Tei Chang
                      </motion.h1>
                      <p className="mt-3 text-sm font-semibold uppercase tracking-[0.18em] text-zinc-400">
                        B.S. Computer Science (Data Science) · SCU &apos;25
                      </p>
                    </div>
                    <div className="text-base leading-relaxed text-zinc-600 sm:text-lg">
                      <p>
                        I&apos;m a Computer Science new graduate and I&apos;m seeking to learn and grow along with AI. I studied at{' '}
                        <span className="font-semibold text-zinc-900">Santa Clara University</span> with a Data Science
                        specialization. I&apos;m currently a{' '}
                        <span className="font-semibold text-zinc-900">Software Engineer Intern at DeepSpace</span>, where I
                        build full-stack products and ship features for{' '}
                        <span className="font-semibold text-zinc-900">DeepSpace AI</span>
                        —work where I use AI to help improve AI.
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-center lg:justify-end">
                    <div className="relative w-full max-w-[260px] sm:max-w-[300px] lg:max-w-none lg:w-full">
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
                        className="relative z-10 aspect-[3/4] w-full overflow-hidden rounded-[2rem] border-[6px] border-white bg-zinc-100 shadow-[0_24px_64px_rgba(0,0,0,0.12)] sm:rounded-[2.25rem] sm:border-8"
                      >
                        <img
                          src={profilePhoto}
                          alt="Tei Chang"
                          className="h-full w-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      </motion.div>
                      <div className="absolute -inset-3 rounded-[2.5rem] bg-zinc-900/[0.04] blur-2xl sm:-inset-4 sm:rounded-[3rem]" aria-hidden />
                    </div>
                  </div>
                </div>

                <div className="border-t border-zinc-100 pt-10">
                  <TechIWorkWith className="w-full [&_h3]:mb-5" />
                </div>
              </div>
            </Section>
          )}

          {activeTab === 'experience' && (
            <div key="experience" className="space-y-20 w-full">
              <Section title="Journey">
                <div className="max-w-3xl mx-auto">
                  <ExperienceItem
                    role="Software Engineer Intern"
                    company="DeepSpace"
                    logoDomain="deep.space"
                    period="Jan 2026 – Present"
                    location="New York, NY & Remote"
                    description="Building full-stack websites and shipping features for DeepSpace AI—tools and surfaces where AI helps improve AI."
                  />
                  <ExperienceItem
                    role="AI/Machine Learning Intern"
                    company="Paidwork, LLC."
                    logoDomain="paidwork.com"
                    period="Sept 2025 – Jan 2026"
                    location="Sacramento, CA & Remote"
                    description="Architecting AI chatbot features with multi-language support and microservices integration. Spearheading the development of an API Gateway for high-performance routing."
                  />
                  <ExperienceItem
                    role="Technical Service Student Assistant"
                    company="Santa Clara University"
                    logoDomain="scu.edu"
                    period="May 2024 - June 2025"
                    location="Santa Clara, CA"
                    description="Optimized library database systems managing 50k+ records. Leveraged SQL for data integrity and archival compliance."
                  />
                  <ExperienceItem
                    role="Technical Support Engineer (Intern)"
                    company="DuPont"
                    logoDomain="dupont.com"
                    period="June 2023 - Aug 2023"
                    location="Hsinchu, Taiwan"
                    description="Engineered a computer vision safety bot that automated compliance checks. Reduced operational inspection time by 70% using PyTorch."
                  />
                  <ExperienceItem
                    role="Client Support Intern"
                    company="GuoQing, Inc."
                    logoDomain=""
                    period="June 2022 - Sept 2022"
                    location="Taipei, Taiwan"
                    description="Automated complex data workflows using VBA, significantly increasing team throughput and data accuracy."
                  />
                </div>
              </Section>

              <Section title="Education">
                <div className="max-w-3xl mx-auto">
                  <ExperienceItem
                    role="Bachelor Degree"
                    company="Santa Clara University"
                    logoDomain="scu.edu"
                    period="Sep 2021 – June 2025"
                    location="Santa Clara, CA"
                    description={
                      <>
                        <p>B.S. Computer Science (Data Science specialization)</p>
                        <p>
                          <strong>Minor:</strong> Mathematics, Computer Engineering.
                        </p>
                        <p>
                          <strong>Relevant Coursework:</strong> Artificial Intelligence, Applied Machine Learning,
                          Algorithms, Data Structures, OOP, Data Science.
                        </p>
                        <p>
                          <strong>Activities:</strong> Alpha Phi Omega (VP), Technical Service Student Assistant, AI
                          Collaborate SCU.
                        </p>
                      </>
                    }
                  />
                  <ExperienceItem
                    role="High School Degree"
                    company="SMIC-International School"
                    logoDomain="smicschool.com"
                    period="Sep 2017 – June 2021"
                    description={
                      <>
                        <p className="text-zinc-700 font-semibold">Honors & Leadership</p>
                        <p>
                          <strong>Awards/Activities:</strong> Honor Roll, Student Athletic Council President, Student
                          Council Historian, Varsity Basketball, Varsity Volleyball.
                        </p>
                      </>
                    }
                  />
                </div>
              </Section>
            </div>
          )}

          {activeTab === 'projects' && (
            <Section title="Creations" key="projects">
              <button
                type="button"
                onClick={() => setDetailProject(FEATURED_PROJECT)}
                className="group w-full max-w-none text-left rounded-[2rem] border border-zinc-100 bg-white/80 backdrop-blur-sm px-5 py-5 sm:px-7 sm:py-6 md:px-9 md:py-6 lg:px-10 lg:py-7 shadow-[0_20px_50px_rgba(0,0,0,0.04)] transition-all duration-500 hover:bg-white hover:shadow-[0_28px_60px_rgba(0,0,0,0.07)] hover:border-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
              >
                <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_minmax(240px,38%)] gap-6 lg:gap-10 lg:items-center">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2">Featured</p>
                    <h3 className="text-2xl sm:text-3xl lg:text-3xl xl:text-4xl font-bold text-zinc-900 tracking-tight mb-2 group-hover:text-black transition-colors leading-tight">
                      {FEATURED_PROJECT.cardTitle}
                    </h3>
                    <p className="text-sm sm:text-base text-zinc-500 leading-snug font-medium mb-3 max-w-3xl">
                      {FEATURED_PROJECT.cardDescription}
                    </p>
                    {FEATURED_PROJECT.reportPreview && (
                      <div className="rounded-xl border border-zinc-100 bg-zinc-50/90 px-4 py-3 md:px-4 md:py-3.5 mb-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Report preview</p>
                        <p className="text-xs sm:text-sm text-zinc-600 leading-snug font-medium">
                          {FEATURED_PROJECT.reportPreview}
                        </p>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2 mb-2">
                      {FEATURED_PROJECT.cardTags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-bold px-3 py-1 rounded-full bg-zinc-100 text-zinc-500 uppercase tracking-wider"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <span className="inline-flex items-center gap-2 text-sm font-bold text-zinc-900 group-hover:gap-3 transition-all">
                      View project details <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                  <div className="relative flex w-full shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50 min-h-[200px] sm:min-h-[220px] lg:min-h-[240px] lg:max-h-[300px] p-2 sm:p-3">
                    <img
                      src={musclePhoto}
                      alt="Illustration for ergonomic risk and muscle-activation research"
                      className="max-h-[min(280px,42vw)] w-full object-contain object-center transition-transform duration-700 group-hover:scale-[1.02]"
                    />
                  </div>
                </div>
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                {GRID_PROJECTS.map((project) => (
                  <ProjectCardButton
                    key={project.id}
                    project={project}
                    onOpen={() => setDetailProject(project)}
                  />
                ))}
              </div>
              <div className="mt-16 flex justify-center">
                <a
                  href="https://github.com/evch1204"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white border border-zinc-200 text-zinc-900 font-bold hover:border-zinc-900 transition-all duration-300"
                >
                  Explore More on GitHub <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </Section>
          )}

          {activeTab === 'contact' && (
            <Section title="Connect" key="contact">
              <div className="max-w-2xl mx-auto text-center py-12">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="p-12 rounded-[3rem] bg-white border border-zinc-100 shadow-[0_32px_64px_rgba(0,0,0,0.03)]"
                >
                  <h3 className="text-4xl font-bold mb-6 tracking-tight text-zinc-900">Let's build something.</h3>
                  <p className="text-zinc-500 mb-12 text-lg font-medium leading-relaxed">
                    I'm currently looking for new opportunities in AI and Software Engineering. Whether you have a question or just want to say hi, my
                    inbox is always open.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a
                      href="mailto:changtei1204@gmail.com"
                      className="inline-flex items-center justify-center gap-3 px-10 py-5 rounded-full bg-zinc-900 text-white font-bold hover:bg-black hover:scale-105 transition-all duration-300 shadow-xl shadow-zinc-200"
                    >
                      <Mail size={20} /> Send an Email
                    </a>
                    <a
                      href="https://www.linkedin.com/in/evan-chang1/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-3 px-10 py-5 rounded-full border border-zinc-200 bg-white text-zinc-900 font-bold hover:bg-zinc-50 hover:scale-105 transition-all duration-300"
                    >
                      <Linkedin size={20} /> LinkedIn
                    </a>
                  </div>
                </motion.div>
              </div>
            </Section>
          )}
        </AnimatePresence>

        {/* Footer */}
        <footer className="mt-40 pt-12 border-t border-zinc-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col gap-1.5 items-center md:items-start text-center md:text-left">
            <div className="text-sm font-bold tracking-tighter text-zinc-900">TEI CHANG.</div>
            <a
              href="mailto:changtei1204@gmail.com"
              className="text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              ChangTei1204@gmail.com
            </a>
          </div>
          <p className="text-[11px] text-zinc-400 tracking-wide font-medium">
            © 2026 Tei Chang. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="https://github.com/evch1204" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-black transition-colors">
              <Github size={18} />
            </a>
            <a
              href="https://www.linkedin.com/in/evan-chang1/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-black transition-colors"
            >
              <Linkedin size={18} />
            </a>
          </div>
        </footer>
      </main>
      )}

      <ProjectDetailModal project={detailProject} onClose={() => setDetailProject(null)} />
    </div>
  );
}
