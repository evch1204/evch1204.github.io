import { useLayoutEffect, useRef, type RefObject } from 'react';
import { ExternalLink, X } from 'lucide-react';
import { animate, motion, useMotionValue, useReducedMotion } from 'motion/react';
import Modal from '@/components/Modal';
import Frame from '@/components/sketch/Frame';
import type { Figure, Project } from '@/content/projects';
import { linkProps } from '@/lib/links';
import { EASE } from '@/lib/motion';
import { youtubeEmbedUrl } from '@/lib/url';
import { FRAME, FRAME_INNER, HERO_TRANSITION } from '@/pages/projects/hero';
import ProjectFigure from './ProjectFigure';

/** A box on screen, in the viewport's coordinates: what the panel flies between. */
type Box = { top: number; left: number; width: number; height: number };

const boxOf = (el: Element | null | undefined): Box | null => {
  if (!el) return null;
  const { top, left, width, height } = el.getBoundingClientRect();
  return width > 0 && height > 0 ? { top, left, width, height } : null;
};

/** The dialog's panel, once it is in the document. There is only ever one open. */
const panelEl = () => document.querySelector<HTMLElement>('[role="dialog"]');

const px = (n: number) => `${n}px`;

/** Pins the panel to the viewport at a box, out of the overlay's centring. */
const pin = (panel: HTMLElement, box: Box) =>
  Object.assign(panel.style, {
    position: 'fixed',
    top: px(box.top),
    left: px(box.left),
    width: px(box.width),
    height: px(box.height),
    maxWidth: 'none',
    margin: '0',
  });

/** Hands the panel back to the overlay, which lays it out where it had been measured. */
const unpin = (panel: HTMLElement) =>
  Object.assign(panel.style, { position: '', top: '', left: '', width: '', height: '', maxWidth: '', margin: '' });

/** The panel's box, from where it is pinned to `to`: the same spring the card's window flies on. */
const flyTo = (panel: HTMLElement, to: Box) =>
  animate(panel, { top: px(to.top), left: px(to.left), width: px(to.width), height: px(to.height) }, HERO_TRANSITION);

/**
 * The player's box: sixteen by nine, as wide as the page's content, and never
 * taller than most of the viewport — the overlay's padding keeps it off the
 * edges. A class rather than a style, so the flight's inline box can be
 * cleared back to it.
 */
const PLAYER = 'aspect-video w-[min(64rem,82dvh_*_16_/_9)] max-w-full';

/**
 * The project's demo video, and the way it arrives: the hero's frame lifts
 * off the page and grows into the player — the frame *is* the player, the
 * video filling it edge to edge, the screenshot in it giving way to the
 * video as it grows — and shrinks back into place when the dialog closes.
 * The same move the card's window makes when it grows into the hero,
 * carried one step further. The name and the way out to YouTube sit under
 * the frame like the hero's caption; the close button hangs off its corner
 * like the hero's arrows. Both wait for the frame to land.
 *
 * The flight is measured, not shared: the panel is pinned to the viewport at
 * the hero's box on screen (`origin`), ruled by hand exactly as the hero is
 * and showing the same picture, and its box is animated to where the dialog
 * had laid itself out — then unpinned, so a resized window still centres
 * it. The hero itself is hidden for the duration — the stand-in is it. The
 * player exists only while the dialog is open, so closing it stops the
 * sound; with reduced motion the dialog simply fades, as every dialog does.
 */
