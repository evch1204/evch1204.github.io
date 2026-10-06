import { useCallback, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'motion/react';
import { ArrowRight, Download } from 'lucide-react';
import SiteFooter from '@/layout/SiteFooter';
import { LOCATION, NAME, RESUME_FILENAME, RESUME_URL, ROLE } from '@/content/site';
import { triggerDownload } from '@/lib/download';
import { EASE } from '@/lib/motion';
import Doodles from './components/Doodles';
import HelloIntro from './components/HelloIntro';
import type { Destination } from './doodles';
import { useInkBurst } from './useInkBurst';
import './styles/home-screen.css';

type HomeScreenProps = {
  /** Play the hello on mount. Read once: the screen runs its own sequence from there. */
  intro: boolean;
  /** The hello has left the screen to the page: the chrome can come in. Must be stable. */
  onIntroDone: () => void;
  /** Where the actions and the doodles send the reader. */
  onNavigate: (to: Destination) => void;
};

/**
 * The home. On the first visit of a load the hello writes itself, its ink
 * drains out through the tail of the o and bursts into drops, one for every
 * doodle and one more for the dot under the name. The drops fan out at once;
 * each doodle is written in the moment its drop lands, the name climbs in
 * while they are in the air, and the last drop lands as the dot. Coming back
 * from another tab there are no drops: everything simply rises, a beat
 * apart. Once drawn, the doodles stay put, ink on the page.
 */
export default function HomeScreen({ intro, onIntroDone, onNavigate }: HomeScreenProps) {
  const reduced = useReducedMotion();
  /* Read once: `intro` names how this mount began, not what App thinks now. */
  const [withIntro] = useState(intro);
  const [ink, setInk] = useState<'hello' | 'burst' | 'done'>(withIntro ? 'hello' : 'done');
  const [drawn, setDrawn] = useState<ReadonlySet<string>>(() => new Set());
  const [nameUp, setNameUp] = useState(!withIntro);
  const [whereUp, setWhereUp] = useState(!withIntro);

  const heroRef = useRef<HTMLDivElement>(null);
  const helloPathRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);
  const refs = useMemo(() => ({ hero: heroRef, helloPath: helloPathRef, dot: dotRef }), []);

  const settle = useCallback(() => {
    setInk('done');
    setNameUp(true);
    setWhereUp(true);
    onIntroDone();
  }, [onIntroDone]);

  /** The word is written: the ink leaves it and the drops set off. */
  const burst = useCallback(() => {
    setInk((t) => (t === 'hello' ? 'burst' : t));
    onIntroDone();
  }, [onIntroDone]);

  useInkBurst(ink === 'burst', refs, {
    onDrawn: (id) => setDrawn((prev) => new Set(prev).add(id)),
    onNameUp: () => setNameUp(true),
    onWhereUp: () => setWhereUp(true),
    onDone: settle,
  });

  const settled = ink === 'done';
  /* With no drops to time them, the pieces rise a beat apart on their own. */
  const d = (delay: number) => (withIntro ? 0 : delay);

  /* The entrances. With reduced motion nothing moves: the pieces only fade. */
  const rise = (delay: number): Variants => ({
    hidden: reduced ? { opacity: 0 } : { opacity: 0, y: 14, filter: 'blur(6px)' },
    shown: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.9, ease: EASE, delay } },
  });
  /* The line the last drop lands on only ever fades; it must not move under the drop. */
  const fade = (delay: number): Variants => ({
    hidden: { opacity: 0 },
    shown: { opacity: 1, transition: { duration: 0.8, ease: EASE, delay } },
  });
  /* A word that climbs out of its own mask. */
  const climb = (delay: number): Variants => ({
    hidden: reduced ? { opacity: 0 } : { y: '112%' },
    shown: { opacity: 1, y: 0, transition: { duration: 1.15, ease: EASE, delay } },
  });

  return (
    <div className="home-screen">
      <div className="grain" aria-hidden />

      <AnimatePresence>
        {ink !== 'done' && (
          <HelloIntro pathRef={helloPathRef} draining={ink === 'burst'} onWritten={burst} onSkip={settle} />
        )}
      </AnimatePresence>

      {/* Nothing here can be tapped or tabbed to before it is on screen: each piece is inert until it is. */}
      <div className="home-hero" ref={heroRef}>
        <Doodles
          drawn={settled ? 'all' : drawn}
          bursting={ink === 'burst'}
          stagger={!withIntro}
          onNavigate={onNavigate}
        />

        <div className="home-block" inert={!settled}>
          <motion.h1 className="home-name" initial="hidden" animate={nameUp ? 'shown' : 'hidden'}>
            {NAME.split(' ').map((word, i) => (
              <span className="home-word" key={word}>
                <motion.span variants={climb(d(i * 0.1))}>{word}</motion.span>
              </span>
            ))}
          </motion.h1>

          <motion.p
            className="home-where"
            initial="hidden"
            animate={whereUp ? 'shown' : 'hidden'}
            variants={fade(d(0.3))}
          >
            {ROLE}
            <span className="sr-only">, </span>
            <span ref={dotRef} className={`home-where-dot${settled ? ' landed' : ''}`} aria-hidden>
              ·
            </span>
            <span className="home-where-place">{LOCATION}</span>
          </motion.p>

          <motion.div
            className="home-actions"
            initial="hidden"
            animate={settled ? 'shown' : 'hidden'}
            variants={rise(d(0.44))}
          >
            <button
              type="button"
              className="home-action home-action-primary focus-ring"
              onClick={() => onNavigate({ tab: 'projects' })}
            >
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
        </div>
      </div>

      {/* The shared footer, pinned to the bottom instead of ending a scroll. */}
      <motion.div
        className="home-footer-slot"
        initial="hidden"
        animate={settled ? 'shown' : 'hidden'}
        variants={rise(d(0.65))}
        inert={!settled}
      >
        <div className="mx-auto w-full max-w-6xl px-6">
          <SiteFooter className="pt-10 pb-8" />
        </div>
      </motion.div>
    </div>
  );
}
