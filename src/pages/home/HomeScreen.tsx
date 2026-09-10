import { useEffect, useState } from 'react';
import {
  Clock,
  CodeXml,
  Download,
  Github,
  GraduationCap,
  Hand,
  Linkedin,
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
  RESUME_DOWNLOAD_FILENAME,
  RESUME_URL,
} from '@/content/site';
import { readLocalClock } from '@/lib/clock';
import { triggerDownload } from '@/lib/download';
import type { CtaKind } from './physics/types';
import { usePhysicsPlayground } from './usePhysicsPlayground';
import './home-screen.css';

export type HomeScreenProps = {
  onViewProjects?: () => void;
  /** When true (user navigated away), physics rAF pauses but block positions stay in memory. */
  isPaused?: boolean;
};

export default function HomeScreen({ onViewProjects, isPaused = false }: HomeScreenProps) {
  /** Physics is opt-in: nothing is grabbable until the visitor presses the button. */
  const [armed, setArmed] = useState(false);

  /**
   * The falling blocks are plain DOM, so the engine reports which button was
   * tapped and every address the site knows stays on this side.
   */
  const handleCta = (kind: CtaKind) => {
    if (kind === 'projects') {
      onViewProjects?.();
    } else if (kind === 'resume') {
      triggerDownload(RESUME_URL, RESUME_DOWNLOAD_FILENAME);
    } else if (kind === 'github') {
      window.open(GITHUB_URL, '_blank', 'noopener,noreferrer');
    } else if (kind === 'linkedin') {
      window.open(LINKEDIN_URL, '_blank', 'noopener,noreferrer');
    } else if (kind === 'mail') {
      window.location.href = MAILTO;
    }
  };

  const { busy, dropAll, reset, containerRef, hintRef, introRef, rootRef, shelfRef } =
    usePhysicsPlayground({ isPaused, onCta: handleCta });

  const [clock, setClock] = useState(() => readLocalClock());

  useEffect(() => {
    if (isPaused) return;
    const id = window.setInterval(() => setClock(readLocalClock()), 30_000);
    return () => window.clearInterval(id);
  }, [isPaused]);

  /**
   * At rest the buttons and social icons are ordinary controls. Once armed they
   * become physics bodies, and the clone handles the click instead — so these
   * bail out to avoid firing twice.
   */
  const openProjects = () => {
    if (armed) return;
    onViewProjects?.();
  };

  const downloadResume = () => {
    if (armed) return;
    triggerDownload(RESUME_URL, RESUME_DOWNLOAD_FILENAME);
  };

  const openExternal = (href: string) => () => {
    if (armed) return;
    if (href.startsWith('mailto:')) window.location.href = href;
    else window.open(href, '_blank', 'noopener,noreferrer');
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

      <div id="intro" ref={introRef}>
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
              data-phys-cls="cta cta-primary"
              data-phys-cta="projects"
              role="button"
              tabIndex={armed ? -1 : 0}
              onClick={openProjects}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openProjects();
                }
              }}
            >
              View projects
            </span>
            <span
              className="word-block action"
              data-phys="1"
              data-phys-cls="cta"
              data-phys-cta="resume"
              data-phys-html="1"
              role="button"
              tabIndex={armed ? -1 : 0}
              onClick={downloadResume}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  downloadResume();
                }
              }}
            >
              <Download size={14} strokeWidth={2} aria-hidden />
              <span>Resume</span>
            </span>
          </div>
        </div>
      </div>

      <div id="physics-container" ref={containerRef} />

      {/* Same row layout as the App header: left | nav (invisible width) | socials */}
      <div
        className="home-floating-socials fixed top-8 left-0 right-0 z-[45] px-6 flex items-center gap-4 pointer-events-none"
        aria-label="Social links"
      >
        <div className="flex-1 min-w-0" aria-hidden />
        <nav
          className="home-floating-nav-spacer shrink-0 p-1.5 flex items-center gap-1 rounded-full border border-transparent opacity-0 pointer-events-none select-none"
          aria-hidden
        >
          {(['Home', 'About', 'Experience', 'Projects', 'Contact'] as const).map((label) => (
            <span
              key={label}
              className="relative px-6 py-2 text-sm font-semibold rounded-full whitespace-nowrap text-transparent"
            >
              {label}
            </span>
          ))}
        </nav>
        <div className="flex-1 min-w-0 flex justify-end items-center gap-5">
          <span
            className="word-block home-social-fall"
            data-phys="1"
            data-phys-cls="social-github"
            data-phys-cta="github"
            data-phys-html="1"
            role="link"
            tabIndex={armed ? -1 : 0}
            aria-label="GitHub"
            title="GitHub"
            onClick={openExternal(GITHUB_URL)}
          >
            <Github size={22} strokeWidth={2} className="home-social-icon" aria-hidden />
          </span>
          <span
            className="word-block home-social-fall"
            data-phys="1"
            data-phys-cls="social-linkedin"
            data-phys-cta="linkedin"
            data-phys-html="1"
            role="link"
            tabIndex={armed ? -1 : 0}
            aria-label="LinkedIn"
            title="LinkedIn"
            onClick={openExternal(LINKEDIN_URL)}
          >
            <Linkedin size={22} strokeWidth={2} className="home-social-icon" aria-hidden />
          </span>
          <span
            className="word-block home-social-fall"
            data-phys="1"
            data-phys-cls="social-mail"
            data-phys-cta="mail"
            data-phys-html="1"
            role="link"
            tabIndex={armed ? -1 : 0}
            aria-label="Email"
            title="Email"
            onClick={openExternal(MAILTO)}
          >
            <Mail size={22} strokeWidth={2} className="home-social-icon" aria-hidden />
          </span>
        </div>
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

      <div id="hint" ref={hintRef} />
    </div>
  );
}
