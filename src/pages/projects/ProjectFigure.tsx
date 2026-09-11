import type { Figure, IllustrationId } from '@/content/projects';
import HandCubeIllustration from './HandCubeIllustration';

/** The drawings content can name. Content carries the id; the SVG lives here. */
const ILLUSTRATIONS: Record<IllustrationId, typeof HandCubeIllustration> = {
  'hand-cube': HandCubeIllustration,
};

/**
 * A case-study picture: the imported image, or the named drawing. `eager` is
 * for the hero, which is the first thing the dialog shows; everything else
 * loads lazily.
 */
export default function ProjectFigure({
  figure,
  className = '',
  eager = false,
}: {
  figure: Figure;
  className?: string;
  eager?: boolean;
}) {
  if (figure.illustration) {
    const Drawing = ILLUSTRATIONS[figure.illustration];
    return <Drawing label={figure.alt} className={className} />;
  }
  return (
    <img
      src={figure.src}
      alt={figure.alt}
      className={className}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
    />
  );
}
