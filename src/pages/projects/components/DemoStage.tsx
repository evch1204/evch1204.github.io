import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from 'react';
import { ExternalLink, Play, X } from 'lucide-react';
import { animate, cubicBezier, useReducedMotion, type AnimationPlaybackControlsWithThen, type AnimationSequence } from 'motion/react';
import Modal from '@/components/Modal';
import { boxOutline, seedOf } from '@/components/sketch/hand';
import { UNDERSCORE } from '@/components/sketch/marks';
import type { Project } from '@/content/projects';
import { linkProps } from '@/lib/links';
import { EASE, PEN_EASE } from '@/lib/motion';
import { youtubeEmbedUrl } from '@/lib/url';
import { FRAME_INNER } from '@/pages/projects/hero';
import { BLOT, BLOT_SHADOW } from './DemoButton';

type Point = [number, number];
/** A box on screen, in the viewport's coordinates. */
type Box = { x: number; y: number; w: number; h: number };
type Seeds = { loop: number; label: number; frame: number; close: number };
type Origin = { circle: RefObject<HTMLElement | null>; label: RefObject<HTMLElement | null> };

/** The pen's two hands: slow off the mark and soft into the end for a line, quick and settling for a flight. */
const pen = cubicBezier(...PEN_EASE);
const fly = cubicBezier(...EASE);

/** The popup's corner radius, the hero frame's. */
const RADIUS = 16;
/** The close button: a circle this wide, hung on the popup's top-right corner. */
const CLOSE = 44;
/** How many places the pen is told to be along a line, and along its flight. */
const LINE_SAMPLES = 48;
const ARC_SAMPLES = 32;
/** A step with no duration to speak of: something shown or hidden the instant the pen gets there. */
const TICK = 0.01;

/** The pen's line, as the page's frames draw it: ink, round at the ends and at the turns. */
const LINE = { fill: 'none', stroke: 'var(--color-ink)', strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

const boxOf = (el: Element | null): Box | null => {
  if (!el) return null;
  const { left, top, width, height } = el.getBoundingClientRect();
  return width > 0 && height > 0 ? { x: left, y: top, w: width, h: height } : null;
};

/** The popup: sixteen by nine, as wide as the page's content, never taller than most of the viewport, centred. */
const stageBox = (): Box => {
  const w = Math.min(1024, (0.82 * window.innerHeight * 16) / 9, window.innerWidth - 32);
  const h = (w * 9) / 16;
  return { x: (window.innerWidth - w) / 2, y: (window.innerHeight - h) / 2, w, h };
};

/** Puts an element on the stage at a box in the viewport. */
const place = (el: HTMLElement, box: Box) =>
  Object.assign(el.style, { left: `${box.x}px`, top: `${box.y}px`, width: `${box.w}px`, height: `${box.h}px` });

/**
 * The places the pen is along a line, as keyframes: at even steps of time,
 * at the distance the line has reached by then under `ease`. Played linearly
 * they keep the pen on the head of a line drawn with that ease — an ease
 * given to the keyframes themselves would be spent between every pair of them.
 * `back` walks the line from its end, as a line un-drawing does.
 */
const along = (path: SVGPathElement, ease: (t: number) => number, back = false) => {
  const cx: number[] = [];
  const cy: number[] = [];
  for (let i = 0; i < LINE_SAMPLES; i++) {
    const f = ease(i / (LINE_SAMPLES - 1));
    const [x, y] = pointOf(path, back ? 1 - f : f);
    cx.push(x);
    cy.push(y);
  }
  return { cx, cy };
};

/**
 * The pen's way from `a` to `b`: one slight arc, a quadratic bow whose
 * middle is lifted off the straight line, upwards, by a quarter of its length.
 */
const bow = (a: Point, b: Point): Point => {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const length = Math.hypot(dx, dy) || 1;
  let nx = -dy / length, ny = dx / length;
  if (ny > 0) [nx, ny] = [-nx, -ny];
  return [(a[0] + b[0]) / 2 + nx * length * 0.25, (a[1] + b[1]) / 2 + ny * length * 0.25];
};

/** The arc as a path: the flick of ink the pen leaves as it flies. */
const arcPath = (a: Point, b: Point) => {
  const c = bow(a, b);
  return `M ${a[0]} ${a[1]} Q ${c[0]} ${c[1]} ${b[0]} ${b[1]}`;
};

/** The pen's flight along the arc, eased the same way as the line it leaves. `back` flies it from `b` to `a`. */
const flight = (a: Point, b: Point, back = false) => {
  const c = bow(a, b);
  const cx: number[] = [];
  const cy: number[] = [];
  for (let i = 0; i < ARC_SAMPLES; i++) {
    const f = fly(i / (ARC_SAMPLES - 1));
    const t = back ? 1 - f : f;
    const u = 1 - t;
    cx.push(u * u * a[0] + 2 * u * t * c[0] + t * t * b[0]);
    cy.push(u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]);
  }
  return { cx, cy };
};

