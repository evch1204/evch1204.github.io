import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from 'react';
import { ExternalLink, Play, X } from 'lucide-react';
import {
  animate,
  motionValue,
  useReducedMotion,
  type AnimationPlaybackControlsWithThen,
  type AnimationSequence,
  type MotionValue,
} from 'motion/react';
import Modal from '@/components/Modal';
import { boxOutline, seedOf } from '@/components/sketch/hand';
import { UNDERSCORE } from '@/components/sketch/marks';
import type { Project } from '@/content/projects';
import { linkProps } from '@/lib/links';
import { EASE, PEN_EASE } from '@/lib/motion';
import { youtubeEmbedUrl } from '@/lib/url';
import { FRAME_INNER } from '@/pages/projects/hero';
import { blobPath, bloomAt, liquid, wobbleAt } from './bloom';
import { BLOT, BLOT_SHADOW } from './DemoButton';

type Point = [number, number];
/** A box on screen, in the viewport's coordinates. */
type Box = { x: number; y: number; w: number; h: number };
type Seeds = { loop: number; label: number; close: number };
type Origin = { circle: RefObject<HTMLElement | null>; label: RefObject<HTMLElement | null> };
/**
 * What the ink is heading for, as the layout last measured it: the popup's
 * box, the drop's centre, and how far left the label's ink slides to run
 * under the circle, in the label's own units.
 */
type Geo = { target: Box; drop: Point; pinch: number };
/** The blob as last drawn: its growth, its centre's progress along the arc, its rim's wobble and the wobble's clock. */
type Ink = { g: number; c: number; amp: number; t: number };

/** The close button: a circle this wide, hung on the popup's top-right corner. */
const CLOSE = 44;
/** A step with no duration to speak of: something shown or hidden the instant the ink gets there. */
const TICK = 0.01;
/** The circle swells from 48px to a 56px drop before it spreads. */
const SWELL = 56 / 48;
/** The swollen drop's diameter, its outline's half-width either side: the blob's size at the start. */
const D0 = 56 + BLOT.weight;
/** The bloom's clock runs this long: the spread, then the rim coming to rest. */
const BLOOM_END = 0.95;
/** The blots' shadow with the ink gone out of it: the same shadow, so the one fades into the other. */
const NO_SHADOW = 'drop-shadow(0 8px 24px rgba(0,0,0,0))';

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
 * Copies a blot on the page into the stand-in group `art`: the very lines
 * its Frame ruled, read off the page, placed on its box and stretched as the
 * Frame stretches them — it rules to the box's whole pixels and fills the
 * box exactly. Should the blot not have drawn yet, the same hand rules the
 * same box afresh. Returns how far it is stretched across.
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
  return sx;
}

