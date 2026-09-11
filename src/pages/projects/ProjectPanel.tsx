import type { CardPanel } from '@/content/projects';
import ProjectFigure from './ProjectFigure';

/**
 * The zinc sill at the top of a card, and the window rising out of it: 1px
 * zinc-200 frame, rounded top corners, cropped by the sill's bottom edge. A
 * screenshot fills the window from the top; a figure or drawing sits in it
 * whole. `className` sets the sill's height (and any margin) per card.
 */
export default function ProjectPanel({
  panel,
  title,
  className,
}: {
  panel: CardPanel;
  title: string;
  className: string;
}) {
  return (
    <div className={`flex items-end overflow-hidden rounded-2xl border border-zinc-100 bg-zinc-50 px-[18px] pt-[18px] ${className}`}>
      <div className="flex h-full w-full flex-col overflow-hidden rounded-t-[10px] border border-b-0 border-zinc-200 bg-white shadow-[0_12px_32px_rgba(0,0,0,0.06)] transition-transform duration-700 group-hover:-translate-y-0.5">
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
      </div>
    </div>
  );
}
