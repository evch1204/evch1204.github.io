import { motion } from 'motion/react';
import type { CardPanel } from '@/content/projects';
import ProjectFigure from './ProjectFigure';

/** The one `layoutId` a project's card window and its page hero share, so one grows into the other. */
export const heroLayoutId = (projectId: string) => `project-hero-${projectId}`;

/** How the shared window travels between the card and the page: a spring with a little settle, ~0.55s. */
export const HERO_TRANSITION = { type: 'spring', bounce: 0.15, duration: 0.55 } as const;

/**
 * The zinc sill at the top of a card, and the window rising out of it: 1px
 * zinc-200 frame, rounded top corners, cropped by the sill's bottom edge. A
 * screenshot fills the window from the top; a figure or drawing sits in it
 * whole. `className` sets the sill's height (and any margin) per card.
 *
 * With a `layoutId` the window is the shared element of the project page's
 * opening animation: it expands into the page's hero frame and shrinks back.
 */
export default function ProjectPanel({
  panel,
  title,
  className,
  layoutId,
}: {
  panel: CardPanel;
  title: string;
  className: string;
  layoutId?: string;
}) {
  return (
    <div className={`flex items-end overflow-hidden rounded-2xl border border-zinc-100 bg-zinc-50 px-[18px] pt-[18px] ${className}`}>
      {/*
       * `layoutDependency` pins the window: it is only re-measured when it enters
       * or leaves, never on an ordinary re-render — which would otherwise turn
       * the page's scroll hand-off into a spurious second animation.
       * The hover lift transitions `translate`, not `transform`: the latter is
       * the property the layout animation drives frame by frame.
       */}
      <motion.div
        layoutId={layoutId}
        layoutDependency={layoutId}
        transition={{ layout: HERO_TRANSITION }}
        className="flex h-full w-full flex-col overflow-hidden rounded-t-[10px] border border-b-0 border-zinc-200 bg-white shadow-[0_12px_32px_rgba(0,0,0,0.06)] transition-[translate] duration-700 group-hover:-translate-y-0.5"
      >
        <div className="flex h-[18px] shrink-0 items-center justify-center border-b border-zinc-100" aria-hidden>
          <span className="block h-[5px] w-[72px] rounded-[3px] bg-zinc-100" />
        </div>
        {panel.kind === 'screenshot' ? (
          <img
            src={panel.src}
            alt={`Screenshot of ${title}`}
            loading="lazy"
            decoding="async"
            className="min-h-0 w-full flex-1 object-cover object-top"
          />
        ) : (
          // A drawing paints its own paper edge to edge; a chart or photo gets a little air inside the window.
          <ProjectFigure
            figure={panel.figure}
            className={`min-h-0 w-full flex-1${panel.figure.illustration ? '' : ' object-contain object-top p-2'}`}
          />
        )}
      </motion.div>
    </div>
  );
}