/** Every piece the choreography moves: the layout and the ink write on them directly, never through a render. */
type Els = {
  circleArt: SVGGElement;
  circleInk: SVGGElement;
  loop: SVGPathElement;
  loopFill: SVGPathElement;
  labelArt: SVGGElement;
  labelInk: SVGGElement;
  labelLoop: SVGPathElement;
  labelFill: SVGPathElement;
  blob: SVGPathElement;
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
 * measures where the ink starts and where it is going, puts the player, the
 * caption and the close button round the popup's box, and copies the
 * button's two blots to where they sit. False while the button is not on
 * the page to copy.
 */
function lay(el: Els, origin: Origin, seeds: Seeds, geo: Geo): boolean {
  const circleEl = origin.circle.current;
  const labelEl = origin.label.current;
  const circle = boxOf(circleEl);
  const label = boxOf(labelEl);
  if (!circleEl || !labelEl || !circle || !label) return false;
  const box = stageBox();

  copyBlot(el.circleArt, el.loop, el.loopFill, circleEl, circle, seeds.loop);
  const stretch = copyBlot(el.labelArt, el.labelLoop, el.labelFill, labelEl, label, seeds.label);
  place(el.play, circle);
  place(el.words, label);

  geo.target = box;
  geo.drop = [circle.x + circle.w / 2, circle.y + circle.h / 2];
  // Across the gap between the blots and four pixels on, so the pinched label ends under the drop's edge.
  geo.pinch = -(label.x - (circle.x + circle.w) + 4) / stretch;
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

/** Writes the blob, as it now is, into its one path. */
const draw = (el: Els, geo: Geo, ink: Ink) =>
  el.blob.setAttribute('d', blobPath(geo.target, geo.drop, D0, ink.g, ink.c, ink.amp, ink.t));

/**
 * The opening, ~1.3s, from the button at rest. Press: the words and the
 * label's loop go, the label's ink pinches and runs left under the circle,
 * the shadows lift, and the circle swells into a 56px drop. At 0.2s the drop
 * is handed to the blob, the same circle to the pixel. Bloom: the ink
 * spreads, along a slight arc, into the popup's box — liquid, a touch over,
 * the rim wobbling while it moves and settling as it fills. Nothing else
 * moves while it does. Develop: the video surfaces in the ink, the caption
 * and its underline under it, and the close button blots in on the corner.
 */
function opening(el: Els, geo: Geo, clock: MotionValue<number>): AnimationSequence {
  // Every dash value starts from a stated place, never from wherever the last closing left it.
  return [
    // Press
    [el.words, { opacity: [1, 0] }, { at: 0, duration: 0.12, ease: EASE }],
    [el.labelLoop, { opacity: [1, 0] }, { at: 0, duration: 0.08, ease: EASE }],
    [el.labelInk, { originX: [0, 0], scaleX: [1, 0.05], scaleY: [1, 0.5], x: [0, geo.pinch] }, { at: 0, duration: 0.2, ease: EASE }],
    [el.labelFill, { opacity: [1, 0] }, { at: 0.2, duration: TICK }],
    [el.labelFill, { filter: [BLOT_SHADOW, NO_SHADOW] }, { at: 0, duration: 0.2, ease: EASE }],
    [el.loopFill, { filter: [BLOT_SHADOW, NO_SHADOW] }, { at: 0, duration: 0.2, ease: EASE }],
    [el.play, { opacity: [1, 0] }, { at: 0, duration: 0.15, ease: EASE }],
    [el.circleInk, { scale: [1, SWELL] }, { at: 0, duration: 0.2, ease: EASE }],
    [el.play, { scale: [1, SWELL] }, { at: 0, duration: 0.2, ease: EASE }],
    // The handoff: the drop and the blob at its start are one circle, so swapping them shows nothing.
    [el.circleInk, { opacity: [1, 0] }, { at: 0.2, duration: TICK }],
    [el.blob, { opacity: [0, 1] }, { at: 0.2, duration: TICK }],
    // Bloom, and settle. The feather is the stroke's outer half, softening the edge while it moves.
    [clock, [0, BLOOM_END], { at: 0.2, duration: BLOOM_END, ease: 'linear' }],
    [
      el.blob,
      { strokeOpacity: [0, 0.25, 0.25, 0] },
      { at: 0.2, duration: 1, times: [0, 0.2, 0.8, 1], ease: ['easeInOut', 'linear', 'easeInOut'] },
    ],
    // Develop
    [el.player, { opacity: [0, 1] }, { at: 1, duration: 0.3, ease: EASE }],
    [el.caption, { opacity: [0, 1] }, { at: 1.05, duration: 0.25, ease: EASE }],
    [el.underline, { opacity: [0, 1] }, { at: 1.1, duration: TICK }],
    [el.underline, { pathLength: [0, 1] }, { at: 1.1, duration: 0.2, ease: PEN_EASE }],
    [el.close, { opacity: [0, 1] }, { at: 1.15, duration: 0.09, ease: EASE }],
    [el.close, { scale: [0.4, 1] }, { at: 1.15, duration: 0.15, ease: EASE }],
    [el.closeFill, { opacity: [0, 1] }, { at: 1.15, duration: TICK }],
    [el.closeLoop, { opacity: [0, 1] }, { at: 1.15, duration: TICK }],
    [el.closeLoop, { pathLength: [0, 1] }, { at: 1.15, duration: 0.15, ease: PEN_EASE }],
  ];
}

/**
 * The closing, ~0.9s, the same way back. Fade: the video, the caption and the
 * close button go, and the popup is ink again. Unbloom: the ink is drawn back
 * into the drop along the same arc, quicker than it came. Land: the drop is
 * handed back to the circle, which shrinks to the button's size; the label's
 * ink runs back out from under it, the shadows come back, and the words — the
 * button, as it was. Should the ink never have left the drop, the circle's
 * part starts at once.
 *
 * Every value it moves it moves from wherever it is, so a close that cuts an
 * opening short runs home from there. `wait` is the fade's length, 0.15s —
 * or nothing when there is no video up to fade, so the ink sets off at once.
 */
function closing(el: Els, unbloom: MotionValue<number> | null, wait: number): AnimationSequence {
  const home = unbloom ? wait + 0.4 : 0;
  const ink: AnimationSequence = unbloom
    ? [
        [unbloom, [0, 1], { at: wait, duration: 0.4, ease: 'linear' }],
        [
          el.blob,
          { strokeOpacity: [null, 0.25, 0.25, 0] },
          { at: wait, duration: 0.4, times: [0, 0.25, 0.75, 1], ease: ['easeInOut', 'linear', 'easeInOut'] },
        ],
      ]
    : [];
  return [
    // Fade
    [el.player, { opacity: 0 }, { at: 0, duration: 0.15, ease: EASE }],
    [el.caption, { opacity: 0 }, { at: 0, duration: 0.15, ease: EASE }],
    [el.underline, { opacity: 0 }, { at: 0, duration: 0.15, ease: EASE }],
    [el.close, { opacity: 0 }, { at: 0, duration: 0.1, ease: EASE }],
    [el.close, { scale: 0.6 }, { at: 0, duration: 0.15, ease: EASE }],
    [el.closeLoop, { pathLength: [1, 0] }, { at: 0, duration: 0.15, ease: PEN_EASE }],
    [el.closeFill, { opacity: 0 }, { at: 0, duration: 0.15, ease: EASE }],
    // Unbloom
    ...ink,
    // Land
    [el.blob, { opacity: 0 }, { at: home, duration: TICK }],
    [el.circleInk, { opacity: 1 }, { at: home, duration: TICK }],
    [el.circleInk, { scale: 1 }, { at: home, duration: 0.2, ease: EASE }],
    [el.play, { scale: 1 }, { at: home, duration: 0.2, ease: EASE }],
    [el.play, { opacity: 1 }, { at: home + 0.05, duration: 0.15, ease: EASE }],
    [el.labelFill, { opacity: 1 }, { at: home, duration: TICK }],
    [el.labelInk, { scaleX: 1, scaleY: 1, x: 0 }, { at: home + 0.1, duration: 0.2, ease: EASE }],
    [el.loopFill, { filter: BLOT_SHADOW }, { at: home + 0.15, duration: 0.2, ease: EASE }],
    [el.labelFill, { filter: BLOT_SHADOW }, { at: home + 0.15, duration: 0.2, ease: EASE }],
    [el.words, { opacity: 1 }, { at: home + 0.2, duration: 0.15, ease: EASE }],
    [el.labelLoop, { opacity: 1 }, { at: home + 0.27, duration: 0.08, ease: EASE }],
  ];
}

/**
 * The project's demo video, and the way it arrives: an ink bloom. The
 * button's ink gathers into its circle, which swells into a drop, and the
 * drop spreads — one blob of ink, wobbling a little as it goes, along a
 * slight arc — into the popup's box. The video surfaces in the ink. Closing
 * draws the ink back along the same arc into the drop, and the drop shrinks
 * back into the button. Nothing is drawn and nothing pops: from the button
 * to the screen it is the same ink, changing shape.
 *
 * The panel is the whole viewport, out of the pointer's way except where
 * something takes it; the ink is one SVG over it in the viewport's
 * coordinates. While the stage is open the button on the page is hidden and
 * a stand-in drawn here in its place, from the button's own lines, so the ink
 * can be taken out of it. Nothing here goes through a render once it is up:
 * the layout and the ink write to the pieces directly. The player exists
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
  /** The button's two blots: where the stand-in is drawn, and where the ink sets off from and comes home to. */
  origin: Origin;
  onClose: () => void;
}) {
  const still = useReducedMotion() ?? false;
  const circleArt = useRef<SVGGElement>(null);
  const circleInk = useRef<SVGGElement>(null);
  const loop = useRef<SVGPathElement>(null);
  const loopFill = useRef<SVGPathElement>(null);
  const labelArt = useRef<SVGGElement>(null);
  const labelInk = useRef<SVGGElement>(null);
  const labelLoop = useRef<SVGPathElement>(null);
  const labelFill = useRef<SVGPathElement>(null);
  const blob = useRef<SVGPathElement>(null);
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
        circleArt, circleInk, loop, loopFill, labelArt, labelInk, labelLoop, labelFill, blob,
        play, words, player, caption, underline, close, closeLoop, closeFill,
      }),
    [],
  );
  const { circle: circleRef, label: labelRef } = origin;
  const id = project.id;
  const seeds = useMemo<Seeds>(
    () => ({
      loop: seedOf(`${id}-demo-loop`),
      label: seedOf(`${id}-demo-label`),
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
  const geo = useRef<Geo>({ target: { x: 0, y: 0, w: 0, h: 0 }, drop: [0, 0], pinch: 0 });
  const ink = useRef<Ink>({ g: 0, c: 0, amp: 0, t: 0 });

  // Before paint, with the panel in the document at its rest look: lay the stage out and let the ink go.
  useLayoutEffect(() => {
    if (!open) return;
    leaving.current = false;
    const el = pieces();
    const laid = el ? lay(el, { circle: circleRef, label: labelRef }, seeds, geo.current) : false;
    if (still || !el || !laid) return;
    // The blob starts as the drop, so whatever frame first shows it shows the drop.
    ink.current = { g: 0, c: 0, amp: 0, t: 0 };
    draw(el, geo.current, ink.current);
    // The bloom's clock: every frame the blob is worked out afresh from where it is in the spread.
    const clock = motionValue(0);
    const unsubscribe = clock.on('change', (t) => {
      const { g, c, damp } = bloomAt(t);
      ink.current = { g, c, amp: 6 * wobbleAt(geo.current.target, D0, g) * damp, t };
      draw(el, geo.current, ink.current);
    });
    playing.current = animate(opening(el, geo.current, clock));
    return () => {
      playing.current?.stop();
      playing.current = null;
      unsubscribe();
    };
  }, [open, still, pieces, circleRef, labelRef, seeds]);

  // A resized window re-lays the stage where it now belongs; ink mid-spread heads for the new box.
  useEffect(() => {
    if (!open) return;
    const onResize = () => {
      const el = pieces();
      if (!el || !lay(el, { circle: circleRef, label: labelRef }, seeds, geo.current)) return;
      if (!still) draw(el, geo.current, ink.current);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [open, still, pieces, circleRef, labelRef, seeds]);

  // Every way out — Escape, the backdrop, the close button — draws the ink home into the button first.
  const requestClose = () => {
    if (leaving.current) return;
    leaving.current = true;
    playing.current?.stop();
    const el = still ? null : pieces();
    if (!el || !lay(el, origin, seeds, geo.current)) {
      onClose();
      return;
    }
    // From wherever the ink got to, back along the same arc: the growth eases to nothing, the centre with it.
    // A rim cut off mid-wobble lets its wobble go as it starts back, rather than snapping still.
    const from = ink.current;
    const unbloom = from.t > 0 ? motionValue(0) : null;
    const unsubscribe = unbloom?.on('change', (u) => {
      const g = from.g * (1 - liquid(u));
      const c = from.g > 0 ? (g / from.g) * from.c : 0;
      const amp = from.amp * (1 - u) + 6 * wobbleAt(geo.current.target, D0, g) * Math.sin(Math.PI * u);
      ink.current = { g, c, amp, t: from.t + 0.4 * u };
      draw(el, geo.current, ink.current);
    });
    // The video starts to surface at 0.8s on the bloom's clock; before that there is nothing to fade first.
    playing.current = animate(closing(el, unbloom, from.t >= 0.8 ? 0.15 : 0));
    playing.current.then(() => {
      unsubscribe?.();
      onClose();
    });
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
              // The ink is the entrance; the exit is instant, under the button that reappears in its place.
              initial: { opacity: 1 },
              animate: { opacity: 1 },
              exit: { opacity: 0, transition: { duration: 0 } },
            }
      }
    >
      <svg className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
        {/*
          The button's stand-in: each blot's ink, under the loop it was ruled with. The inner group is what
          swells and pinches, about its own box, so the copy's placing on the outer one is left alone.
        */}
        <g ref={circleArt}>
          <g ref={circleInk} opacity={rest} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
            <path ref={loopFill} fill="var(--color-ink)" filter={BLOT_SHADOW} />
            <path ref={loop} {...LINE} strokeWidth={BLOT.weight} strokeOpacity={BLOT.tone} />
          </g>
        </g>
        <g ref={labelArt}>
          <g ref={labelInk} opacity={rest} style={{ transformBox: 'fill-box', transformOrigin: 'left center' }}>
            <path ref={labelFill} fill="var(--color-ink)" filter={BLOT_SHADOW} />
            <path ref={labelLoop} {...LINE} strokeWidth={BLOT.weight} strokeOpacity={BLOT.tone} />
          </g>
        </g>
        {/* The ink itself: one shape from the drop to the screen, its stroke's outer half a soft edge while it moves. */}
        <path
          ref={blob}
          fill="var(--color-ink)"
          stroke="var(--color-ink)"
          strokeWidth={12}
          strokeLinejoin="round"
          strokeOpacity={0}
          opacity={0}
        />
      </svg>

      {/* The button's play mark and words over its stand-in's ink: page-coloured, they go before the ink does. */}
      <div className="absolute inset-0" style={{ opacity: rest }} aria-hidden>
        <span ref={play} className="absolute flex items-center justify-center text-page">
          <Play size={20} fill="currentColor" className="translate-x-px" />
        </span>
        <span ref={words} className="sk-btn absolute translate-none whitespace-nowrap px-4 py-1.5 text-sm">
          Watch demo
        </span>
      </div>

      {/* Ink behind the player, the blob's box and corners exactly, so the screen is the ink while the video loads. */}
      <div ref={player} className={`pointer-events-auto absolute bg-ink ${FRAME_INNER}`} style={{ opacity: shown }}>
        <iframe
          src={youtubeEmbedUrl(project.demoUrl)}
          title={`${project.cardTitle} demo`}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
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
        The way out, a small drop blotted on the popup's corner as the arrows hang off the hero's edges. Its
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
