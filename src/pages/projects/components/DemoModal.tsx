import { useLayoutEffect, useRef, type RefObject } from 'react';
import { ExternalLink, X } from 'lucide-react';
import { animate, motion, useMotionValue, useReducedMotion } from 'motion/react';
import Modal from '@/components/Modal';
import PillLink from '@/components/PillLink';
import Frame from '@/components/sketch/Frame';
import type { Figure, Project } from '@/content/projects';
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
 * The project's demo video, in a dialog framed like the rest of the sheet —
 * and the way it arrives: the hero's frame lifts off the page and grows
 * into the player, the screenshot in it giving way to the video, and shrinks
 * back into place when the dialog closes. The same move the card's window
 * makes when it grows into the hero, carried one step further.
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
  /** The hero's picture over the panel: solid for the lift-off, gone once the player is in view. */
  const pictureOpacity = useMotionValue(0);
  /** The dialog proper — header and player — the other way round. */
  const contentOpacity = useMotionValue(1);
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
    contentOpacity.set(0);
    animate(pictureOpacity, 0, { duration: 0.35, delay: 0.12, ease: EASE });
    animate(contentOpacity, 1, { duration: 0.3, delay: 0.3, ease: EASE });
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
    animate(contentOpacity, 0, { duration: 0.15, ease: EASE });
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
      panelClassName={`${FRAME} relative z-[102] w-full max-w-5xl shadow-[0_32px_64px_rgba(0,0,0,0.2)] outline-none`}
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
      <div className={`relative h-full ${FRAME_INNER}`}>
        <motion.div style={{ opacity: contentOpacity }} className="flex flex-col">
          <div className="flex shrink-0 items-center gap-3 px-5 py-4 sm:px-6">
            <h2 className="sk-heading">{project.cardTitle}</h2>
            <span className="text-sm font-semibold text-graphite">Demo</span>
            <div className="ml-auto flex items-center gap-2">
              <PillLink size="sm" variant="outline" href={project.demoUrl}>
                <ExternalLink size={14} /> <span className="hidden sm:inline">Open on YouTube</span>
              </PillLink>
              <button
                type="button"
                onClick={requestClose}
                className="rounded-full p-2 text-pencil transition-[color,rotate] duration-300 hover:rotate-90 hover:text-ink focus-ring"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          <div className="sk-rule p-3 sm:p-6">
            {/* Ink behind the player, so the frame reads as a screen while the video loads. */}
            <div className="aspect-video w-full overflow-hidden rounded-lg bg-ink">
              <iframe
                src={youtubeEmbedUrl(project.demoUrl)}
                title={`${project.cardTitle} demo`}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                className="block h-full w-full border-0"
              />
            </div>
          </div>
        </motion.div>
        {/* The hero's picture, over everything, for the lift-off and the landing. */}
        {fly ? (
          <motion.div style={{ opacity: pictureOpacity }} className="pointer-events-none absolute inset-0" aria-hidden>
            <ProjectFigure figure={picture} eager className="h-full w-full object-cover object-top" />
          </motion.div>
        ) : null}
      </div>
    </Modal>
  );
}
