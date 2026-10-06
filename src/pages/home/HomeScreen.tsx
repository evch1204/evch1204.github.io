import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'motion/react';
import Pen from '@/components/sketch/Pen';
import { ARROW_LONG } from '@/components/sketch/marks';
import { NAME, ROLE } from '@/content/site';
import { useLatest } from '@/hooks/useLatest';
import type { Tab } from '@/layout/nav';
import { EASE } from '@/lib/motion';
import HelloIntro from './components/HelloIntro';
import ScrollHint from './components/ScrollHint';
import SketchScene from './components/SketchScene';
import { ROLE_LINE, TOOL_CLOUD, TOOL_CODE, TOOL_NODE, TOOL_REACT, TOOL_TYPESCRIPT } from './sketch';
import { useInkBurst } from './useInkBurst';
import './styles/home-screen.css';

/** Where a link on the home sends the reader: a tab, or a project page on the projects tab. */
type Destination = { tab: Tab; project?: string };

type HomeScreenProps = {
  /** Play the hello on mount. Read once: the screen runs its own sequence from there. */
  intro: boolean;
  /** The hello has left the screen to the page: the chrome can come in. Must be stable. */
  onIntroDone: () => void;
  /** Where the hint sends the reader. */
  onNavigate: (to: Destination) => void;
};

/** Everything a drop of ink flies to, in the order the drops leave. */
const INK = ['map', 'desk', 'icons', 'mouse'] as const;

/** The five tools under the blurb, in the order the sketch draws them. */
const TOOLS = [
  { name: 'TypeScript', drawing: TOOL_TYPESCRIPT },
  { name: 'React', drawing: TOOL_REACT },
  { name: 'Node.js', drawing: TOOL_NODE },
  { name: 'Code', drawing: TOOL_CODE },
  { name: 'Cloud', drawing: TOOL_CLOUD },
];

const BLURB = 'I build full-stack applications, solve real-world problems, and turn ideas into products.';

/** How far the wheel turns on the home before it is taken as `Scroll to explore`. */
const EXPLORE_AFTER = 160;

/**
 * The home, a sheet of paper: a map of the world with the flight home drawn
 * across it, a person at a desk under it, and the name beside them. On the
 * first visit of a load the hello writes itself, its ink drains out through
 * the tail of the o and bursts into drops, one for every drawing and one
 * more for the dot under the role. Each drawing is written in the moment its
 * drop lands, the name climbs in while they are in the air, and the last
 * drop lands as the dot. Coming back from another tab there are no drops:
 * everything is written in a beat apart. Once drawn, the ink stays where the
 * pen left it.
 */
