import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from 'react';
import { ExternalLink, Play, X } from 'lucide-react';
import { animate, useReducedMotion, type AnimationPlaybackControlsWithThen, type AnimationSequence } from 'motion/react';
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

/** The popup's corner radius, the hero frame's. */
const RADIUS = 16;
/** The close button: a circle this wide, hung on the popup's top-right corner. */
const CLOSE = 44;
/**
 * The pen's line while it moves: loaded with ink, the way the hello is written
 * — one heavy monoline. At rest a frame is ruled at the blots' own weight.
 */
const PEN_WIDTH = 5;
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

/** The arc from `a` to `b` as a path, or as the opening of one that carries on from `b`. */
const arc = (a: Point, b: Point) => {
  const c = bow(a, b);
  return `M${a[0]} ${a[1]}Q${c[0]} ${c[1]} ${b[0]} ${b[1]}`;
};

/** Where a path begins. */
const startOf = (d: string): Point => {
  const m = /^M(-?[\d.]+) (-?[\d.]+)/.exec(d);
  return m ? [Number(m[1]), Number(m[2])] : [0, 0];
};

/**
 * The point `f` of the way along a path, on screen: carried through whatever
 * the path is placed and stretched by into the stage's SVG, whose units are
 * the viewport's pixels.
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
  stroke: SVGPathElement;
  frame: SVGPathElement;
  frameSecond: SVGPathElement;
  paper: SVGPathElement;
  hop: SVGPathElement;
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
 * rules the popup's outline to its box, writes the pen's one stroke — from
 * the circle's loop up to the outline's start and on round it — puts the
 * player, the caption and the close button round the box, and copies the
 * button's two blots to where they sit. False while the button is not on
 * the page to copy.
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
  const outline = boxOutline(box.w, box.h, RADIUS, seeds.frame);
  el.frame.setAttribute('d', outline);
  el.frameSecond.setAttribute('d', boxOutline(box.w, box.h, RADIUS, seeds.frame + 7, { wander: 1 }));
  el.paper.setAttribute('d', boxOutline(box.w, box.h, RADIUS, seeds.frame, { closed: true }));
  // One stroke, in the box's coordinates: the loop's end, the arc up to the outline's start, the outline.
  const [ex, ey] = pointOf(el.loop, 1);
  el.stroke.setAttribute('d', `${arc([ex - box.x, ey - box.y], startOf(outline))}${outline.replace(/^M/, 'L')}`);
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
 * The opening, ~1.85s, from the button at rest, written the way the hello
 * is: one heavy line, in one movement, taking its time. Lift: the ink drains
 * out of both blots and the words go with it, and gathers into the circle's
 * loop, which thickens into the pen's line. Unspool: the loop reels in
 * towards its own end. Stroke: from there the pen writes one line — up, in a
 * slight arc, to the popup's top-left corner, and round the outline
 * clockwise — and paper comes up inside as it closes. Develop: the line
 * dries to a frame's weight, the arc fades off the page, and the pencil's
 * second pass, the video, the caption and the close button's loop arrive.
 */
