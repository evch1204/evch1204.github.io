import { memo } from 'react';
import { ArrowRight } from 'lucide-react';
import PillLink from '@/components/PillLink';
import SketchTitle from '@/components/sketch/SketchTitle';
import { FEATURED_PROJECT, PROJECT_GROUPS, projectsInGroup, type Project } from '@/content/projects';
import { GITHUB_URL } from '@/content/site';
import { pad2 } from '@/lib/format';
import { heroLayoutId } from '@/pages/projects/hero';
import FeaturedProjectCard from './FeaturedProjectCard';
import ProjectCard from './ProjectCard';

/** A run of project cards opens with its name in the hand, a ruled line, and how many there are. */
const GroupHeading = ({ label, count }: { label: string; count: number }) => (
  <div className="mt-16 mb-7 flex items-center gap-4">
    <h3 className="sk-heading whitespace-nowrap">{label}</h3>
    <span className="sk-rule h-0 flex-1" aria-hidden />
    <span className="text-sm font-semibold text-graphite">{pad2(count)}</span>
  </div>
);

/**
 * The tab's own page: its title, the featured card, the two runs of cards
 * and the GitHub link. Memoised: the tab re-renders around it while a project
 * page opens and closes, and nothing in here changes then.
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
      <div className="mb-10 pt-3">
        <SketchTitle>Projects</SketchTitle>
        <p className="mt-5 max-w-[54ch] text-lg leading-relaxed text-pencil">
          A selection of things I&apos;ve built, from apps and interfaces to data and systems.
        </p>
      </div>

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
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
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
        <PillLink variant="outline" href={GITHUB_URL} className="group px-8 py-4">
          Explore more on GitHub <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
        </PillLink>
      </div>
    </>
  );
});

export default ProjectGrid;
