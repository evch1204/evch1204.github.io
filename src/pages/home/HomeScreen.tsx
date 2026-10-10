import { useCallback, useMemo, useRef, useState } from 'react';
import { Eraser, Pencil } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'motion/react';
import Pen from '@/components/sketch/Pen';
import type { Drawing } from '@/components/sketch/drawing';
import { ARROW_LONG } from '@/components/sketch/marks';
import { NAME, ROLE } from '@/content/site';
import type { Tab } from '@/layout/nav';
import { EASE, PEN_EASE } from '@/lib/motion';
import DoodlePad from './components/DoodlePad';
import HelloIntro from './components/HelloIntro';
import HomeStory from './components/HomeStory';
import ScrollHint from './components/ScrollHint';
import SketchScene from './components/SketchScene';
import { ROLE_LINE, TOOL_CLOUD, TOOL_CODE, TOOL_NODE, TOOL_REACT, TOOL_TYPESCRIPT } from './sketch';
import { useInkDrop } from './useInkDrop';
import './styles/home-screen.css';

/** Where a link on the home sends the reader: a tab, or a project page on the projects tab. */
type Destination = { tab: Tab; project?: string };

type HomeScreenProps = {
  /** Play the hello on mount. Read once: the screen runs its own sequence from there. */
  intro: boolean;
  /** The hello has left the screen to the page: the chrome can come in. Must be stable. */
  onIntroDone: () => void;
  /** Where the links on the sheet below send the reader. */
  onNavigate: (to: Destination) => void;
};

/** The five tools under the blurb, in the order the sketch draws them. */
const TOOLS = [
  { name: 'TypeScript', drawing: TOOL_TYPESCRIPT },
  { name: 'React', drawing: TOOL_REACT },
  { name: 'Node.js', drawing: TOOL_NODE },
  { name: 'Code', drawing: TOOL_CODE },
  { name: 'Cloud', drawing: TOOL_CLOUD },
];

const BLURB = 'I build full-stack applications, solve real-world problems, and turn ideas into products.';

/**
 * The left column's clock, in seconds from the moment the page starts to be
 * written: each line is written out after the one above it, the stroke goes
 * under the role, the blurb comes up and the tools are drawn.
 */
const T = { hi: 0, name: 0.25, role: 0.8, line: 1.25, blurb: 1.4, tools: 1.65, foot: 2.5 } as const;

/** One of the tools: drawn in its turn, and drawn again, with its name, whenever the pencil passes over it. */
function Tool({ name, drawing, drawn, delay }: { name: string; drawing: Drawing; drawn: boolean; delay: number }) {
  const [beat, setBeat] = useState(0);
  return (
    <li className="home-tool" onPointerEnter={() => setBeat((b) => b + 1)}>
      <svg className="sk-art" viewBox={drawing.box.join(' ')} role="img" aria-label={name}>
        <Pen key={beat} drawing={drawing} drawn={drawn} duration={beat ? 0.55 : 0.4} delay={beat ? 0 : delay} weight={0.9} />
      </svg>
      <span className="home-tool-name" aria-hidden>
        {name}
      </span>
    </li>
  );
}

/**
 * The home, the first sheet of the sketchbook: a map of the world with the
 * flight here drawn across it, a person at a desk under it, the name beside
 * them, and on the sheet below, the story so far.
 *
 * On the first visit of a load the hello writes itself. Its ink then drains
 * out through the tail of the o and gathers into one drop, which arcs across
 * the sheet and lands as the pin at Taiwan. While it is in the air the name
 * is written out on the left, a line at a time; when it lands the map
 * spreads out from the pin, the flight runs across it to Santa Clara with
 * the plane at its head, and the desk is drawn. Coming back from another tab
 * there is no hello and no drop: the same sequence simply runs.
 *
 * Then the sheet is the reader's. Their pointer is a pencil: the drawings
 * come alive under it, and pressed to the page it draws.
 */
