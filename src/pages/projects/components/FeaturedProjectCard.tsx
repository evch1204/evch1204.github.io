import type { Ref } from 'react';
import { ArrowRight } from 'lucide-react';
import Eyebrow from '@/components/Eyebrow';
import Frame from '@/components/sketch/Frame';
import Tag from '@/components/Tag';
import type { Project } from '@/content/projects';
import ProjectPanel from './ProjectPanel';

/** The one project that opens the page, on its own wide card. */
export default function FeaturedProjectCard({
  project,
  onOpen,
  layoutId,
  ref,
}: {
  project: Project;
  onOpen: () => void;
  /** Shared with the page hero, so the window grows into it. */
  layoutId?: string;
  /** The card itself: focus comes back to it when the page closes. */
  ref?: Ref<HTMLButtonElement>;
}) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onOpen}
      className="sk-frame sk-card group w-full max-w-none rounded-3xl px-5 py-6 text-left cursor-pointer focus-ring sm:px-8 sm:py-7 lg:px-10 lg:py-8"
    >
      <Frame r={22} weight={1.6} double draw />
      <div className="grid grid-cols-1 gap-7 lg:grid-cols-[1.15fr_minmax(240px,38%)] lg:items-center lg:gap-10">
        <div className="min-w-0">
          <Eyebrow className="mb-2">Featured</Eyebrow>
          <h3 className="mb-3 text-2xl font-semibold leading-tight text-ink sm:text-3xl xl:text-4xl">{project.cardTitle}</h3>
          <p className="mb-4 max-w-3xl text-base font-medium leading-relaxed text-pencil sm:text-[17px]">{project.cardDescription}</p>
          {project.reportPreview && (
            <div className="relative mb-5 max-w-[600px] pl-5">
              <span className="sk-rail absolute bottom-0 left-0 top-0" aria-hidden />
              <Eyebrow className="mb-1.5">From the report</Eyebrow>
              <p className="line-clamp-3 text-[15px] font-medium leading-[1.6] text-pencil">{project.reportPreview}</p>
            </div>
          )}
          <div className="mb-5 flex flex-wrap gap-2">
            {project.cardTags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>
          <span className="inline-flex items-center gap-2 text-base text-ink">
            <span className="sk-link">View project details</span>
            <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </div>
        <ProjectPanel
          panel={project.panel}
          title={project.cardTitle}
          layoutId={layoutId}
          className="h-[220px] w-full shrink-0 sm:h-[250px] lg:h-[270px]"
        />
      </div>
    </button>
  );
}