function opening(el: Els): AnimationSequence {
  // Every dash value starts from a stated place, never from wherever the last closing left it.
  return [
    // Lift
    [el.loopFill, { opacity: [1, 0] }, { at: 0, duration: 0.15, ease: EASE }],
    [el.labelFill, { opacity: [1, 0] }, { at: 0, duration: 0.15, ease: EASE }],
    [el.marks, { opacity: [1, 0] }, { at: 0, duration: 0.12, ease: 'linear' }],
    [el.labelLoop, { opacity: [1, 0] }, { at: 0, duration: 0.3, ease: EASE }],
    [el.loop, { strokeWidth: [BLOT.weight, PEN_WIDTH] }, { at: 0, duration: 0.2, ease: EASE }],
    // Unspool: the line's start runs round to its end, so it reels in rather than being cut back.
    [el.loop, { pathLength: [1, 0], pathOffset: [0, 1] }, { at: 0.15, duration: 0.35, ease: PEN_EASE }],
    [el.loop, { opacity: 0 }, { at: 0.5, duration: TICK }],
    // Stroke. Shown only once it starts: a line of no length with round caps is still a dot.
    [el.stroke, { opacity: [0, 1] }, { at: 0.45, duration: TICK }],
    [el.stroke, { pathLength: [0, 1], strokeWidth: [PEN_WIDTH, PEN_WIDTH] }, { at: 0.45, duration: 1.05, ease: PEN_EASE }],
    [el.paper, { opacity: [0, 1] }, { at: 1.1, duration: 0.4, ease: EASE }],
    // Develop: the frame proper takes over under the stroke, which dries and goes.
    [el.frame, { opacity: [0, 1], pathLength: [1, 1], pathOffset: [0, 0], strokeWidth: [BLOT.weight, BLOT.weight] }, { at: 1.5, duration: 0.2, ease: EASE }],
    [el.stroke, { strokeWidth: [PEN_WIDTH, BLOT.weight] }, { at: 1.5, duration: 0.25, ease: EASE }],
    [el.stroke, { opacity: 0 }, { at: 1.55, duration: 0.3, ease: EASE }],
    [el.frameSecond, { opacity: [0, 0.32] }, { at: 1.55, duration: 0.2, ease: EASE }],
    [el.player, { opacity: [0, 1] }, { at: 1.5, duration: 0.3, ease: EASE }],
    [el.caption, { opacity: [0, 1] }, { at: 1.6, duration: 0.25, ease: EASE }],
    [el.underline, { opacity: [0, 1] }, { at: 1.6, duration: TICK }],
    [el.underline, { pathLength: [0, 1] }, { at: 1.6, duration: 0.25, ease: PEN_EASE }],
    [el.closeLoop, { opacity: [0, 1] }, { at: 1.6, duration: TICK }],
    [el.closeLoop, { pathLength: [0, 1] }, { at: 1.6, duration: 0.25, ease: PEN_EASE }],
    [el.closeFill, { opacity: [0, 1] }, { at: 1.6, duration: 0.25, ease: EASE }],
    [el.close, { opacity: [0, 1] }, { at: 1.75, duration: 0.1, ease: EASE }],
  ];
}

/**
 * The closing, ~0.95s, the short way home. Fade: the video, the caption and
 * the close button go, the close loop un-draws, and the frame loads up to the
 * pen's weight. Zip: the outline runs off both ways into its bottom-right
 * corner — the corner nearest the button — the paper going with it. Hop:
 * from that corner the pen drops to the circle's loop. Refill: it rules the
 * loop again, the line dries to the blot's weight, and the ink and the words
 * come back into both blots — the button, as it was.
 *
 * Every value it moves it moves from wherever it is, so a close that cuts an
 * opening short runs home from there.
 */
