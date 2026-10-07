import Frame from '@/components/sketch/Frame';
import type { Figure } from '@/content/projects';
import { pad2 } from '@/lib/format';
import ProjectFigure from './ProjectFigure';

/**
 * One picture as a button at the tile ratio, in a frame ruled by hand; the
 * active one is ruled in ink, heavier. The picture is contained rather than
 * cropped: a card crop is more than twice as wide as the tile, and filling
 * would slice the words out of it. `className` carries the size; the
 * filmstrip and the gallery differ there and nowhere else.
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
      className={`sk-frame sk-card block aspect-[16/10] shrink-0 rounded-lg bg-page focus-ring ${className}`}
    >
      <Frame r={8} weight={active ? 2.2 : 1.3} tone={active ? 1 : 0.5} />
      <span className="block h-full w-full overflow-hidden rounded-lg">
        <ProjectFigure figure={picture} className="h-full w-full object-contain" />
      </span>
    </button>
  );
}
