import { ArrowRight, ExternalLink, Github } from 'lucide-react';
import Tag from '@/components/Tag';
import type { CardPanel, Project } from '@/content/projects';
import { hostLabel, repoLabel } from '@/lib/url';
import { Illustration } from './ProjectFigure';

/**
 * A window rising out of the panel: 1px zinc-200 frame, rounded top corners,
 * cropped by the panel's bottom edge. A screenshot fills it from the top; a
 * figure or drawing sits in it whole.
 */
export function PanelWindow({ panel, title }: { panel: CardPanel; title: string }) {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-t-[10px] border border-b-0 border-zinc-200 bg-white shadow-[0_12px_32px_rgba(0,0,0,0.06)] transition-transform duration-700 group-hover:-translate-y-0.5">
      <div className="flex h-[18px] shrink-0 items-center justify-center border-b border-zinc-100" aria-hidden>
        <span className="block h-[5px] w-[72px] rounded-[3px] bg-zinc-100" />
      </div>
      {panel.kind === 'screenshot' ? (
        <img
          src={panel.src}
          alt={`Screenshot of ${title}`}
          loading="lazy"
          decoding="async"
          className="min-h-0 w-full flex-1 object-cover object-top"
        />
      ) : panel.kind === 'figure' ? (
        <img src={panel.src} alt={panel.alt} loading="lazy" decoding="async" className="min-h-0 w-full flex-1 object-contain object-top p-2" />
      ) : (
        <Illustration id={panel.id} className="min-h-0 w-full flex-1" />
      )}
    </div>
  );
}

const ProjectPanel = ({ project }: { project: Project }) => (
  <div className="mb-6 flex h-[180px] items-end overflow-hidden rounded-2xl border border-zinc-100 bg-zinc-50 px-[18px] pt-[18px] sm:h-[200px]">
    <PanelWindow panel={project.panel} title={project.cardTitle} />
  </div>
);

/** The project's real address, in mono — the card's "go use it" affordance. */
const ProjectLink = ({ project }: { project: Project }) => {
  const { Icon, text } = project.liveUrl
    ? { Icon: ExternalLink, text: hostLabel(project.liveUrl) }
    : project.githubUrl
      ? { Icon: Github, text: repoLabel(project.githubUrl) }
      : { Icon: null, text: '' };

  if (!Icon) return null;

  return (
    <span className="flex min-w-0 max-w-full items-center gap-[7px] font-mono text-xs font-bold text-zinc-600">
      <Icon size={14} className="shrink-0" />
      <span className="truncate">{text}</span>
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
}
