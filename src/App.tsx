import { ReactNode, useState, useEffect, useLayoutEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import HomeScreen from './HomeScreen';
import TechIWorkWith from './TechIWorkWith';
import {
  FEATURED_PROJECT,
  PROJECT_GROUPS,
  projectsInGroup,
  hostLabel,
  repoLabel,
  type Project,
} from './projectsData';
import ProjectGlyph from './ProjectGlyph';
import ExperienceList from './ExperienceList';
import SiteFooter from './SiteFooter';
import GithubActivity from './GithubActivity';
import { EXPERIENCE, EDUCATION } from './experienceData';
import profilePhoto from '../images/your-photo.jpg';
import musclePhoto from '../images/muscle.jpg';
import resumePreview from '../images/resume-preview-page1.jpg';
import {
  Github,
  Linkedin,
  Mail,
  MapPin,
  ArrowRight,
  ExternalLink,
  Maximize2,
  Download,
  X,
  Home,
  User,
  Briefcase,
  LayoutGrid,
} from 'lucide-react';

type Tab = 'home' | 'about' | 'experience' | 'projects' | 'contact';

/**
 * The one list of tabs. The desktop pill renders the labels, the phone tab bar
 * renders the icons — both walk this array so they can never drift apart.
 */
const NAV_TABS: { id: Tab; label: string; Icon: typeof Home }[] = [
  { id: 'home', label: 'Home', Icon: Home },
  { id: 'about', label: 'About', Icon: User },
  { id: 'experience', label: 'Experience', Icon: Briefcase },
  { id: 'projects', label: 'Projects', Icon: LayoutGrid },
  { id: 'contact', label: 'Contact', Icon: Mail },
];

/**
 * Phone navigation. The desktop pill needs ~500px and there is nowhere near
 * that below `md`, so the same tabs sit along the bottom edge instead, where a
 * thumb can reach them. Its height is `--tabbar-h` — see src/index.css.
 */
function TabBar({ activeTab, onSelect }: { activeTab: Tab; onSelect: (tab: Tab) => void }) {
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
function CompanyLogo({ domain, company, size = 40 }: { domain?: string; company: string; size?: number }) {
  const [failed, setFailed] = useState(false);

  if (domain === undefined) return null;

  const initials = companyInitials(company);
  const box = (
    <div
      className="flex shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-[10px] font-bold tracking-tight text-zinc-600"
      style={{ width: size, height: size }}
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
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className="shrink-0 rounded-lg border border-zinc-100 bg-white object-contain p-1"
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

/**
 * Card panel: a screenshot when the project has a live page to show, and a
 * line-art mark when it does not (research, embedded and CLI work).
 */
const ProjectPanel = ({ project }: { project: Project }) => (
  <div className="mb-6 h-[200px] overflow-hidden rounded-2xl border border-zinc-100 bg-zinc-50 flex items-center justify-center">
    {project.screenshot ? (
      <img
        src={project.screenshot}
        alt={`Screenshot of ${project.cardTitle}`}
        loading="lazy"
        className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.02]"
      />
    ) : (
      <ProjectGlyph name={project.glyph} />
    )}
  </div>
);

/** The project's real address, in mono — the card's "go use it" affordance. */
const ProjectLink = ({ project }: { project: Project }) => {
  if (project.liveUrl) {
    return (
      <span className="flex min-w-0 max-w-full items-center gap-[7px] font-mono text-xs font-bold text-zinc-600">
        <ExternalLink size={14} className="shrink-0" />
        <span className="truncate">{hostLabel(project.liveUrl)}</span>
      </span>
    );
  }
  if (project.githubUrl) {
    return (
      <span className="flex min-w-0 max-w-full items-center gap-[7px] font-mono text-xs font-bold text-zinc-600">
        <Github size={14} className="shrink-0" />
        <span className="truncate">{repoLabel(project.githubUrl)}</span>
      </span>
    );
  }
  return null;
};

const ProjectCardButton = ({ project, onOpen }: { project: Project; onOpen: () => void }) => (
  <button
    type="button"
    onClick={onOpen}
    className="group relative flex w-full flex-col text-left p-8 rounded-[2rem] border border-zinc-100 bg-white/50 backdrop-blur-sm hover:bg-white hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all duration-500 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
  >
    <ProjectPanel project={project} />
    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2.5">{project.kind}</p>
    <h3 className="text-lg font-semibold text-zinc-900 group-hover:text-black transition-colors tracking-tight mb-3">
      {project.cardTitle}
    </h3>
    <p className="text-sm text-zinc-500 mb-5 leading-relaxed font-medium text-pretty">{project.cardDescription}</p>
    <div className="mt-auto flex flex-wrap gap-2 mb-[22px]">
      {project.cardTags.map((tag) => (
        <span
          key={tag}
          className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-zinc-100 text-zinc-500 uppercase tracking-wider"
        >
          {tag}
        </span>
      ))}
    </div>
    {/* Wraps rather than clips: a long repo path takes its own row on narrow cards. */}
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-[18px] border-t border-zinc-100">
      <span className="inline-flex shrink-0 items-center gap-2 text-sm font-bold text-zinc-900">
        View details <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
      </span>
      <span className="ml-auto min-w-0 max-w-full">
        <ProjectLink project={project} />
      </span>
    </div>
  </button>
);

const CONTACT_LINKS = [
  { label: 'changtei1204@gmail.com', href: 'mailto:changtei1204@gmail.com', Icon: Mail },
  { label: 'github.com/evch1204', href: 'https://github.com/evch1204', Icon: Github },
  { label: 'linkedin.com/in/evan-chang1', href: 'https://www.linkedin.com/in/evan-chang1/', Icon: Linkedin },
  { label: 'Santa Clara, CA', href: undefined, Icon: MapPin },
] as const;

/** Skills as they are grouped on the resume, so the two never drift apart. */
const RESUME_SKILLS = [
  {
    heading: 'Languages',
    items: ['Python', 'Java', 'C++', 'TypeScript', 'JavaScript', 'SQL'],
  },
  {
    heading: 'Frameworks & tools',
    items: ['React', 'Next.js', 'Node.js', 'TensorFlow', 'OpenCV', 'Cloudflare Workers', 'Docker', 'Git', 'REST APIs'],
  },
  {
    heading: 'Certifications',
    items: [
      'Advanced AI Essentials (Google)',
      'Developing Applications in Python (AWS)',
      'Deploying AI in Your Enterprise (IBM)',
      'Introduction to LLMs (Google)',
      'Generative AI (Google)',
    ],
  },
] as const;

/** Enlarged, scrollable resume. Same close behaviour as the project modal. */
function ResumeModal({
  open,
  onClose,
  resumeUrl,
}: {
  open: boolean;
  onClose: () => void;
  resumeUrl: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
        >
          <button
            type="button"
            className="fixed inset-0 z-[101] bg-black/50 backdrop-blur-[1px]"
            aria-label="Close resume"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Resume"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="relative z-[102] flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[1.5rem] border border-zinc-100 bg-white shadow-[0_32px_64px_rgba(0,0,0,0.18)]"
          >
            <div className="flex shrink-0 items-center gap-3 border-b border-zinc-100 px-5 py-4 sm:px-6">
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">Resume</h2>
              <div className="ml-auto flex items-center gap-2">
                <a
                  href={resumeUrl}
                  download="Tei-Chang-Resume.pdf"
                  className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-black"
                >
                  <Download size={14} /> <span className="hidden sm:inline">Download PDF</span>
                </a>
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-4 py-2 text-xs font-bold text-zinc-900 transition-colors hover:bg-zinc-50"
                >
                  <ExternalLink size={14} /> <span className="hidden sm:inline">Open PDF</span>
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            {/* The page is taller than the viewport, so this is the scroll area. */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-zinc-100 p-3 sm:p-6">
              <img
                src={resumePreview}
                alt="Tei Chang's resume"
                className="mx-auto block w-full max-w-3xl rounded-lg border border-zinc-200 bg-white shadow-sm"
              />
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/**
 * Resume preview: page one rendered to an image so it shows on every browser
 * (an embedded PDF viewer does not render reliably on mobile), alongside the
 * skills breakdown and the download / open actions.
 */
function ResumePanel({ resumeUrl, onExpand }: { resumeUrl: string; onExpand: () => void }) {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400 mb-6 flex items-center gap-3">
        <span className="w-12 h-px bg-zinc-200" />
        Resume
      </h3>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] lg:gap-14 lg:items-start">
        <button
          type="button"
          onClick={onExpand}
          aria-haspopup="dialog"
          className="group relative block w-full cursor-pointer overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.06)] transition-shadow duration-500 hover:shadow-[0_28px_60px_rgba(0,0,0,0.10)] focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
        >
          <img
            src={resumePreview}
            alt="First page of Tei Chang's resume"
            loading="lazy"
            className="block w-full transition-transform duration-700 group-hover:scale-[1.01]"
          />
          {/* Fades the page into the card instead of cutting it off mid-line. */}
          <span
            className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white to-transparent"
            aria-hidden
          />
          <span className="absolute inset-x-0 bottom-0 flex items-center justify-center pb-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-5 py-2.5 text-xs font-bold text-white shadow-lg transition-transform duration-300 group-hover:scale-105">
              <Maximize2 size={14} /> View full resume
            </span>
          </span>
        </button>

        <div className="min-w-0 space-y-7">
          {RESUME_SKILLS.map(({ heading, items }) => (
            <div key={heading}>
              <h4 className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">{heading}</h4>
              <ul className="flex flex-wrap gap-2">
                {items.map((item) => (
                  <li key={item}>
                    <span className="inline-block rounded-full bg-zinc-100 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="flex flex-col gap-3 pt-1 sm:flex-row">
            <a
              href={resumeUrl}
              download="Tei-Chang-Resume.pdf"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-zinc-900 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-black"
            >
              <Download size={18} /> Download PDF
            </a>
            <a
              href={resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-200 px-6 py-3 text-sm font-bold text-zinc-900 transition-colors hover:bg-zinc-50"
            >
              <ExternalLink size={18} /> Open in new tab
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Rule + label that separates the two runs of project cards. */
const GroupHeading = ({ label, count }: { label: string; count: number }) => (
  <div className="mt-14 mb-6 flex items-baseline gap-4">
    <h3 className="whitespace-nowrap text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">{label}</h3>
    <span className="h-px flex-1 bg-zinc-200" aria-hidden />
    <span className="text-[11px] font-bold tracking-wider text-zinc-400">
      {String(count).padStart(2, '0')}
    </span>
  </div>
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
                  className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-colors ${
                    project.liveUrl
                      ? 'border border-zinc-200 text-zinc-900 hover:bg-zinc-50'
                      : 'bg-zinc-900 text-white hover:bg-black'
                  }`}
                >
                  <Github size={18} />
                  View on GitHub
                </a>
              ) : null}
              {project.liveUrl ? (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-zinc-900 text-white font-bold text-sm hover:bg-black transition-colors"
                >
                  <ExternalLink size={18} />
                  {hostLabel(project.liveUrl)}
                </a>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const resumeUrl = `${import.meta.env.BASE_URL}resume.pdf`;
  const [resumeOpen, setResumeOpen] = useState(false);
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
      <header className="fixed top-4 md:top-8 left-0 right-0 z-50 px-4 md:px-6 flex items-center gap-3 md:gap-4">
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
          className="relative shrink-0 p-1.5 bg-white/70 backdrop-blur-2xl border border-zinc-200/50 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.04)] hidden md:flex items-center gap-1"
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
              className={`relative z-10 px-4 lg:px-6 py-2 text-sm font-semibold transition-colors duration-300 rounded-full ${
                activeTab === tab.id ? 'text-white' : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
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
          resumeUrl={resumeUrl}
        />
      </div>

      {/* Bottom padding clears the phone tab bar (and the home-button inset under it). */}
      {activeTab !== 'home' && (
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-24 md:pt-32 pb-[calc(var(--tabbar-h)+2rem+env(safe-area-inset-bottom))] md:pb-32">
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
                        I&apos;m a Computer Science graduate and I&apos;m seeking to learn and grow along with AI. I studied at{' '}
                        <span className="font-semibold text-zinc-900">Santa Clara University</span> with a Data Science
                        specialization. I&apos;m currently a{' '}
                        <span className="font-semibold text-zinc-900">Software Engineer at DeepSpace</span>, where I
                        build full-stack products end-to-end—from system design through production deployment.
                      </p>
                    </div>
                    <ul className="flex flex-wrap gap-2.5 pt-1">
                      {CONTACT_LINKS.map(({ label, href, Icon }) => (
                        <li key={label}>
                          {href ? (
                            <a
                              href={href}
                              target={href.startsWith('mailto:') ? undefined : '_blank'}
                              rel={href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                              className="group inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 font-mono text-xs font-bold text-zinc-600 transition-colors hover:border-zinc-900 hover:text-zinc-900"
                            >
                              <Icon size={14} className="shrink-0" />
                              {label}
                            </a>
                          ) : (
                            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-100 bg-zinc-50 px-4 py-2 font-mono text-xs font-bold text-zinc-500">
                              <Icon size={14} className="shrink-0" />
                              {label}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
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
                  <TechIWorkWith className="w-full" />
                </div>

                <div className="border-t border-zinc-100 pt-10">
                  <GithubActivity />
                </div>

                <div className="border-t border-zinc-100 pt-10">
                  <ResumePanel resumeUrl={resumeUrl} onExpand={() => setResumeOpen(true)} />
                </div>
              </div>
            </Section>
          )}

          {activeTab === 'experience' && (
            <div key="experience" className="space-y-20 w-full">
              <Section title="Journey">
                <div className="max-w-3xl mx-auto">
                  <ExperienceList
                    orgs={EXPERIENCE}
                    renderLogo={(org) => <CompanyLogo domain={org.logoDomain} company={org.name} size={34} />}
                  />
                </div>
              </Section>

              <Section title="Education">
                <div className="max-w-3xl mx-auto">
                  <ExperienceList
                    orgs={EDUCATION}
                    renderLogo={(org) => <CompanyLogo domain={org.logoDomain} company={org.name} size={34} />}
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

              {PROJECT_GROUPS.map((group) => {
                const items = projectsInGroup(group.id);
                if (items.length === 0) return null;
                return (
                  <div key={group.id}>
                    <GroupHeading label={group.label} count={items.length} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {items.map((project) => (
                        <ProjectCardButton
                          key={project.id}
                          project={project}
                          onOpen={() => setDetailProject(project)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
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

        <SiteFooter className="mt-24 md:mt-40 pt-12" />
      </main>
      )}

      <TabBar activeTab={activeTab} onSelect={setActiveTab} />

      <ProjectDetailModal project={detailProject} onClose={() => setDetailProject(null)} />
      <ResumeModal open={resumeOpen} onClose={() => setResumeOpen(false)} resumeUrl={resumeUrl} />
    </div>
  );
}
