import Frame from '@/components/sketch/Frame';
import type { CaseStudySection } from '@/content/projects';
import { FRAME, FRAME_INNER } from '@/pages/projects/hero';
import ProjectFigure from './ProjectFigure';

const Prose = ({ section }: { section: CaseStudySection }) => (
  <>
    <div className="mb-5">
      <h3 className="sk-heading">{section.heading}</h3>
    </div>
    <div className="space-y-4 text-[17px] leading-relaxed text-pencil text-pretty">
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
          <Frame r={16} weight={1.5} tone={0.85} draw />
          <div className={FRAME_INNER}>
            <ProjectFigure figure={section.figure} eager className="block h-auto w-full" />
          </div>
        </div>
        <figcaption className="mt-3 text-sm leading-relaxed text-graphite">{section.figure.caption}</figcaption>
      </figure>
    </section>
  );
}