/**
 * The point `f` of the way along a path, on screen: carried through whatever
 * the path is placed and stretched by into the stage's SVG, whose units are
 * the viewport's pixels — where the pen is drawn.
 */
function pointOf(path: SVGPathElement, f: number): Point {
  const p = path.getPointAtLength(f * path.getTotalLength());
  const m = path.getCTM();
  const q = m ? p.matrixTransform(m) : p;
  return [q.x, q.y];
}

/**
 * Copies a blot on the page into the stand-in group `art`: the very lines
 * its Frame ruled, read off the page, placed on its box and stretched as the
 * Frame stretches them — it rules to the box's whole pixels and fills the
 * box exactly. Should the blot not have drawn yet, the same hand rules the
 * same box afresh.
 */
function copyBlot(art: SVGGElement, line: SVGPathElement, fill: SVGPathElement, host: HTMLElement, box: Box, seed: number) {
  const drawn = host.querySelector<SVGSVGElement>('.sk-frame-art svg');
  const ruled = drawn?.querySelector('path:not(.sk-frame-fill)')?.getAttribute('d');
  const inked = drawn?.querySelector('path.sk-frame-fill')?.getAttribute('d');
  const view = drawn?.viewBox.baseVal;
  const sx = ruled && view?.width ? box.w / view.width : 1;
  const sy = ruled && view?.height ? box.h / view.height : 1;
  art.setAttribute('transform', `translate(${box.x} ${box.y}) scale(${sx} ${sy})`);
  line.setAttribute('d', ruled && inked ? ruled : boxOutline(box.w, box.h, BLOT.r, seed));
  fill.setAttribute('d', ruled && inked ? inked : boxOutline(box.w, box.h, BLOT.r, seed, { closed: true }));
}

/** Every piece the choreography moves: the layout and the pen write on them directly, never through a render. */
type Els = {
  circleArt: SVGGElement;
  loop: SVGPathElement;
  loopFill: SVGPathElement;
  labelArt: SVGGElement;
  labelLoop: SVGPathElement;
  labelFill: SVGPathElement;
  stage: SVGGElement;
  frame: SVGPathElement;
  frameSecond: SVGPathElement;
  paper: SVGPathElement;
  pen: SVGCircleElement;
  trail: SVGPathElement;
  marks: HTMLDivElement;
  play: HTMLSpanElement;
  words: HTMLSpanElement;
  player: HTMLDivElement;
  caption: HTMLDivElement;
  underline: SVGPathElement;
  close: HTMLButtonElement;
  closeLoop: SVGPathElement;
  closeFill: SVGPathElement;
};
type Parts = { [K in keyof Els]: RefObject<Els[K] | null> };

/** Every piece, or nothing while any of them is still missing. */
const resolve = (parts: Parts): Els | null => {
  const els: Partial<Record<keyof Els, Element>> = {};
  for (const key of Object.keys(parts) as (keyof Els)[]) {
    const el = parts[key].current;
    if (!el) return null;
    els[key] = el;
  }
  return els as Els;
};