export default function HomeScreen({ intro, onIntroDone, onNavigate }: HomeScreenProps) {
  const reduced = useReducedMotion();
  /* Read once: `intro` names how this mount began, not what App thinks now. */
  const [withIntro] = useState(intro);
  const [ink, setInk] = useState<'hello' | 'drop' | 'done'>(withIntro ? 'hello' : 'done');
  const [doodles, setDoodles] = useState<string[]>([]);

  const heroRef = useRef<HTMLDivElement>(null);
  const helloPathRef = useRef<SVGPathElement>(null);
  const dropRef = useRef<HTMLSpanElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLElement>(null);
  const refs = useMemo(() => ({ hero: heroRef, helloPath: helloPathRef, drop: dropRef }), []);

  /** The drop has landed, or the reader skipped ahead: the page is theirs. */
  const settle = useCallback(() => {
    setInk('done');
    onIntroDone();
  }, [onIntroDone]);

  /** The word is written: the ink leaves it and the drop sets off. */
  const release = useCallback(() => {
    setInk((t) => (t === 'hello' ? 'drop' : t));
    onIntroDone();
  }, [onIntroDone]);

  useInkDrop(ink === 'drop', refs, settle);

  /** The left column starts to be written as the hello lets go of its ink; the scene waits for the drop. */
  const written = ink !== 'hello';
  const settled = ink === 'done';
  /* After the hello, the first line waits for the sheet to clear; without one, everything starts at once. */
  const base = withIntro ? 0.45 : 0.15;
  const at = (t: number) => base + t;

  /* A line written out from its left edge, the way the hello was. With reduced motion it only fades. */
  const write = (delay: number, duration: number): Variants => ({
    hidden: reduced ? { opacity: 0 } : { clipPath: 'inset(-20% 100% -20% -4%)' },
    shown: { opacity: 1, clipPath: 'inset(-20% -4% -20% -4%)', transition: { duration, ease: PEN_EASE, delay } },
  });
  const rise = (delay: number): Variants => ({
    hidden: reduced ? { opacity: 0 } : { opacity: 0, y: 10 },
    shown: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE, delay } },
  });
  const state = written ? 'shown' : 'hidden';

  const [role, company] = ROLE.split(' at ');

  return (
    <div ref={sheetRef} className={`home-screen${settled ? '' : ' is-intro'}`}>
      <div className="grain" aria-hidden />

      <AnimatePresence>
        {ink !== 'done' && (
          <HelloIntro pathRef={helloPathRef} draining={ink === 'drop'} onWritten={release} onSkip={settle} />
        )}
      </AnimatePresence>

      <div className="home-hero" ref={heroRef}>
        <div className="home-body">
          {/* Nothing here can be tabbed to before it is on the page. */}
          <div className="home-copy" inert={!settled}>
            <motion.p className="home-hi" initial="hidden" animate={state} variants={write(at(T.hi), 0.45)}>
              Hi, I'm
            </motion.p>
            <motion.h1 className="home-name" initial="hidden" animate={state} variants={write(at(T.name), 0.8)}>
              {NAME}
            </motion.h1>
            <motion.p className="home-role" initial="hidden" animate={state} variants={write(at(T.role), 0.6)}>
              {role}
              {company && <span className="sr-only"> at {company}</span>}
            </motion.p>
            <svg className="home-underline sk-art" viewBox={ROLE_LINE.box.join(' ')} preserveAspectRatio="none" aria-hidden>
              <Pen drawing={ROLE_LINE} drawn={written} duration={0.45} delay={at(T.line)} />
            </svg>
            <motion.p className="home-blurb" initial="hidden" animate={state} variants={rise(at(T.blurb))}>
              {BLURB}
            </motion.p>
            <ul className="home-tools" aria-label="Tools">
              {TOOLS.map(({ name, drawing }, i) => (
                <Tool key={name} name={name} drawing={drawing} drawn={written} delay={at(T.tools) + i * 0.12} />
              ))}
            </ul>
          </div>

          <SketchScene drawn={settled} lead={withIntro ? 0 : 0.5} />
        </div>

        <ScrollHint
          shown={written}
          delay={at(T.foot)}
          onExplore={() => moreRef.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })}
        />

        {/* The note in the sheet's bottom corner, as the sketch has it: the three things the work comes down to. */}
        <motion.p className="home-note sk-note" initial="hidden" animate={state} variants={rise(at(T.foot))} aria-hidden>
          Code
          <br />
          Build
          <br />
          Ship
          <svg className="sk-art" viewBox={ARROW_LONG.box.join(' ')}>
            <Pen drawing={ARROW_LONG} drawn={written} duration={0.4} delay={at(T.foot) + 0.5} weight={0.9} />
          </svg>
        </motion.p>

        {/* The other corner: that the pencil works, until it has been used; then the way to rub it out. */}
        {doodles.length ? (
          <button type="button" className="home-pencil-note sk-note focus-ring" onClick={() => setDoodles([])}>
            <Eraser size={18} strokeWidth={1.8} aria-hidden /> Rub it out
          </button>
        ) : (
          <motion.p className="home-pencil-note sk-note" initial="hidden" animate={settled ? 'shown' : 'hidden'} variants={rise(at(T.foot) + 0.3)}>
            Psst, the pencil works.
            <br />
            Draw on the page <Pencil size={17} strokeWidth={1.8} aria-hidden />
          </motion.p>
        )}

        {/* What the reader has drawn, and the stroke in hand. */}
        <DoodlePad sheet={heroRef} enabled={settled} strokes={doodles} onStroke={(d) => setDoodles((all) => [...all, d])} />

        {/* The hello's ink, gathered into one drop and thrown at Taiwan; placed each frame by the flight. */}
        <div className="home-drops" aria-hidden>
          <span ref={dropRef} className="home-drop" />
        </div>
      </div>

      {/* Below the fold: what `Scroll to explore` scrolls to. Out of reach until the sheet above is the reader's. */}
      <div inert={!settled}>
        <HomeStory ref={moreRef} container={sheetRef} onNavigate={onNavigate} />
      </div>
    </div>
  );
}
