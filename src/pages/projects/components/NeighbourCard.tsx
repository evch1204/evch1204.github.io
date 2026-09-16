import { ArrowLeft, ArrowRight } from 'lucide-react';
import Eyebrow from '@/components/Eyebrow';
import type { Project } from '@/content/projects';
import ProjectPanel from './ProjectPanel';

/** An outline card for the project before or after this one: eyebrow, title, kind, and its own window. */
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
      className={`group flex w-full flex-col rounded-[1.5rem] border border-zinc-200 bg-white p-5 text-left transition-colors hover:border-zinc-900 focus-ring sm:rounded-[2rem] sm:p-6 ${className}`}
    >
      <Eyebrow className="mb-3 flex items-center gap-2">
        {direction === 'previous' ? (
          <>
            <ArrowLeft size={12} className="shrink-0" /> Previous
          </>
        ) : (
          <>
            Next <ArrowRight size={12} className="shrink-0" />
          </>
        )}
      </Eyebrow>
      <span className="text-xl font-bold leading-tight tracking-tight text-zinc-900">{project.cardTitle}</span>
      <span className="mt-1 text-sm font-medium text-zinc-500">{project.kind}</span>
      <ProjectPanel panel={project.panel} title={project.cardTitle} className="mt-5 h-[150px] sm:h-[170px]" />
    </button>
  );
}