/**
 * Lays the stage out to the viewport and to the button as they are now:
 * rules the popup's outline to its box, puts the player, the caption and the
 * close button round it, and copies the button's two blots to where they
 * sit. False while the button is not on the page to copy.
 */
function lay(el: Els, origin: Origin, seeds: Seeds): boolean {
  const circleEl = origin.circle.current;
  const labelEl = origin.label.current;
  const circle = boxOf(circleEl);
  const label = boxOf(labelEl);
  if (!circleEl || !labelEl || !circle || !label) return false;
  const box = stageBox();

  copyBlot(el.circleArt, el.loop, el.loopFill, circleEl, circle, seeds.loop);
  copyBlot(el.labelArt, el.labelLoop, el.labelFill, labelEl, label, seeds.label);
  place(el.play, circle);
  place(el.words, label);

  el.stage.setAttribute('transform', `translate(${box.x} ${box.y})`);
  el.frame.setAttribute('d', boxOutline(box.w, box.h, RADIUS, seeds.frame));
  el.frameSecond.setAttribute('d', boxOutline(box.w, box.h, RADIUS, seeds.frame + 7, { wander: 1 }));
  el.paper.setAttribute('d', boxOutline(box.w, box.h, RADIUS, seeds.frame, { closed: true }));
  // From the loop's end to the outline's start: where the pen flies, and the flick it leaves.
  el.trail.setAttribute('d', arcPath(pointOf(el.loop, 1), pointOf(el.frame, 0)));
  place(el.player, box);
  place(el.caption, { x: box.x, y: box.y + box.h + 14, w: box.w, h: 28 });
  // Centred on the corner, half off the popup like the hero's arrows; on a phone, kept on the screen.
  place(el.close, {
    x: Math.min(box.x + box.w - CLOSE / 2, window.innerWidth - CLOSE - 4),
    y: Math.max(box.y - CLOSE / 2, 4),
    w: CLOSE,
    h: CLOSE,
  });
  return true;
}

/**
 * The opening, ~1.2s, from the button at rest. Lift: the ink drains out of
 * both blots and the words go with it, the circle's loop left on the page.
 * Unspool: the loop reels in towards its own end while the pen tip flies off
 * it, in a slight arc, to the popup's top-left corner. Draw: the pen rules
 * the popup's outline clockwise, the dot on the line's head, and paper comes
 * up inside as it closes. Develop: the pencil's second pass, the video, the
 * caption with its underline, and the close button's loop.
 */
