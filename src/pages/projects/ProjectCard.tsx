import { ArrowRight, ExternalLink, Github } from 'lucide-react';
import Tag from '@/components/Tag';
import type { Project } from '@/content/projects';
import { hostLabel, repoLabel } from '@/lib/url';
import ProjectGlyph from './ProjectGlyph';

/**
 * Card panel: a screenshot when the project has a live page to show, and a
 * line-art mark when it does not (research, embedded and CLI work).
 */
const ProjectPanel = ({ project }: { project: Project }) => (
  <div className="mb-6 h-[180px] sm:h-[200px] overflow-hidden rounded-2xl border border-zinc-100 bg-zinc-50 flex items-center justify-center">
    {project.screenshot ? (
      <img
        src={project.screenshot}
        alt={`Screenshot of ${project.cardTitle}`}
        loading="lazy"
        className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.02]"
      />
    ) : (
      <ProjectGlyph name={project.glyph} />
    )}
  </div>
);

/** The project's real address, in mono — the card's "go use it" affordance. */
const ProjectLink = ({ project }: { project: Project }) => {
  if (project.liveUrl) {
    return (
      <span className="flex min-w-0 max-w-full items-center gap-[7px] font-mono text-xs font-bold text-zinc-600">
        <ExternalLink size={14} className="shrink-0" />
        <span className="truncate">{hostLabel(project.liveUrl)}</span>
      </span>
    );
  }
  if (project.githubUrl) {
    return (
      <span className="flex min-w-0 max-w-full items-center gap-[7px] font-mono text-xs font-bold text-zinc-600">
        <Github size={14} className="shrink-0" />
        <span className="truncate">{repoLabel(project.githubUrl)}</span>
      </span>
    );
  }
  return null;
};

const ProjectCardButton = ({ project, onOpen }: { project: Project; onOpen: () => void }) => (
  <button
    type="button"
    onClick={onOpen}
    className="group relative flex w-full flex-col text-left p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-zinc-100 bg-white/50 backdrop-blur-sm hover:bg-white hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all duration-500 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
  >
    <ProjectPanel project={project} />
    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2.5">{project.kind}</p>
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

export default ProjectCardButton;