function closing(el: Els): AnimationSequence {
  return [
    // Fade
    [el.player, { opacity: 0 }, { at: 0, duration: 0.15, ease: EASE }],
    [el.caption, { opacity: 0 }, { at: 0, duration: 0.15, ease: EASE }],
    [el.close, { opacity: 0 }, { at: 0, duration: 0.1, ease: EASE }],
    [el.closeLoop, { pathLength: 0 }, { at: 0, duration: 0.15, ease: PEN_EASE }],
    [el.closeFill, { opacity: 0 }, { at: 0, duration: 0.15, ease: EASE }],
    [el.frameSecond, { opacity: 0 }, { at: 0, duration: 0.15, ease: EASE }],
    [el.stroke, { opacity: 0 }, { at: 0, duration: 0.15, ease: EASE }],
    [el.frame, { opacity: 1, strokeWidth: [BLOT.weight, PEN_WIDTH] }, { at: 0, duration: 0.15, ease: EASE }],
    // Zip: the line's start runs on clockwise and its end back, and they meet at the bottom-right corner.
    [el.frame, { pathLength: [1, 0], pathOffset: [0, 0.5] }, { at: 0.15, duration: 0.4, ease: PEN_EASE }],
    [el.paper, { opacity: 0 }, { at: 0.15, duration: 0.4, ease: 'linear' }],
    [el.frame, { opacity: 0 }, { at: 0.55, duration: TICK }],
    // Hop
    [el.hop, { opacity: 1 }, { at: 0.55, duration: TICK }],
    [el.hop, { pathLength: [0, 1], pathOffset: [0, 0] }, { at: 0.55, duration: 0.15, ease: PEN_EASE }],
    [el.hop, { opacity: 0 }, { at: 0.72, duration: 0.15, ease: EASE }],
    // Refill: the loop drawn again from its start, the line drying as the ink comes back.
    [el.loop, { opacity: 1 }, { at: 0.7, duration: TICK }],
    [el.loop, { pathLength: [0, 1], pathOffset: [0, 0] }, { at: 0.7, duration: 0.15, ease: PEN_EASE }],
    [el.loop, { strokeWidth: [PEN_WIDTH, BLOT.weight] }, { at: 0.8, duration: 0.15, ease: EASE }],
    [el.loopFill, { opacity: 1 }, { at: 0.78, duration: 0.15, ease: EASE }],
    [el.labelFill, { opacity: 1 }, { at: 0.78, duration: 0.15, ease: EASE }],
    [el.labelLoop, { opacity: 1 }, { at: 0.78, duration: 0.15, ease: EASE }],
    [el.marks, { opacity: 1 }, { at: 0.83, duration: 0.1, ease: EASE }],
  ];
}

/**
 * The project's demo video, and the way it arrives: the pen draws the stage.
 * The button's ink drains into its loop, the loop unspools into the pen's
 * line, and the pen writes one heavy stroke up to the popup's corner and
 * round it, as the hello is written; paper fills it and the video comes up
 * on the paper, and the line dries to a frame. Closing zips the outline into
 * the corner nearest the button, hops down and refills it. No box grows and
 * nothing scales: everything that moves is a line being drawn or a thing
 * fading, the site's own vocabulary.
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
  const stroke = useRef<SVGPathElement>(null);
  const frame = useRef<SVGPathElement>(null);
  const frameSecond = useRef<SVGPathElement>(null);
  const paper = useRef<SVGPathElement>(null);
  const hop = useRef<SVGPathElement>(null);
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
        circleArt, loop, loopFill, labelArt, labelLoop, labelFill, stage, stroke, frame, frameSecond, paper, hop,
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

  // Every way out — Escape, the backdrop, the close button — runs the pen home into the button first.
  const requestClose = () => {
    if (leaving.current) return;
    leaving.current = true;
    playing.current?.stop();
    const el = still ? null : pieces();
    if (!el || !lay(el, origin, seeds)) {
      onClose();
      return;
    }
    // The hop: from the outline's bottom-right corner, halfway round it, down to the loop's end.
    el.hop.setAttribute('d', arc(pointOf(el.frame, 0.5), pointOf(el.loop, 1)));
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
        {/* The popup: paper, the pencil's second pass a little off the line, the line, and over it the pen's stroke. */}
        <g ref={stage}>
          <path ref={paper} fill="var(--color-page)" opacity={shown} />
          <path ref={frameSecond} transform="translate(1.5 2)" {...LINE} strokeWidth={BLOT.weight * 0.7} opacity={still ? 0.32 : 0} />
          <path ref={frame} pathLength={1} {...LINE} strokeWidth={BLOT.weight} opacity={shown} />
          <path ref={stroke} pathLength={1} {...LINE} strokeWidth={PEN_WIDTH} opacity={0} />
        </g>
        {/* The short line the pen takes home, from the popup's corner to the button. */}
        <path ref={hop} pathLength={1} {...LINE} strokeWidth={PEN_WIDTH} opacity={0} />
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
