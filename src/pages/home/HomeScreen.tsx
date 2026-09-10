import { useEffect, useState, type KeyboardEvent } from 'react';
import {
  Clock,
  CodeXml,
  Download,
  GraduationCap,
  Hand,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  User,
  Zap,
} from 'lucide-react';
import SiteFooter from '@/components/SiteFooter';
import {
  EMAIL,
  GITHUB_URL,
  LINKEDIN_URL,
  LOCATION,
  MAILTO,
  PHONE,
  RESUME_FILENAME,
  RESUME_URL,
  SOCIAL_LINKS,
  TIMEZONE,
} from '@/content/site';
import { readLocalClock } from '@/lib/clock';
import { triggerDownload } from '@/lib/download';
import { usePhysicsPlayground, type CtaKind } from './usePhysicsPlayground';
import './home-screen.css';

type HomeScreenProps = {
  onViewProjects?: () => void;
  /** When true (user navigated away), physics rAF pauses but block positions stay in memory. */
  isPaused?: boolean;
};

/**
 * The one screen without the `Page` suffix: it is never swapped in or out, it
 * stays mounted behind every tab so the blocks keep where they landed.
 */
export default function HomeScreen({ onViewProjects, isPaused = false }: HomeScreenProps) {
  /** Physics is opt-in: nothing is grabbable until the visitor presses the button. */
  const [armed, setArmed] = useState(false);

  /**
   * What each block does when it is tapped, in one table. The falling blocks are
   * plain DOM, so the engine only reports which kind was tapped and every
   * address the site knows stays on this side.
   */
  const CTA_ACTIONS: Record<CtaKind, () => void> = {
    projects: () => onViewProjects?.(),
    resume: () => triggerDownload(RESUME_URL, RESUME_FILENAME),
    github: () => window.open(GITHUB_URL, '_blank', 'noopener,noreferrer'),
    linkedin: () => window.open(LINKEDIN_URL, '_blank', 'noopener,noreferrer'),
    mail: () => {
      window.location.href = MAILTO;
    },
  };

  const runCta = (kind: CtaKind) => CTA_ACTIONS[kind]();

  const { busy, dropAll, reset, containerRef, hintRef, rootRef, shelfRef } = usePhysicsPlayground({
    isPaused,
    onCta: runCta,
  });

  const [clock, setClock] = useState(() => readLocalClock(TIMEZONE));

  useEffect(() => {
    if (isPaused) return;
    const id = window.setInterval(() => setClock(readLocalClock(TIMEZONE)), 30_000);
    return () => window.clearInterval(id);
  }, [isPaused]);

  /**
   * At rest the buttons and social icons are ordinary controls. Once armed they
   * become physics bodies and the clone handles the press instead, so a click on
   * the now-invisible source bails out rather than firing twice.
   */
  const clickCta = (kind: CtaKind) => () => {
    if (armed) return;
    runCta(kind);
  };

  /**
   * The keyboard never reaches a clone, so the sources stay in the tab order and
   * Enter/Space runs the real action whether the playground is armed or not.
   */
  const keyCta = (kind: CtaKind) => (e: KeyboardEvent<HTMLElement>) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    runCta(kind);
  };

  const togglePlayground = () => {
    if (busy) return;
    if (armed) {
      setArmed(false);
      void reset();
    } else {
      setArmed(true);
      void dropAll();
    }
  };

  return (
    <div className={`home-screen${armed ? ' home-armed' : ''}`} ref={rootRef}>
      <div className="grain" aria-hidden />

      <div className="home-intro">
        <div className="home-block">
          <h1 className="home-greeting">
            <span className="word-block greet" data-phys="1" data-phys-cls="greet">
              Hello,
            </span>
            <span className="word-block greet" data-phys="1" data-phys-cls="greet">
              I&apos;m
            </span>
            <span className="word-block greet" data-phys="1" data-phys-cls="greet">
              Tei
            </span>
            <span className="word-block greet" data-phys="1" data-phys-cls="greet">
              Chang
            </span>
            <span
              className="word-block hand-wave-block"
              data-phys="1"
              data-phys-cls="hand-wave"
              data-phys-html="1"
              aria-hidden
            >
              <Hand className="home-hand-svg" strokeWidth={2} aria-hidden />
            </span>
          </h1>

          {/* Stays put while everything else falls, so the pieces have a shelf to land on. */}
          <p className="home-lede" ref={shelfRef}>
            I work in data science, software engineering and machine learning.
          </p>

          <div className="home-facts">
            <span
              className="word-block fact fact-wide"
              data-phys="1"
              data-phys-cls="fact"
              data-phys-html="1"
            >
              <CodeXml size={16} strokeWidth={2} aria-hidden />
              <span className="fact-v">Software Engineer at @DeepSpace</span>
              <span className="fact-m">// open to work</span>
            </span>

            <span className="word-block fact" data-phys="1" data-phys-cls="fact" data-phys-html="1">
              <MapPin size={16} strokeWidth={2} aria-hidden />
              <span className="fact-v">{LOCATION}</span>
            </span>
            <span className="word-block fact" data-phys="1" data-phys-cls="fact" data-phys-html="1">
              <Clock size={16} strokeWidth={2} aria-hidden />
              <span className="fact-v">{clock.time}</span>
              <span className="fact-m">{clock.delta}</span>
            </span>

            <span className="word-block fact" data-phys="1" data-phys-cls="fact" data-phys-html="1">
              <GraduationCap size={16} strokeWidth={2} aria-hidden />
              <span className="fact-v">B.S. Computer Science, SCU &apos;25</span>
            </span>
            <span className="word-block fact" data-phys="1" data-phys-cls="fact" data-phys-html="1">
              <User size={16} strokeWidth={2} aria-hidden />
              <span className="fact-v">he/him</span>
            </span>

            <span className="word-block fact" data-phys="1" data-phys-cls="fact" data-phys-html="1">
              <Mail size={16} strokeWidth={2} aria-hidden />
              <span className="fact-v">{EMAIL}</span>
            </span>
            <span className="word-block fact" data-phys="1" data-phys-cls="fact" data-phys-html="1">
              <Phone size={16} strokeWidth={2} aria-hidden />
              <span className="fact-v">{PHONE}</span>
            </span>
          </div>

          <div className="home-actions">
            <span
              className="word-block action action-primary"
              data-phys="1"
              data-phys-cls="action action-primary"
              data-phys-cta="projects"
              role="button"
              tabIndex={0}
              onClick={clickCta('projects')}
              onKeyDown={keyCta('projects')}
            >
              View projects
            </span>
            <span
              className="word-block action"
              data-phys="1"
              data-phys-cls="action"
              data-phys-cta="resume"
              data-phys-html="1"
              role="button"
              tabIndex={0}
              onClick={clickCta('resume')}
              onKeyDown={keyCta('resume')}
            >
              <Download size={14} strokeWidth={2} aria-hidden />
              <span>Resume</span>
            </span>
          </div>
        </div>
      </div>

      <div className="home-physics" ref={containerRef} />

      {/* Right-anchored on the header's own line: same top, side padding and row
          height, so these fallable icons sit exactly where the header's would. */}
      <div
        className="home-floating-socials fixed top-4 md:top-8 left-0 right-0 z-[45] px-4 md:px-6 md:h-[var(--header-h)] flex items-center justify-end gap-4 md:gap-5 pointer-events-none"
        aria-label="Social links"
      >
        {SOCIAL_LINKS.map(({ id, label, Icon }) => (
          <span
            key={id}
            className="word-block home-social-fall"
            data-phys="1"
            data-phys-cls="social"
            data-phys-cta={id}
            data-phys-html="1"
            role="link"
            tabIndex={0}
            aria-label={label}
            title={label}
            onClick={clickCta(id)}
            onKeyDown={keyCta(id)}
          >
            <Icon size={22} strokeWidth={2} className="home-social-icon" aria-hidden />
          </span>
        ))}
      </div>

      <div className="home-playground">
        {!armed && (
          <>
            <span className="home-playground-nudge">try pressing this button</span>
            <svg
              className="home-playground-arrow"
              width="26"
              height="16"
              viewBox="0 0 26 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M1 3c7 0 13 2.6 18.5 5" />
              <path d="M15.5 3.5 20 8l-5 1.6" />
            </svg>
          </>
        )}
        <button
          type="button"
          className="home-playground-btn"
          onClick={togglePlayground}
          disabled={busy}
          aria-pressed={armed}
        >
          {armed ? (
            <RotateCcw size={14} strokeWidth={2.4} aria-hidden />
          ) : (
            <Zap size={14} strokeWidth={2.4} aria-hidden />
          )}
          {armed ? 'Put it back' : 'Knock it down'}
        </button>
      </div>

      {/* The shared footer, pinned to the bottom instead of ending a scroll. */}
      <div className="home-footer-slot">
        <div className="mx-auto w-full max-w-6xl px-6">
          <SiteFooter className="pt-10 pb-8" />
        </div>
      </div>

      <div className="home-hint" ref={hintRef} />
    </div>
  );
}
