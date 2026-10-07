import { motion } from 'motion/react';
import Frame from '@/components/sketch/Frame';
import type { CardPanel } from '@/content/projects';
import { HERO_TRANSITION } from '@/pages/projects/hero';
import ProjectFigure from './ProjectFigure';

/**
 * A card's picture, as the sketch draws a thumbnail: a small browser window
 * ruled by hand, three dots and an address line across its top, and inside it
 * the project itself. A screenshot fills the window from the top; a
 * figure or drawing sits in it whole. `className` sets the window's size (and
 * any margin) per card.
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
    <div className={className}>
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
        className="sk-frame h-full w-full rounded-[10px] bg-page transition-[translate] duration-700 group-hover:-translate-y-0.5"
      >
        <Frame r={10} weight={1.4} tone={0.8} />
        <div className="flex h-full w-full flex-col overflow-hidden rounded-[10px]">
          <div className="flex h-[18px] shrink-0 items-center gap-1 px-2.5" aria-hidden>
            <span className="block h-[5px] w-[5px] rounded-full border border-ink/70" />
            <span className="block h-[5px] w-[5px] rounded-full border border-ink/70" />
            <span className="block h-[5px] w-[5px] rounded-full border border-ink/70" />
            <span className="ml-2 block h-px w-14 bg-ink/35" />
          </div>
          <div className="sk-rule flex min-h-0 flex-1 flex-col [--sk-o:0.55]">
            {panel.kind === 'screenshot' ? (
              <img
                src={panel.src}
                alt={`Screenshot of ${title}`}
                loading="lazy"
                decoding="async"
                className="h-0 min-h-0 w-full flex-1 object-cover object-top"
              />
            ) : (
              // A drawing paints its own paper edge to edge; a chart or photo gets a little air inside the window.
              <ProjectFigure
                figure={panel.figure}
                className={`h-0 min-h-0 w-full flex-1${panel.figure.illustration ? '' : ' object-contain object-top p-2'}`}
              />
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
