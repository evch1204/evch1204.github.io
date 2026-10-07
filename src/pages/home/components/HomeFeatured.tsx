import type { Ref } from 'react';
import Sketch from '@/components/sketch/Sketch';
import SketchTitle from '@/components/sketch/SketchTitle';
import { ARROW_RIGHT } from '@/components/sketch/marks';
import { PROJECTS } from '@/content/projects';
import SiteFooter from '@/layout/SiteFooter';
import ProjectCard from '@/pages/projects/components/ProjectCard';

/** The first three of the register: the featured project and the two that follow it. */
const FEATURED = PROJECTS.slice(0, 3);

type HomeFeaturedProps = {
  /** Opens a project's page on the projects tab, or the tab itself. */
  onOpen: (project?: string) => void;
  ref?: Ref<HTMLElement>;
};

/**
 * What `Scroll to explore` scrolls to: the next spread of the sketchbook.
 * Three projects, each a card that opens its page, the sketch's margin note
 * pointing at the rest, and the site's footer to close the sheet.
 */
export default function HomeFeatured({ onOpen, ref }: HomeFeaturedProps) {
  return (
    <section ref={ref} className="home-more" aria-labelledby="home-featured">
      <div className="mb-10 pt-3">
        <SketchTitle as="h2">
          <span id="home-featured">Featured Projects</span>
        </SketchTitle>
        <p className="mt-5 max-w-[54ch] text-lg leading-relaxed text-pencil">
          A selection of things I&apos;ve built, from apps and interfaces to data and systems.
        </p>
      </div>

      <div className="grid gap-8">
        {FEATURED.map((project) => (
          <ProjectCard key={project.id} project={project} onOpen={() => onOpen(project.id)} />
        ))}
      </div>

      <div className="mt-10 flex justify-end pr-2">
        <button type="button" onClick={() => onOpen()} className="sk-note group cursor-pointer rounded-md text-lg focus-ring">
          View all projects
          <Sketch
            drawing={ARROW_RIGHT}
            duration={0.4}
            delay={0.3}
            weight={1.3}
            className="ml-2 inline-block h-auto w-7 align-middle transition-transform duration-300 group-hover:translate-x-1"
          />
        </button>
      </div>

      <SiteFooter className="mt-24 md:mt-32" />
    </section>
  );
}
