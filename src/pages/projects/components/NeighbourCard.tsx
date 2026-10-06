import { ArrowLeft, ArrowRight } from 'lucide-react';
import Eyebrow from '@/components/Eyebrow';
import Frame from '@/components/sketch/Frame';
import type { Project } from '@/content/projects';
import ProjectPanel from './ProjectPanel';

/** A card ruled by hand for the project before or after this one: eyebrow, title, kind, and its own window. */
export default function NeighbourCard({
  direction,
  project,
  onSelect,
  className = '',
}: {
  direction: 'previous' | 'next';
  project: Project;
  onSelect: (project: Project) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(project)}
      className={`sk-frame sk-card group flex w-full flex-col rounded-2xl p-5 text-left cursor-pointer focus-ring sm:p-6 ${className}`}
    >
      <Frame r={16} double draw />
      <Eyebrow className="mb-2 flex items-center gap-2">
        {direction === 'previous' ? (
          <>
            <ArrowLeft size={14} className="shrink-0 transition-transform duration-300 group-hover:-translate-x-1" /> Previous
          </>
        ) : (
          <>
            Next <ArrowRight size={14} className="shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
          </>
        )}
      </Eyebrow>
      <span className="text-xl font-semibold leading-tight text-ink">{project.cardTitle}</span>
      <span className="mt-1 text-sm font-medium text-graphite">{project.kind}</span>
      <ProjectPanel panel={project.panel} title={project.cardTitle} className="mt-5 h-[150px] sm:h-[170px]" />
    </button>
  );
}
