import { ArrowRight } from 'lucide-react';
import Eyebrow from '@/components/Eyebrow';
import Tag from '@/components/Tag';
import type { Project } from '@/content/projects';
import { projectAddresses } from './addresses';
import ProjectPanel from './ProjectPanel';

/** The project's real address, in mono — the card's "go use it" affordance. */
const ProjectLink = ({ project }: { project: Project }) => {
  const address = projectAddresses(project)[0];
  if (!address) return null;

  return (
    <span className="flex min-w-0 max-w-full items-center gap-[7px] font-mono text-xs font-bold text-zinc-600">
      <address.Icon size={14} className="shrink-0" />
      <span className="truncate">{address.label}</span>
    </span>
  );
};

export default function ProjectCard({
  project,
  onOpen,
}: {
  project: Project;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative flex w-full flex-col text-left p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-zinc-100 bg-white/50 backdrop-blur-sm hover:bg-white hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all duration-500 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
    >
      <ProjectPanel panel={project.panel} title={project.cardTitle} className="mb-6 h-[180px] sm:h-[200px]" />
      <Eyebrow className="mb-2.5">{project.kind}</Eyebrow>
      <h3 className="text-lg font-semibold text-zinc-900 group-hover:text-black transition-colors tracking-tight mb-3">
        {project.cardTitle}
      </h3>
      <p className="text-sm text-zinc-500 mb-5 leading-relaxed font-medium text-pretty">{project.cardDescription}</p>
      <div className="mt-auto flex flex-wrap gap-2 mb-[22px]">
        {project.cardTags.map((tag) => (
          <Tag key={tag}>{tag}</Tag>
        ))}
      </div>
      {/* Wraps rather than clips: a long repo path takes its own row on narrow cards. */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-[18px] border-t border-zinc-100">
        <span className="inline-flex shrink-0 items-center gap-2 text-sm font-bold text-zinc-900">
          View details <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
        </span>
        <span className="ml-auto min-w-0 max-w-full">
          <ProjectLink project={project} />
        </span>
      </div>
    </button>
  );
}