export default function DemoModal({
  project,
  picture,
  open,
  origin,
  onClose,
}: {
  project: Project;
  /** What the hero is showing: the picture the stand-in carries into the dialog. */
  picture: Figure;
  open: boolean;
  origin: RefObject<HTMLElement | null>;
  onClose: () => void;
}) {
  const fly = !useReducedMotion();
  /** The hero's picture over the player: solid for the lift-off, gone by the time the frame lands. */
  const pictureOpacity = useMotionValue(0);
  /** The caption and the close button, outside the frame: there once it has landed, gone as it leaves. */
  const chromeOpacity = useMotionValue(1);
  const closing = useRef(false);

  // Before paint, with the panel laid out where it will land: pin it to the
  // hero's box instead, then let it fly. The reader never sees the landing spot early.
  useLayoutEffect(() => {
    if (!open || !fly) return;
    closing.current = false;
    const panel = panelEl();
    const from = boxOf(origin.current);
    const to = boxOf(panel);
    if (!panel || !from || !to) return;
    pictureOpacity.set(1);
    chromeOpacity.set(0);
    // The picture outlasts the flight a little: it hands over to the player, not to the ink behind it.
    animate(pictureOpacity, 0, { duration: 0.55, delay: 0.2, ease: EASE });
    animate(chromeOpacity, 1, { duration: 0.3, delay: 0.4, ease: EASE });
    let stale = false;
    pin(panel, from);
    flyTo(panel, to).then(() => {
      if (!stale && !closing.current) unpin(panel);
    });
    return () => {
      stale = true;
    };
    // The motion values are stable; only the opening matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, fly]);

  // Every way out — Escape, the backdrop, the close button — flies the frame home first.
  const requestClose = () => {
    if (!fly || closing.current) {
      if (!fly) onClose();
      return;
    }
    const panel = panelEl();
    const from = boxOf(panel);
    const to = boxOf(origin.current);
    if (!panel || !from || !to) {
      onClose();
      return;
    }
    closing.current = true;
    animate(chromeOpacity, 0, { duration: 0.12, ease: EASE });
    animate(pictureOpacity, 1, { duration: 0.3, delay: 0.1, ease: EASE });
    pin(panel, from);
    flyTo(panel, to).then(onClose);
  };

  if (!project.demoUrl) return null;
  return (
    <Modal
      open={open}
      onClose={requestClose}
      overlayClassName="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      backdropClassName="bg-ink/45 backdrop-blur-[1px]"
      backdropLabel="Close demo"
      label={`${project.cardTitle} demo`}
      panelClassName={`${FRAME} ${PLAYER} relative z-[102] shadow-[0_32px_64px_rgba(0,0,0,0.25)] outline-none`}
      panelMotion={
        fly
          ? {
              // The flight is the entrance; the exit is instant, under the hero that reappears in its place.
              initial: { opacity: 1 },
              animate: { opacity: 1 },
              exit: { opacity: 0, transition: { duration: 0 } },
            }
          : undefined
      }
    >
      {/* Over the picture rather than under it, so the whole line shows while the hero's picture covers the box. */}
      <Frame r={16} weight={1.6} tone={0.9} double className="z-10" />
      {/* Ink behind the player, so the frame reads as a screen while the video loads. */}
      <div className={`relative h-full w-full bg-ink ${FRAME_INNER}`}>
        <iframe
          src={youtubeEmbedUrl(project.demoUrl)}
          title={`${project.cardTitle} demo`}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="block h-full w-full border-0"
        />
        {/* The hero's picture, over the player, for the lift-off and the landing. */}
        {fly ? (
          <motion.div style={{ opacity: pictureOpacity }} className="pointer-events-none absolute inset-0" aria-hidden>
            <ProjectFigure figure={picture} eager className="h-full w-full object-cover object-top" />
          </motion.div>
        ) : null}
      </div>

      {/* Under the frame, as the hero's caption is: the name in ink, the way out to YouTube on the right. */}
      <motion.div
        style={{ opacity: chromeOpacity }}
        className="absolute inset-x-0 top-full mt-3 flex items-center justify-between gap-4 text-sm leading-relaxed text-page/85 md:mt-4"
      >
        <span className="min-w-0 truncate">
          <b className="font-bold text-page">{project.cardTitle}</b>
          <span className="ml-2.5">Demo</span>
        </span>
        <a
          href={project.demoUrl}
          {...linkProps(project.demoUrl)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md font-semibold text-page underline decoration-page/40 decoration-[1.5px] underline-offset-4 transition-colors hover:decoration-page focus-ring"
        >
          Open on YouTube <ExternalLink size={13} />
        </a>
      </motion.div>

      {/* The way out, a circle drawn by hand on the frame's corner, as the arrows hang off the hero's edges. */}
      <motion.button
        type="button"
        onClick={requestClose}
        style={{ opacity: chromeOpacity }}
        aria-label="Close demo"
        className="sk-frame group absolute -right-4 -top-4 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full bg-page text-pencil transition-colors hover:text-ink focus-ring md:-right-5 md:-top-5 md:h-10 md:w-10"
      >
        <Frame r={999} weight={1.5} tone={0.9} />
        <X size={18} className="transition-transform duration-300 group-hover:rotate-90" />
      </motion.button>
    </Modal>
  );
}
