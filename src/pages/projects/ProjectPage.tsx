import { useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import PillLink from '@/components/PillLink';
import { groupLabel, type Project } from '@/content/projects';
import { EASE } from '@/lib/motion';
import { projectAddresses } from './addresses';
import AddressPill from './components/AddressPill';
import Caption from './components/Caption';
import StudySection from './components/CaseStudySection';
import HeroSlider from './components/HeroSlider';
import MetaStrip from './components/MetaStrip';
import NeighbourCard from './components/NeighbourCard';
import ProjectGallery from './components/ProjectGallery';
import WhatItDoes from './components/WhatItDoes';
import { heroLayoutId } from './hero';
import { casePictures, counter } from './pictures';
import { useSlides } from './useSlides';

/** Every block after the first opens with the About page's hairline. */
const BLOCK = 'border-t border-zinc-100 pt-12';

/**
 * The case study as a page inside the Projects tab, at the site's content
 * width. The hero frame is the shared element that grows out of the card;
 * everything else fades in around it. `arrival` says where the reader came
 * from: from the grid, the hero is already on screen mid-flight and the rest
 * waits a beat; from a neighbouring page, it all fades in together.
 */
export default function ProjectPage({
  project,
  prev,
  next,
  arrival,
  onBack,
  onSelect,
}: {
  project: Project;
  prev: Project | null;
  next: Project | null;
  arrival: 'grid' | 'page';
  onBack: () => void;
  onSelect: (project: Project) => void;
}) {
  const reduced = useReducedMotion();
  const { caseStudy } = project;
  const addresses = projectAddresses(project);
  const primary = addresses[0];
  const { pictures, showGallery } = casePictures(caseStudy);
  const many = pictures.length > 1;
  const slides = useSlides(pictures.length);
  const hero = pictures[slides.current];
  const titleRef = useRef<HTMLHeadingElement>(null);
  const heroRef = useRef<HTMLElement>(null);

  // The page is the new thing on screen: the keyboard starts at its title.
  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true });
  }, []);

  // A gallery pick is far from the hero, so it also brings the hero into view.
  const jumpTo = (i: number) => {
    slides.show(i);
    heroRef.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
  };

  /* Everything but the hero: fades and rises in, fades out. From the grid it waits for the hero to get going. */
  const rise = {
    initial: { opacity: 0, y: reduced ? 0 : 16 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.35, delay: arrival === 'grid' ? 0.1 : 0, ease: EASE } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  };
  // The hero has no entrance of its own when it is the shared element in flight; otherwise it fades like the rest.
  // On the way out its band fades quickly, so it does not sit over the grid while the frame shrinks back to the card.
  const shared = !reduced;
  const inFlight = shared && arrival === 'grid';
  const heroFade = {
    initial: inFlight ? false : { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.35, ease: EASE } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  };
  // The arrows hang off the frame's final edges, so they wait for the shared element to finish flying into them.
  const arrowDelay = inFlight ? 0.45 : 0;

  let figureCount = 0;
  const blocks = caseStudy.sections.map((section, i) => {
    const flip = section.figure ? figureCount++ % 2 === 1 : false;
    return <StudySection key={section.heading} section={section} flip={flip} className={i === 0 ? '' : BLOCK} />;
  });

  return (
    <article className="w-full">
      <motion.div {...rise}>
        {/* Back on the left, the addresses on the right; on a phone the pills take their own row, the primary one wide. */}
        <div className="mb-8 flex flex-wrap items-center gap-3 md:mb-10">
          <PillLink as="button" variant="outline" size="sm" onClick={onBack} className="min-h-11 md:min-h-0">
            <ArrowLeft size={14} className="shrink-0" /> All creations
          </PillLink>
          {addresses.length > 0 ? (
            <div className="flex w-full flex-wrap items-center gap-2 sm:ml-auto sm:w-auto sm:flex-nowrap">
              {addresses.map((address) => (
                <AddressPill key={address.href} address={address} primary={address === primary} />
              ))}
            </div>
          ) : null}
        </div>

        <p className="mb-4 flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
          <span>{groupLabel(project.group)}</span>
          <span className="text-zinc-300">/</span>
          <span className="text-zinc-600">{project.kind}</span>
        </p>
        <h1
          ref={titleRef}
          tabIndex={-1}
          className="mb-4 max-w-4xl text-[32px] font-bold leading-[1.05] tracking-[-0.04em] text-zinc-900 outline-none sm:text-[40px] lg:text-[48px]"
        >
          {project.cardTitle}
        </h1>
        <p className="mb-8 max-w-3xl text-base leading-relaxed text-zinc-600 text-pretty md:mb-10 md:text-lg">{caseStudy.summary}</p>
      </motion.div>

      {/* The gallery further down picks into the same slider, so a change made there is visible on arrival. */}
      <HeroSlider
        ref={heroRef}
        {...heroFade}
        pictures={pictures}
        slides={slides}
        layoutId={shared ? heroLayoutId(project.id) : undefined}
        layoutDependency={project.id}
        arrowDelay={arrowDelay}
        caption={
          // The right slot counts the pictures; the address pill at the top already names the host.
          <Caption
            index={slides.current + 1}
            text={hero.caption}
            right={many ? counter(slides.current, pictures.length) : undefined}
            live={many}
            className="mt-3 md:mt-5"
          />
        }
      />

      <motion.div {...rise} className="mt-10 md:mt-12">
        <MetaStrip project={project} />

        <div className="mt-12 flex flex-col gap-12">
          {blocks}
          <WhatItDoes items={project.keyFeatures} className={BLOCK} />
          {showGallery ? <ProjectGallery pictures={pictures} current={slides.current} onPick={jumpTo} className={BLOCK} /> : null}

          {/* Prev / next: two cards; a missing one leaves its cell empty. */}
          <nav aria-label="Other projects" className={`${BLOCK} grid gap-6 md:grid-cols-2`}>
            {prev ? <NeighbourCard direction="previous" project={prev} onSelect={onSelect} /> : null}
            {next ? <NeighbourCard direction="next" project={next} onSelect={onSelect} className="md:col-start-2" /> : null}
          </nav>
        </div>
      </motion.div>
    </article>
  );
}
