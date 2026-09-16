import type { Figure } from '@/content/projects';
import { pad2 } from '@/lib/format';
import ProjectFigure from './ProjectFigure';

/**
 * One picture as a button at the tile ratio, the active one ringed. The
 * picture is contained rather than cropped: a card crop is more than twice as
 * wide as the tile, and filling would slice the words out of it — the room it
 * leaves is white on a white screenshot. `className` carries the size, the
 * rounding and any shadow; the filmstrip and the gallery differ there and
 * nowhere else.
 */
export default function Thumb({
  picture,
  index,
  active,
  onPick,
  className,
}: {
  picture: Figure;
  index: number;
  active: boolean;
  onPick: (i: number) => void;
  className: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onPick(index)}
      aria-current={active ? 'true' : undefined}
      aria-label={`Show picture ${pad2(index + 1)}: ${picture.caption}`}
      className={`block aspect-[16/10] shrink-0 overflow-hidden border border-zinc-200 bg-white focus-ring ${
        active ? 'ring-2 ring-zinc-900 ring-offset-2' : ''
      } ${className}`}
    >
      <ProjectFigure figure={picture} className="h-full w-full object-contain" />
    </button>
  );
}
