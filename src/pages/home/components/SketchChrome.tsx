import { motion, useReducedMotion } from 'motion/react';
import { NAV_TABS, type Tab } from '@/layout/nav';
import { EASE } from '@/lib/motion';

type SketchChromeProps = {
  /** The hello has left: the chrome can come in. */
  shown: boolean;
  onSelect: (tab: Tab) => void;
};

/** Each tab's underline, a little different, so the row looks written and not stamped. */
const UNDERLINES = ['M2 4 Q 30 1 55 3 T 98 3', 'M2 3 Q 40 5 60 2 T 98 4', 'M2 4 Q 25 2 50 4 T 98 2', 'M2 3 Q 35 1 55 3 T 98 3', 'M2 4 Q 30 2 60 4 T 98 3'];

/**
 * The top of the sheet, as the sketch has it: three window dots on a rule,
 * `hello, world` with its caret, the tabs across the middle with a stroke
 * under the one we are on, and a prompt at the right edge. On a phone the
 * tabs are the bar at the bottom of the screen, so only the ends stay.
 */
export default function SketchChrome({ shown, onSelect }: SketchChromeProps) {
  const reduced = useReducedMotion();
  const rise = (delay: number) => ({
    initial: false as const,
    animate: shown ? { opacity: 1, y: 0 } : { opacity: 0, y: reduced ? 0 : -8 },
    transition: { duration: 0.7, ease: EASE, delay: shown ? delay : 0 },
  });

  return (
    <header className="home-chrome" inert={!shown}>
      <motion.div className="home-chrome-top" {...rise(0)}>
        <svg viewBox="0 0 56 14" aria-hidden>
          <circle cx="7" cy="7" r="5" />
          <circle cx="27" cy="7" r="5" />
          <circle cx="47" cy="7" r="5" />
        </svg>
        <span className="home-chrome-rule" />
      </motion.div>
      <motion.div className="home-chrome-row" {...rise(0.08)}>
        <button type="button" className="home-wordmark focus-ring" onClick={() => onSelect('home')}>
          hello, world
          <span className="home-caret" aria-hidden />
        </button>
        <nav className="home-nav" aria-label="Primary">
          {NAV_TABS.map((tab, i) => (
            <button
              key={tab.id}
              type="button"
              className="home-nav-tab focus-ring"
              aria-current={tab.id === 'home' ? 'page' : undefined}
              onClick={() => onSelect(tab.id)}
            >
              {tab.label}
              <svg viewBox="0 0 100 6" preserveAspectRatio="none" aria-hidden>
                <path pathLength="1" d={UNDERLINES[i % UNDERLINES.length]} />
              </svg>
            </button>
          ))}
        </nav>
        <span className="home-prompt" aria-hidden>
          &gt;_
        </span>
      </motion.div>
    </header>
  );
}
