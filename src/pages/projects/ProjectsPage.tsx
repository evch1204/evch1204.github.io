import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import Section from '@/components/Section';
import { FEATURED_PROJECT, PROJECT_GROUPS, projectsInGroup, type Project } from '@/content/projects';
import { GITHUB_URL } from '@/content/site';
import FeaturedProjectCard from './FeaturedProjectCard';
import ProjectCard from './ProjectCard';
import ProjectDetailModal from './ProjectDetailModal';

/** Rule + label that separates the two runs of project cards. */
const GroupHeading = ({ label, count }: { label: string; count: number }) => (
  <div className="mt-14 mb-6 flex items-baseline gap-4">
    <h3 className="whitespace-nowrap text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">{label}</h3>
    <span className="h-px flex-1 bg-zinc-200" aria-hidden />
    <span className="text-[11px] font-bold tracking-wider text-zinc-400">
      {String(count).padStart(2, '0')}
    </span>
  </div>
);

export default function ProjectsPage() {
  const [detailProject, setDetailProject] = useState<Project | null>(null);

  return (
    <Section title="Creations">
      <FeaturedProjectCard project={FEATURED_PROJECT} onOpen={() => setDetailProject(FEATURED_PROJECT)} />

      {PROJECT_GROUPS.map((group) => {
        const items = projectsInGroup(group.id);
        if (items.length === 0) return null;
        return (
          <div key={group.id}>
            <GroupHeading label={group.label} count={items.length} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {items.map((project) => (
                <ProjectCard key={project.id} project={project} onOpen={() => setDetailProject(project)} />
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

      <ProjectDetailModal project={detailProject} onClose={() => setDetailProject(null)} />
    </Section>
  );
}
