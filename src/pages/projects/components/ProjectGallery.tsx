import Eyebrow from '@/components/Eyebrow';
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
      <div className="mb-4 flex items-baseline justify-between">
        <Eyebrow as="h3">Gallery</Eyebrow>
        <span className="font-mono text-[11px] text-zinc-400">{counter(current, pictures.length)}</span>
      </div>
      {/* Four tiles sit as two rows of two; every other count reads better in threes than with an orphan. */}
      <ul
        className={`grid grid-cols-1 gap-5 sm:grid-cols-2 md:gap-6 ${pictures.length === 4 ? 'lg:grid-cols-2' : 'lg:grid-cols-3'}`}
      >
        {pictures.map((picture, i) => (
          <li key={pictureKey(picture)}>
            <figure>
              <Thumb
                picture={picture}
                index={i}
                active={i === current}
                onPick={onPick}
                className="w-full rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_12px_32px_rgba(0,0,0,0.1)]"
              />
              <Caption index={i + 1} text={picture.caption} className="mt-2.5" />
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}
