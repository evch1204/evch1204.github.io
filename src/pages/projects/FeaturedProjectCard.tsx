import { ArrowRight } from 'lucide-react';
import Tag from '@/components/Tag';
import type { Project } from '@/content/projects';

/** The one project that opens the page, on its own wide card. */
export default function FeaturedProjectCard({
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
      className="group w-full max-w-none text-left rounded-[2rem] border border-zinc-100 bg-white/80 backdrop-blur-sm px-5 py-5 sm:px-7 sm:py-6 md:px-9 md:py-6 lg:px-10 lg:py-7 shadow-[0_20px_50px_rgba(0,0,0,0.04)] transition-all duration-500 hover:bg-white hover:shadow-[0_28px_60px_rgba(0,0,0,0.07)] hover:border-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_minmax(240px,38%)] gap-6 lg:gap-10 lg:items-center">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2">Featured</p>
          <h3 className="text-2xl sm:text-3xl lg:text-3xl xl:text-4xl font-bold text-zinc-900 tracking-tight mb-2 group-hover:text-black transition-colors leading-tight">
            {project.cardTitle}
          </h3>
          <p className="text-sm sm:text-base text-zinc-500 leading-snug font-medium mb-3 max-w-3xl">
            {project.cardDescription}
          </p>
          {project.reportPreview && (
            <div className="rounded-xl border border-zinc-100 bg-zinc-50/90 px-4 py-3 md:px-4 md:py-3.5 mb-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Report preview</p>
              <p className="text-xs sm:text-sm text-zinc-600 leading-snug font-medium">
                {project.reportPreview}
              </p>
            </div>
          )}
          <div className="flex flex-wrap gap-2 mb-2">
            {project.cardTags.map((tag) => (
              <Tag key={tag}>
                {tag}
              </Tag>
            ))}
          </div>
          <span className="inline-flex items-center gap-2 text-sm font-bold text-zinc-900 group-hover:gap-3 transition-all">
            View project details <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
        <div className="relative flex w-full shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50 min-h-[200px] sm:min-h-[220px] lg:min-h-[240px] lg:max-h-[300px] p-2 sm:p-3">
          {project.heroImage ? (
            <img
              src={project.heroImage}
              alt="Illustration for ergonomic risk and muscle-activation research"
              className="max-h-[min(280px,42vw)] w-full object-contain object-center transition-transform duration-700 group-hover:scale-[1.02]"
            />
          ) : null}
        </div>
      </div>
    </button>
  );
}
