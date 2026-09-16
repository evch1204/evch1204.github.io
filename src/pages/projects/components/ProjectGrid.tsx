import { memo } from 'react';
import { ArrowRight } from 'lucide-react';
import { FEATURED_PROJECT, PROJECT_GROUPS, projectsInGroup, type Project } from '@/content/projects';
import { GITHUB_URL } from '@/content/site';
import { pad2 } from '@/lib/format';
import { heroLayoutId } from '@/pages/projects/hero';
import FeaturedProjectCard from './FeaturedProjectCard';
import ProjectCard from './ProjectCard';

/** Rule + label that separates the two runs of project cards. */
const GroupHeading = ({ label, count }: { label: string; count: number }) => (
  <div className="mt-14 mb-6 flex items-baseline gap-4">
    <h3 className="whitespace-nowrap text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">{label}</h3>
    <span className="h-px flex-1 bg-zinc-200" aria-hidden />
    <span className="text-[11px] font-bold tracking-wider text-zinc-400">
      {pad2(count)}
    </span>
  </div>
);

/**
 * The featured card, the two runs of cards and the GitHub link — the tab as it
 * was before the page existed. Memoised: the tab re-renders around it while
 * the page opens and closes, and nothing in here changes then.
 */
const ProjectGrid = memo(function ProjectGrid({
  shared,
  onOpen,
  registerCard,
}: {
  /** Give the card windows the layoutId the page hero shares. */
  shared: boolean;
  onOpen: (project: Project) => void;
  registerCard: (id: string, el: HTMLButtonElement | null) => void;
}) {
  return (
    <>
      <FeaturedProjectCard
        project={FEATURED_PROJECT}
        onOpen={() => onOpen(FEATURED_PROJECT)}
        layoutId={shared ? heroLayoutId(FEATURED_PROJECT.id) : undefined}
        ref={(el) => registerCard(FEATURED_PROJECT.id, el)}
      />

      {PROJECT_GROUPS.map((group) => {
        const items = projectsInGroup(group.id);
        if (items.length === 0) return null;
        return (
          <div key={group.id}>
            <GroupHeading label={group.label} count={items.length} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {items.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onOpen={() => onOpen(project)}
                  layoutId={shared ? heroLayoutId(project.id) : undefined}
                  ref={(el) => registerCard(project.id, el)}
                />
              ))}
            </div>
          </div>
        );
      })}
      <div className="mt-16 flex justify-center">
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white border border-zinc-200 text-zinc-900 font-bold hover:border-zinc-900 transition-all duration-300"
        >
          Explore More on GitHub <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </a>
      </div>
    </>
  );
});

export default ProjectGrid;
