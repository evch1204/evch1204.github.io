import { useState } from 'react';
import { Download, Hand, RotateCcw, Zap } from 'lucide-react';
import { useLocalClock } from '@/hooks/useLocalClock';
import SiteFooter from '@/layout/SiteFooter';
import { SOCIAL_LINKS, TIMEZONE } from '@/content/site';
import HomeFacts from './components/HomeFacts';
import PhysBlock from './components/PhysBlock';
import { useHomeCtas } from './useHomeCtas';
import { usePhysicsPlayground } from './usePhysicsPlayground';
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

  const { runCta, clickCta, keyCta } = useHomeCtas({ armed, onViewProjects });

  const { busy, dropAll, reset, containerRef, hintRef, rootRef, shelfRef } = usePhysicsPlayground({
    isPaused,
    onCta: runCta,
  });

  const clock = useLocalClock(TIMEZONE, isPaused);

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
            <PhysBlock cls="greet">Hello,</PhysBlock>
            <PhysBlock cls="greet">I&apos;m</PhysBlock>
            <PhysBlock cls="greet">Tei</PhysBlock>
            <PhysBlock cls="greet">Chang</PhysBlock>
            <PhysBlock cls="hand-wave" sourceCls="hand-wave-block" rich aria-hidden>
              <Hand className="home-hand-svg" strokeWidth={2} aria-hidden />
            </PhysBlock>
          </h1>

          {/* Stays put while everything else falls, so the pieces have a shelf to land on. */}
          <p className="home-lede" ref={shelfRef}>
            I work in data science, software engineering and machine learning.
          </p>

          <HomeFacts time={clock.time} delta={clock.delta} />

          <div className="home-actions">
            <PhysBlock
              cls="action action-primary"
              cta="projects"
              role="button"
              tabIndex={0}
              onClick={clickCta('projects')}
              onKeyDown={keyCta('projects')}
            >
              View projects
            </PhysBlock>
            <PhysBlock
              cls="action"
              cta="resume"
              rich
              role="button"
              tabIndex={0}
              onClick={clickCta('resume')}
              onKeyDown={keyCta('resume')}
            >
              <Download size={14} strokeWidth={2} aria-hidden />
              <span>Resume</span>
            </PhysBlock>
          </div>
        </div>
      </div>

      <div className="home-physics" ref={containerRef} />

      {/* Right-anchored on the header's own line: same top, side padding and row
          height, so these fallable icons sit exactly where the header's would. */}
      <nav
        className="home-floating-socials fixed top-4 md:top-8 left-0 right-0 z-[45] px-4 md:px-6 md:h-[var(--header-h)] flex items-center justify-end gap-4 md:gap-5 pointer-events-none"
        aria-label="Social links"
      >
        {SOCIAL_LINKS.map(({ id, label, Icon }) => (
          <PhysBlock
            key={id}
            cls="social"
            sourceCls="home-social-fall"
            cta={id}
            rich
            role="link"
            tabIndex={0}
            aria-label={label}
            title={label}
            onClick={clickCta(id)}
            onKeyDown={keyCta(id)}
          >
            <Icon size={22} strokeWidth={2} className="home-social-icon" aria-hidden />
          </PhysBlock>
        ))}
      </nav>

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