function opening(el: Els): AnimationSequence {
  const out = flight(pointOf(el.loop, 1), pointOf(el.frame, 0));
  const rule = along(el.frame, pen);
  return [
    // Lift
    [el.loopFill, { opacity: [1, 0] }, { at: 0, duration: 0.15, ease: EASE }],
    [el.labelFill, { opacity: [1, 0] }, { at: 0, duration: 0.15, ease: EASE }],
    [el.marks, { opacity: [1, 0] }, { at: 0, duration: 0.12, ease: 'linear' }],
    [el.labelLoop, { opacity: [1, 0] }, { at: 0, duration: 0.3, ease: EASE }],
    // Unspool: the line's start runs round to its end, so it reels in rather than being cut back.
    [el.loop, { pathLength: [1, 0], pathOffset: [0, 1] }, { at: 0.15, duration: 0.27, ease: PEN_EASE }],
    [el.loop, { opacity: [1, 0] }, { at: 0.42, duration: TICK }],
    [el.pen, { opacity: [0, 1] }, { at: 0.15, duration: TICK }],
    [el.pen, out, { at: 0.15, duration: 0.27, ease: 'linear' }],
    // The flick: a light stroke the pen leaves on its way up, gone again as the outline gets going.
    [el.trail, { opacity: [0, 1] }, { at: 0.15, duration: TICK }],
    [el.trail, { pathLength: [0, 1], pathOffset: [0, 0] }, { at: 0.15, duration: 0.27, ease: EASE }],
    [el.trail, { opacity: 0 }, { at: 0.45, duration: 0.3, ease: EASE }],
    // Draw. Shown only once it starts: a line of no length with round caps is still a dot.
    [el.frame, { opacity: [0, 1] }, { at: 0.42, duration: TICK }],
    [el.frame, { pathLength: [0, 1] }, { at: 0.42, duration: 0.48, ease: PEN_EASE }],
    [el.pen, rule, { at: 0.42, duration: 0.48, ease: 'linear' }],
    [el.paper, { opacity: [0, 1] }, { at: 0.55, duration: 0.35, ease: EASE }],
    // Develop
    [el.frameSecond, { opacity: [0, 0.32] }, { at: 0.9, duration: 0.2, ease: EASE }],
    [el.pen, { opacity: 0 }, { at: 0.9, duration: 0.1, ease: EASE }],
    [el.player, { opacity: [0, 1] }, { at: 0.9, duration: 0.3, ease: EASE }],
    [el.caption, { opacity: [0, 1] }, { at: 0.95, duration: 0.25, ease: EASE }],
    [el.underline, { opacity: [0, 1] }, { at: 0.95, duration: TICK }],
    [el.underline, { pathLength: [0, 1] }, { at: 0.95, duration: 0.25, ease: PEN_EASE }],
    [el.closeLoop, { opacity: [0, 1] }, { at: 0.95, duration: TICK }],
    [el.closeLoop, { pathLength: [0, 1] }, { at: 0.95, duration: 0.25, ease: PEN_EASE }],
    [el.closeFill, { opacity: [0, 1] }, { at: 0.95, duration: 0.25, ease: EASE }],
    [el.close, { opacity: [0, 1] }, { at: 1.05, duration: 0.1, ease: EASE }],
  ];
}

/**
 * The closing, 750ms, the opening run back. Fade: the video, the caption and
 * the close button go, the close loop un-draws. Retrace: the pen walks the
 * outline back from where it ended, the paper going with it. Return: the pen
 * flies back down its arc. Refill: it rules the circle's loop again, and the
 * ink and the words come back into both blots — the button, as it was.
 *
 * Every value it moves it moves from wherever it is, so a close that cuts an
 * opening short runs back from there.
 */
function closing(el: Els): AnimationSequence {
  const retrace = along(el.frame, pen, true);
  const home = flight(pointOf(el.loop, 1), pointOf(el.frame, 0), true);
  const reloop = along(el.loop, pen);
  return [
    // Fade
    [el.player, { opacity: 0 }, { at: 0, duration: 0.15, ease: EASE }],
    [el.caption, { opacity: 0 }, { at: 0, duration: 0.15, ease: EASE }],
    [el.close, { opacity: 0 }, { at: 0, duration: 0.1, ease: EASE }],
    [el.closeLoop, { pathLength: 0 }, { at: 0, duration: 0.15, ease: PEN_EASE }],
    [el.closeFill, { opacity: 0 }, { at: 0, duration: 0.15, ease: EASE }],
    [el.frameSecond, { opacity: 0 }, { at: 0, duration: 0.15, ease: EASE }],
    // Retrace: the head walks back, the pen on it.
    [el.pen, { opacity: 1 }, { at: 0.15, duration: TICK }],
    [el.frame, { pathLength: 0 }, { at: 0.15, duration: 0.25, ease: PEN_EASE }],
    [el.pen, retrace, { at: 0.15, duration: 0.25, ease: 'linear' }],
    [el.paper, { opacity: 0 }, { at: 0.15, duration: 0.25, ease: 'linear' }],
    [el.frame, { opacity: 0 }, { at: 0.4, duration: TICK }],
    // Return: the flick drawn the other way, from the corner down to the button, and gone as the ink comes back.
    [el.pen, home, { at: 0.4, duration: 0.15, ease: 'linear' }],
    [el.trail, { opacity: 1 }, { at: 0.4, duration: TICK }],
    [el.trail, { pathLength: [0, 1], pathOffset: [1, 0] }, { at: 0.4, duration: 0.15, ease: EASE }],
    [el.trail, { opacity: 0 }, { at: 0.55, duration: 0.2, ease: EASE }],
    // Refill: the loop drawn again from its start, the pen riding it and lifting off at its end.
    [el.loop, { opacity: 1 }, { at: 0.55, duration: TICK }],
    [el.loop, { pathLength: [0, 1], pathOffset: [0, 0] }, { at: 0.55, duration: 0.15, ease: PEN_EASE }],
    [el.pen, reloop, { at: 0.55, duration: 0.15, ease: 'linear' }],
    [el.pen, { opacity: 0 }, { at: 0.7, duration: TICK }],
    [el.loopFill, { opacity: 1 }, { at: 0.6, duration: 0.15, ease: EASE }],
    [el.labelFill, { opacity: 1 }, { at: 0.6, duration: 0.15, ease: EASE }],
    [el.labelLoop, { opacity: 1 }, { at: 0.6, duration: 0.15, ease: EASE }],
    [el.marks, { opacity: 1 }, { at: 0.65, duration: 0.1, ease: EASE }],
  ];
}

