import { useCallback, useRef, useState } from 'react';
import { AnimatePresence, motion, type Variants } from 'motion/react';
import { ArrowRight, Download } from 'lucide-react';
import SiteFooter from '@/layout/SiteFooter';
import { LOCATION, NAME, RESUME_FILENAME, RESUME_URL, ROLE } from '@/content/site';
import { triggerDownload } from '@/lib/download';
import { EASE } from '@/lib/motion';
import HelloIntro from './components/HelloIntro';
import './styles/home-screen.css';

type HomeScreenProps = {
  /** Play the hello on mount. Read once: the screen runs its own sequence from there. */
  intro: boolean;
  /** The hello has left: the chrome can come in. Must be stable. */
  onIntroDone: () => void;
  onViewProjects: () => void;
};

/** A piece that fades up into place, `delay` seconds after it is told to. */
const rise = (delay: number): Variants => ({
  hidden: { opacity: 0, y: 14, filter: 'blur(6px)' },
  shown: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.9, ease: EASE, delay } },
});

/** A word that climbs out of its own mask. */
const climb = (delay: number): Variants => ({
  hidden: { y: '112%' },
  shown: { y: 0, transition: { duration: 1.15, ease: EASE, delay } },
});

/**
 * The home: the name, one line and two actions, nothing more. On the first
 * visit of a load the hello writes itself first and the pieces rise as it
 * leaves; coming back from another tab they rise straight away.
 */
export default function HomeScreen({ intro, onIntroDone, onViewProjects }: HomeScreenProps) {
  /* Read once: `intro` names how this mount began, not what App thinks now. */
  const [withIntro] = useState(intro);
  const [settled, setSettled] = useState(!withIntro);
  const helloPathRef = useRef<SVGPathElement>(null);

  const settle = useCallback(() => {
    setSettled(true);
    onIntroDone();
  }, [onIntroDone]);

  /* After the hello the pieces wait for it to start leaving; a plain visit has nothing to wait for. */
  const lead = withIntro ? 0.2 : 0;

  return (
    <div className="home-screen">
      <div className="grain" aria-hidden />

      <AnimatePresence>
        {!settled && <HelloIntro pathRef={helloPathRef} draining={false} onWritten={settle} onSkip={settle} />}
      </AnimatePresence>

      <div className="home-hero">
        <motion.div className="home-block" initial="hidden" animate={settled ? 'shown' : 'hidden'}>
          <h1 className="home-name">
            {NAME.split(' ').map((word, i) => (
              <span className="home-word" key={word}>
                <motion.span variants={climb(lead + i * 0.1)}>{word}</motion.span>
              </span>
            ))}
          </h1>

          <motion.p className="home-where" variants={rise(lead + 0.3)}>
            {ROLE}
            <span className="home-where-dot" aria-hidden>
              ·
            </span>
            {LOCATION}
          </motion.p>

          <motion.div className="home-actions" variants={rise(lead + 0.44)}>
            <button type="button" className="home-action home-action-primary focus-ring" onClick={onViewProjects}>
              View projects
              <ArrowRight size={15} strokeWidth={2.4} aria-hidden />
            </button>
            <button
              type="button"
              className="home-action focus-ring"
              onClick={() => triggerDownload(RESUME_URL, RESUME_FILENAME)}
            >
              <Download size={15} strokeWidth={2.4} aria-hidden />
              Resume
            </button>
          </motion.div>
        </motion.div>
      </div>

      {/* The shared footer, pinned to the bottom instead of ending a scroll. */}
      <motion.div
        className="home-footer-slot"
        initial="hidden"
        animate={settled ? 'shown' : 'hidden'}
        variants={rise(lead + 0.65)}
      >
        <div className="mx-auto w-full max-w-6xl px-6">
          <SiteFooter className="pt-10 pb-8" />
        </div>
      </motion.div>
    </div>
  );
}