export default function HomeScreen({ intro, onIntroDone, onNavigate }: HomeScreenProps) {
  const reduced = useReducedMotion();
  /* Read once: `intro` names how this mount began, not what App thinks now. */
  const [withIntro] = useState(intro);
  const [ink, setInk] = useState<'hello' | 'burst' | 'done'>(withIntro ? 'hello' : 'done');
  const [drawn, setDrawn] = useState<ReadonlySet<string>>(() => new Set());
  const [nameUp, setNameUp] = useState(!withIntro);
  const [whereUp, setWhereUp] = useState(!withIntro);
  const navigate = useLatest(onNavigate);

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
  const has = (id: string) => settled || drawn.has(id);
  /* With no drops to time them, the pieces rise a beat apart on their own. */
  const d = (delay: number) => (withIntro ? 0 : delay);

  /* `Scroll to explore` means it: a turn of the wheel on the desktop home opens the next tab. */
  useEffect(() => {
    if (!settled || !window.matchMedia('(width >= 48rem)').matches) return;
    let turned = 0;
    const onWheel = (e: WheelEvent) => {
      turned = Math.max(0, turned + e.deltaY);
      if (turned >= EXPLORE_AFTER) navigate.current({ tab: 'about' });
    };
    window.addEventListener('wheel', onWheel, { passive: true });
    return () => window.removeEventListener('wheel', onWheel);
  }, [settled, navigate]);

  /* The entrances. With reduced motion nothing moves: the pieces only fade. */
  const rise = (delay: number): Variants => ({
    hidden: reduced ? { opacity: 0 } : { opacity: 0, y: 12 },
    shown: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE, delay } },
  });
  /* A word that climbs out of its own mask. */
  const climb = (delay: number): Variants => ({
    hidden: reduced ? { opacity: 0 } : { y: '112%' },
    shown: { opacity: 1, y: 0, transition: { duration: 1.15, ease: EASE, delay } },
  });

  const [role, company] = ROLE.split(' at ');

  return (
    <div className="home-screen">
      <div className="grain" aria-hidden />

      <AnimatePresence>
        {ink !== 'done' && (
          <HelloIntro pathRef={helloPathRef} draining={ink === 'burst'} onWritten={burst} onSkip={settle} />
        )}
      </AnimatePresence>

      <div className="home-hero" ref={heroRef}>
        <div className="home-body">
          {/* Nothing here can be tabbed to before it is on the page. */}
          <div className="home-copy" inert={!settled}>
            <motion.p className="home-hi" initial="hidden" animate={nameUp ? 'shown' : 'hidden'} variants={rise(d(0))}>
              Hi, I'm
            </motion.p>
            <motion.h1 className="home-name" initial="hidden" animate={nameUp ? 'shown' : 'hidden'}>
              {NAME.split(' ').map((word, i) => (
                <span className="home-word" key={word}>
                  <motion.span variants={climb(d(0.1 + i * 0.1))}>{word}</motion.span>
                </span>
              ))}
            </motion.h1>
            <motion.p className="home-role" initial="hidden" animate={whereUp ? 'shown' : 'hidden'} variants={rise(d(0.3))}>
              {role}
              {company && <span className="sr-only"> at {company}</span>}
            </motion.p>
            <div className="home-underline">
              <svg className="sk-art" viewBox={ROLE_LINE.box.join(' ')} preserveAspectRatio="none" aria-hidden>
                <Pen drawing={ROLE_LINE} drawn={whereUp} duration={0.5} delay={d(0.4)} />
              </svg>
              {/* The dot is where the last drop lands; it shows only once it has. */}
              <span ref={dotRef} className={`home-dot${settled ? ' landed' : ''}`} aria-hidden />
            </div>
            <motion.p className="home-blurb" initial="hidden" animate={whereUp ? 'shown' : 'hidden'} variants={rise(d(0.45))}>
              {BLURB}
            </motion.p>
            <ul className="home-tools" data-ink="icons" data-ink-at="2" aria-label="Tools">
              {TOOLS.map(({ name, drawing }, i) => (
                <li key={name} title={name}>
                  <svg className="sk-art" viewBox={drawing.box.join(' ')} role="img" aria-label={name}>
                    <Pen drawing={drawing} drawn={has('icons')} duration={0.45} delay={d(1.5) + i * 0.12} weight={0.9} />
                  </svg>
                </li>
              ))}
            </ul>
          </div>

          <SketchScene drawn={settled ? 'all' : drawn} stagger={!withIntro} />
        </div>

        <ScrollHint drawn={has('mouse')} stagger={!withIntro} onExplore={() => onNavigate({ tab: 'about' })} />

        {/* The note in the sheet's bottom corner, as the sketch has it: the three things the work comes down to. */}
        <motion.p
          className="home-note sk-note"
          initial="hidden"
          animate={settled ? 'shown' : 'hidden'}
          variants={rise(d(1.9))}
          aria-hidden
        >
          Code
          <br />
          Build
          <br />
          Ship
          <svg className="sk-art" viewBox={ARROW_LONG.box.join(' ')}>
            <Pen drawing={ARROW_LONG} drawn={settled} duration={0.4} delay={d(1.9) + 0.5} weight={0.9} />
          </svg>
        </motion.p>

        {/* The drops: the hello's ink, one per drawing and one for the dot, each placed by the burst. */}
        <div className={`home-drops${ink === 'burst' ? ' is-bursting' : ''}`} aria-hidden>
          {INK.map((id) => (
            <span key={id} className="home-drop" data-drop={id} />
          ))}
          <span className="home-drop" data-drop="dot" />
        </div>
      </div>
    </div>
  );
}
