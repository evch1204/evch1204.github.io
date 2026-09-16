import Eyebrow from '@/components/Eyebrow';
import type { CaseStudySection } from '@/content/projects';
import { FRAME } from '@/pages/projects/hero';
import ProjectFigure from './ProjectFigure';

const Prose = ({ section }: { section: CaseStudySection }) => (
  <>
    <Eyebrow as="h3" className="mb-4">
      {section.heading}
    </Eyebrow>
    <div className="space-y-4 text-base leading-relaxed text-zinc-600 text-pretty">
      {section.body.map((paragraph, i) => (
        // Static content: the index is the paragraph's identity.
        <p key={i}>{paragraph}</p>
      ))}
    </div>
  </>
);

/**
 * A section of the narrative. Without a figure it is prose at a reading
 * measure; with one it is a two-column band from `lg`, the figure on the side
 * `flip` says, and prose over figure below that.
 */
export default function StudySection({
  section,
  flip,
  className,
}: {
  section: CaseStudySection;
  flip: boolean;
  className: string;
}) {
  if (!section.figure) {
    return (
      <section className={`${className} max-w-[68ch]`}>
        <Prose section={section} />
      </section>
    );
  }
  const columns = flip
    ? 'lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]'
    : 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]';
  return (
    <section className={`${className} grid gap-8 lg:items-center lg:gap-14 ${columns}`}>
      <div className={`min-w-0 max-w-[68ch] ${flip ? 'lg:order-2' : ''}`}>
        <Prose section={section} />
      </div>
      <figure className={`min-w-0 ${flip ? 'lg:order-1' : ''}`}>
        {/* Eager: a lazy figure has no height until it loads, and the page would jump under the reader. */}
        <div className={FRAME}>
          <ProjectFigure figure={section.figure} eager className="block h-auto w-full" />
        </div>
        <figcaption className="mt-3 font-mono text-[10px] leading-relaxed text-zinc-400 md:text-[11px]">
          {section.figure.caption}
        </figcaption>
      </figure>
    </section>
  );
}