/**
 * The project's demo video, and the way it arrives: the pen draws the stage.
 * The button's ink drains, its loop unspools into the pen's tip, the tip
 * flies to the popup's corner, a flick of ink behind it, and rules the popup round, paper fills it and
 * the video comes up on the paper. Closing runs it all back into the button.
 * No box grows and nothing scales: everything that moves is a line being
 * drawn or a thing fading, the site's own vocabulary.
 *
 * The panel is the whole viewport, out of the pointer's way except where
 * something takes it; the drawing is one SVG over it in the viewport's
 * coordinates. While the stage is open the button on the page is hidden and
 * a stand-in drawn here in its place, from the button's own lines, so the
 * pen can take it apart. Nothing here goes through a render once it is up:
 * the layout and the pen write to the pieces directly. The player exists
 * only while the dialog is open, so closing it stops the sound; with reduced
 * motion the dialog simply fades, as every dialog does.
 */
export default function DemoStage({
  project,
  open,
  origin,
  onClose,
}: {
  project: Project;
  open: boolean;
  /** The button's two blots: where the stand-in is drawn, and where the pen sets off from and comes home to. */
  origin: Origin;
  onClose: () => void;
}) {
  const still = useReducedMotion() ?? false;
  const circleArt = useRef<SVGGElement>(null);
  const loop = useRef<SVGPathElement>(null);
  const loopFill = useRef<SVGPathElement>(null);
  const labelArt = useRef<SVGGElement>(null);
  const labelLoop = useRef<SVGPathElement>(null);
  const labelFill = useRef<SVGPathElement>(null);
  const stage = useRef<SVGGElement>(null);
  const frame = useRef<SVGPathElement>(null);
  const frameSecond = useRef<SVGPathElement>(null);
  const paper = useRef<SVGPathElement>(null);
  const penDot = useRef<SVGCircleElement>(null);
  const trail = useRef<SVGPathElement>(null);
  const marks = useRef<HTMLDivElement>(null);
  const play = useRef<HTMLSpanElement>(null);
  const words = useRef<HTMLSpanElement>(null);
  const player = useRef<HTMLDivElement>(null);
  const caption = useRef<HTMLDivElement>(null);
  const underline = useRef<SVGPathElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const closeLoop = useRef<SVGPathElement>(null);
  const closeFill = useRef<SVGPathElement>(null);
  // The refs never change, so neither does this.
  const pieces = useCallback(
    () =>
      resolve({
        circleArt, loop, loopFill, labelArt, labelLoop, labelFill, stage, frame, frameSecond, paper, pen: penDot, trail,
        marks, play, words, player, caption, underline, close, closeLoop, closeFill,
      }),
    [],
  );
  const { circle: circleRef, label: labelRef } = origin;
  const id = project.id;
  const seeds = useMemo<Seeds>(
    () => ({
      loop: seedOf(`${id}-demo-loop`),
      label: seedOf(`${id}-demo-label`),
      frame: seedOf(`${id}-demo-frame`),
      close: seedOf(`${id}-demo-close`),
    }),
    [id],
  );
  const closeLine = useMemo(
    () => ({ loop: boxOutline(CLOSE, CLOSE, 999, seeds.close), fill: boxOutline(CLOSE, CLOSE, 999, seeds.close, { closed: true }) }),
    [seeds],
  );
  const playing = useRef<AnimationPlaybackControlsWithThen | null>(null);
  const leaving = useRef(false);

  // Before paint, with the panel in the document at its rest look: lay the stage out and set the pen going.
  useLayoutEffect(() => {
    if (!open) return;
    leaving.current = false;
    const el = pieces();
    const laid = el ? lay(el, { circle: circleRef, label: labelRef }, seeds) : false;
    if (still || !el || !laid) return;
    playing.current = animate(opening(el));
    return () => {
      playing.current?.stop();
      playing.current = null;
    };
  }, [open, still, pieces, circleRef, labelRef, seeds]);

  // A resized window re-lays the stage where it now belongs; a pen mid-line finishes on the old one.
  useEffect(() => {
    if (!open) return;
    const onResize = () => {
      const el = pieces();
      if (el) lay(el, { circle: circleRef, label: labelRef }, seeds);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [open, pieces, circleRef, labelRef, seeds]);

  // Every way out — Escape, the backdrop, the close button — runs the pen back into the button first.
  const requestClose = () => {
    if (leaving.current) return;
    leaving.current = true;
    playing.current?.stop();
    const el = still ? null : pieces();
    if (!el || !lay(el, origin, seeds)) {
      onClose();
      return;
    }
    playing.current = animate(closing(el));
    playing.current.then(onClose);
  };

  if (!project.demoUrl) return null;
  // At rest the stage shows the button and nothing else; with reduced motion, the popup and not the button.
  const rest = still ? 0 : 1;
  const shown = still ? 1 : 0;
  return (
    <Modal
      open={open}
      onClose={requestClose}
      overlayClassName="fixed inset-0 z-[100]"
      backdropClassName="bg-ink/45 backdrop-blur-[1px]"
      backdropLabel="Close demo"
      label={`${project.cardTitle} demo`}
      panelClassName="pointer-events-none fixed inset-0 z-[102] outline-none"
      panelMotion={
        still
          ? undefined
          : {
              // The pen is the entrance; the exit is instant, under the button that reappears in its place.
              initial: { opacity: 1 },
              animate: { opacity: 1 },
              exit: { opacity: 0, transition: { duration: 0 } },
            }
      }
    >
      <svg className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
        {/* The button's stand-in: each blot's ink, under the loop it was ruled with. */}
        <g ref={circleArt}>
          <path ref={loopFill} fill="var(--color-ink)" opacity={rest} style={{ filter: BLOT_SHADOW }} />
          <path ref={loop} pathLength={1} {...LINE} strokeWidth={BLOT.weight} strokeOpacity={BLOT.tone} opacity={rest} />
        </g>
        <g ref={labelArt}>
          <path ref={labelFill} fill="var(--color-ink)" opacity={rest} style={{ filter: BLOT_SHADOW }} />
          <path ref={labelLoop} {...LINE} strokeWidth={BLOT.weight} strokeOpacity={BLOT.tone} opacity={rest} />
        </g>
        {/* The popup: paper, the pencil's second pass a little off the line, and the line. */}
        <g ref={stage}>
          <path ref={paper} fill="var(--color-page)" opacity={shown} />
          <path ref={frameSecond} transform="translate(1.5 2)" {...LINE} strokeWidth={BLOT.weight * 0.7} opacity={still ? 0.32 : 0} />
          <path ref={frame} pathLength={1} {...LINE} strokeWidth={BLOT.weight} opacity={shown} />
        </g>
        {/* The pen's tip, and the flick of ink it leaves between the button and the popup. */}
        <path ref={trail} pathLength={1} {...LINE} strokeWidth={1.2} strokeOpacity={0.8} opacity={0} />
        <circle ref={penDot} r={2.5} fill="var(--color-ink)" opacity={0} />
      </svg>

      {/* The button's play mark and words over its stand-in's ink: page-coloured, they drain with it. */}
      <div ref={marks} className="absolute inset-0" style={{ opacity: rest }} aria-hidden>
        <span ref={play} className="absolute flex items-center justify-center text-page">
          <Play size={20} fill="currentColor" className="translate-x-px" />
        </span>
        <span ref={words} className="sk-btn absolute translate-none whitespace-nowrap px-4 py-1.5 text-sm">
          Watch demo
        </span>
      </div>

      {/* Ink behind the player, so the frame reads as a screen while the video loads. */}
      <div ref={player} className={`pointer-events-auto absolute bg-ink ${FRAME_INNER}`} style={{ opacity: shown }}>
        <iframe
          src={youtubeEmbedUrl(project.demoUrl)}
          title={`${project.cardTitle} demo`}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="block h-full w-full border-0"
        />
      </div>

      {/* Under the frame, as the hero's caption is: the name in ink, the way out to YouTube on the right. */}
      <div
        ref={caption}
        className="absolute flex items-start justify-between gap-4 text-sm leading-relaxed text-page/85"
        style={{ opacity: shown }}
      >
        <span className="relative min-w-0">
          <span className="block truncate">
            <b className="font-bold text-page">{project.cardTitle}</b>
            <span className="ml-2.5">Demo</span>
          </span>
          {/* A short stroke under the name, written left to right as the caption arrives. */}
          <svg viewBox={UNDERSCORE.box.join(' ')} className="sk-art -mt-1 h-auto w-12" aria-hidden>
            <path
              ref={underline}
              d={UNDERSCORE.strokes[0].d}
              pathLength={1}
              {...LINE}
              stroke="var(--color-page)"
              strokeWidth={1.4}
              opacity={shown}
            />
          </svg>
        </span>
        <a
          href={project.demoUrl}
          {...linkProps(project.demoUrl)}
          className="pointer-events-auto inline-flex shrink-0 items-center gap-1.5 rounded-md font-semibold text-page underline decoration-page/40 decoration-[1.5px] underline-offset-4 transition-colors hover:decoration-page focus-ring"
        >
          Open on YouTube <ExternalLink size={13} />
        </a>
      </div>

      {/*
        The way out, a loop drawn on the popup's corner as the arrows hang off the hero's edges. Its
        loop and its paper are its own, over the player, which would otherwise cover a quarter of them.
      */}
      <button
        ref={close}
        type="button"
        onClick={requestClose}
        aria-label="Close demo"
        className="group pointer-events-auto absolute inline-flex items-center justify-center rounded-full text-pencil transition-colors hover:text-ink focus-ring"
        style={{ opacity: shown }}
      >
        <svg viewBox={`0 0 ${CLOSE} ${CLOSE}`} className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
          <path ref={closeFill} d={closeLine.fill} fill="var(--color-page)" opacity={shown} />
          <path
            ref={closeLoop}
            d={closeLine.loop}
            pathLength={1}
            {...LINE}
            strokeWidth={1.5}
            strokeOpacity={0.9}
            opacity={shown}
          />
        </svg>
        <X size={18} className="relative transition-transform duration-300 group-hover:rotate-90" />
      </button>
    </Modal>
  );
}
