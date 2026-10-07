import type { Figure } from '@/content/projects';
import { counter, pictureKey } from '@/pages/projects/pictures';
import Caption from './Caption';
import Thumb from './Thumb';

/** Every picture of the case study as a tile; a pick drives the hero slider. */
export default function ProjectGallery({
  pictures,
  current,
  onPick,
  className,
}: {
  pictures: Figure[];
  current: number;
  onPick: (i: number) => void;
  className: string;
}) {
  return (
    <section className={className}>
      <div className="mb-5 flex items-end justify-between">
        <h3 className="sk-heading">Gallery</h3>
        <span className="text-sm font-semibold text-graphite">{counter(current, pictures.length)}</span>
      </div>
      {/* Four tiles sit as two rows of two; every other count reads better in threes than with an orphan. */}
      <ul
        className={`grid grid-cols-1 gap-6 sm:grid-cols-2 md:gap-7 ${pictures.length === 4 ? 'lg:grid-cols-2' : 'lg:grid-cols-3'}`}
      >
        {pictures.map((picture, i) => (
          <li key={pictureKey(picture)}>
            <figure>
              <Thumb picture={picture} index={i} active={i === current} onPick={onPick} className="w-full" />
              <Caption index={i + 1} text={picture.caption} className="mt-3" />
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}
