import type { Ref } from 'react';
import { ArrowRight } from 'lucide-react';
import Eyebrow from '@/components/Eyebrow';
import Frame from '@/components/sketch/Frame';
import Tag from '@/components/Tag';
import type { Project } from '@/content/projects';
import { projectAddresses } from '@/pages/projects/addresses';
import ProjectPanel from './ProjectPanel';

/** The project's real address — the card's "go use it" affordance. */
const ProjectLink = ({ project }: { project: Project }) => {
  const address = projectAddresses(project)[0];
  if (!address) return null;

  return (
    <span className="flex min-w-0 max-w-full items-center gap-[7px] text-sm font-medium text-graphite">
      <address.Icon size={14} strokeWidth={1.8} className="shrink-0" />
      <span className="truncate">{address.label}</span>
    </span>
  );
};

/**
 * A project as the sketch lays one out: its window on the left, ruled by
 * hand, and beside it the name, the stack as chips, what it is and the way
 * in. On a phone the window sits over the words.
 */
export default function ProjectCard({
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
      className="sk-frame sk-card group flex w-full flex-col gap-5 rounded-2xl p-5 text-left cursor-pointer focus-ring sm:flex-row sm:p-6"
    >
      <Frame r={16} double draw />
      <ProjectPanel
        panel={project.panel}
        title={project.cardTitle}
        layoutId={layoutId}
        className="h-[180px] w-full shrink-0 sm:h-[150px] sm:w-[42%]"
      />
      <span className="flex min-w-0 flex-1 flex-col">
        <Eyebrow className="mb-1">{project.kind}</Eyebrow>
        <h3 className="mb-2.5 text-xl font-semibold leading-snug text-ink">{project.cardTitle}</h3>
        <span className="mb-3 flex flex-wrap gap-1.5">
          {project.cardTags.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </span>
        <p className="mb-4 text-[15px] font-medium leading-relaxed text-pencil text-pretty">{project.cardDescription}</p>
        {/* Wraps rather than clips: a long repo path takes its own row on narrow cards. */}
        <span className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="inline-flex shrink-0 items-center gap-2 text-[15px] text-ink">
            <span className="sk-link">View details</span>
            <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
          </span>
          <span className="ml-auto min-w-0 max-w-full">
            <ProjectLink project={project} />
          </span>
        </span>
      </span>
    </button>
  );
}
