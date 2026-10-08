import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Play } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import PillLink from '@/components/PillLink';
import Sketch from '@/components/sketch/Sketch';
import { ARROW_RIGHT, UNDERSCORE } from '@/components/sketch/marks';
import { groupLabel, type Project } from '@/content/projects';
import { linkProps } from '@/lib/links';
import { EASE } from '@/lib/motion';
import { projectAddresses } from './addresses';
import AddressPill from './components/AddressPill';
import Caption from './components/Caption';
import StudySection from './components/CaseStudySection';
import DemoModal from './components/DemoModal';
import DemoPlayButton from './components/DemoPlayButton';
import HeroSlider from './components/HeroSlider';
import MetaStrip from './components/MetaStrip';
import NeighbourCard from './components/NeighbourCard';
import ProjectGallery from './components/ProjectGallery';
import WhatItDoes from './components/WhatItDoes';
import { heroLayoutId } from './hero';
import { casePictures, counter } from './pictures';
import { useSlides } from './useSlides';

/** Every block after the first opens with the About page's hand-ruled line. */
const BLOCK = 'sk-rule pt-12';

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
  const heroFrameRef = useRef<HTMLDivElement>(null);
  const [demoOpen, setDemoOpen] = useState(false);

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
  // On the way out it fades quickly, so it does not sit over the grid while the frame shrinks back to the card.
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
          <button
            type="button"
            onClick={onBack}
            className="group inline-flex min-h-11 items-center gap-2 rounded-md text-base font-medium text-pencil transition-colors hover:text-ink focus-ring md:min-h-0"
          >
            <ArrowLeft size={17} className="shrink-0 transition-transform duration-300 group-hover:-translate-x-1" /> Back to Projects
          </button>
          {addresses.length > 0 || project.demoUrl ? (
            <div className="flex w-full flex-wrap items-center gap-2 sm:ml-auto sm:w-auto sm:flex-nowrap">
              {addresses.map((address) => (
                <AddressPill key={address.href} address={address} primary={address === primary} />
              ))}
              {/* The demo video sits with the addresses: it is the other way to see the project, short of using it. */}
              {project.demoUrl ? (
                <PillLink
                  as="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setDemoOpen(true)}
                  aria-haspopup="dialog"
                  className="min-h-11 whitespace-nowrap md:min-h-0"
                >
                  <Play size={14} className="shrink-0" fill="currentColor" /> Watch demo
                </PillLink>
              ) : null}
            </div>
          ) : null}
        </div>

        <p className="mb-3 flex items-center gap-2.5 text-sm font-semibold text-graphite">
          <span>{groupLabel(project.group)}</span>
          <span aria-hidden>/</span>
          <span className="text-pencil">{project.kind}</span>
        </p>
        <h1
          ref={titleRef}
          tabIndex={-1}
          className="mb-5 max-w-4xl origin-bottom-left -rotate-1 text-4xl font-medium leading-[1.1] text-ink outline-none sm:text-5xl lg:text-[3.4rem]"
        >
          {project.cardTitle}
        </h1>
        <p className="mb-8 max-w-3xl text-lg leading-relaxed text-pencil text-pretty md:mb-10 md:text-xl md:leading-relaxed">
          {caseStudy.summary}
        </p>
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
        // The demo's play button sits on the picture: the one thing on the page that says "watch".
        action={project.demoUrl ? <DemoPlayButton delay={arrowDelay} onClick={() => setDemoOpen(true)} /> : undefined}
        // While the demo is open the frame is off the page, flying as the dialog; with reduced motion it stays put.
        frameRef={heroFrameRef}
        lifted={demoOpen && !reduced}
        caption={
          // The right slot counts the pictures; the address pill at the top already names the host.
          <Caption
            index={slides.current + 1}
            text={hero.caption}
            right={many ? counter(slides.current, pictures.length) : undefined}
            live={many}
            className="mt-4 md:mt-5"
          />
        }
      />

      <motion.div {...rise} className="mt-8 md:mt-10">
        {/* Under the hero: the sketch's note pointing at the way out. */}
        <div className="mb-8 flex items-start justify-end gap-6">
          {primary ? (
            <a
              href={primary.href}
              {...linkProps(primary.href)}
              className="sk-note group hidden shrink-0 rounded-md pr-2 text-right focus-ring md:block -rotate-[9deg]"
            >
              {primary.kind === 'live' ? 'View' : 'Read'}
              <br />
              {primary.kind === 'live' ? 'Live Demo' : 'the code'}
              <Sketch
                drawing={ARROW_RIGHT}
                duration={0.4}
                delay={0.4}
                weight={1.3}
                className="ml-2 inline-block h-auto w-7 align-middle transition-transform duration-300 group-hover:translate-x-1"
              />
              <Sketch drawing={UNDERSCORE} duration={0.5} delay={0.2} weight={1.4} className="ml-auto mt-0.5 h-auto w-24" />
            </a>
          ) : null}
        </div>

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

      <DemoModal project={project} picture={hero} open={demoOpen} origin={heroFrameRef} onClose={() => setDemoOpen(false)} />
    </article>
  );
}
