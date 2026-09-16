import { useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import Eyebrow from '@/components/Eyebrow';
import PillLink from '@/components/PillLink';
import Tag from '@/components/Tag';
import { groupLabel, type CaseStudySection, type Figure, type Project } from '@/content/projects';
import { pad2 } from '@/lib/format';
import { EASE } from '@/lib/motion';
import { projectAddresses, type ProjectAddress } from './addresses';
import Thumb from './components/Thumb';
import { FRAME, heroLayoutId } from './hero';
import { casePictures, counter, pictureKey } from './pictures';
import ProjectFigure from './ProjectFigure';
import HeroSlider from './HeroSlider';
import ProjectPanel from './ProjectPanel';
import { useSlides } from './useSlides';

/**
 * Mono caption row under a picture: bold index, caption, and an optional
 * right-hand note. `live` has a screen reader read the row again whenever it
 * changes — the slider's caption is what says which picture arrived.
 */
const Caption = ({
  index,
  text,
  right,
  live = false,
  className = '',
}: {
  index: number;
  text: string;
  right?: string;
  live?: boolean;
  className?: string;
}) => (
  <figcaption
    aria-live={live ? 'polite' : undefined}
    className={`flex justify-between gap-4 font-mono text-[10px] leading-relaxed text-zinc-400 md:text-[11px] ${className}`}
  >
    <span className="min-w-0">
      <b className="font-bold text-zinc-600">{pad2(index)}</b>
      <span className="ml-2.5">{text}</span>
    </span>
    {right ? <span className="shrink-0">{right}</span> : null}
  </figcaption>
);

/** Every block after the first opens with the About page's hairline. */
const BLOCK = 'border-t border-zinc-100 pt-12';

const Prose = ({ section }: { section: CaseStudySection }) => (
  <>
    <Eyebrow as="h3" className="mb-4">
      {section.heading}
    </Eyebrow>
    <div className="space-y-4 text-base leading-relaxed text-zinc-600 text-pretty">
      {section.body.map((paragraph, i) => (
        // Static content: the index is the paragraph's identity.
        <p key={i}>{paragraph}</p>
      ))}
    </div>
  </>
);

/**
 * A section of the narrative. Without a figure it is prose at a reading
 * measure; with one it is a two-column band from `lg`, the figure on the side
 * `flip` says, and prose over figure below that.
 */
const StudySection = ({ section, flip, className }: { section: CaseStudySection; flip: boolean; className: string }) => {
  if (!section.figure) {
    return (
      <section className={`${className} max-w-[68ch]`}>
        <Prose section={section} />
      </section>
    );
  }
  const columns = flip
    ? 'lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]'
    : 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]';
  return (
    <section className={`${className} grid gap-8 lg:items-center lg:gap-14 ${columns}`}>
      <div className={`min-w-0 max-w-[68ch] ${flip ? 'lg:order-2' : ''}`}>
        <Prose section={section} />
      </div>
      <figure className={`min-w-0 ${flip ? 'lg:order-1' : ''}`}>
        {/* Eager: a lazy figure has no height until it loads, and the page would jump under the reader. */}
        <div className={FRAME}>
          <ProjectFigure figure={section.figure} eager className="block h-auto w-full" />
        </div>
        <figcaption className="mt-3 font-mono text-[10px] leading-relaxed text-zinc-400 md:text-[11px]">
          {section.figure.caption}
        </figcaption>
      </figure>
    </section>
  );
};

const WhatItDoes = ({ items, className }: { items: string[]; className: string }) => (
  <section className={className}>
    <Eyebrow as="h3" className="mb-4">
      What it does
    </Eyebrow>
    {/* The list's own top rule spans both columns; each row closes with its own. */}
    <ol className="border-t border-zinc-100 lg:columns-2 lg:gap-12">
      {items.map((item, i) => (
        <li
          key={item}
          className="flex gap-4 border-b border-zinc-100 py-3.5 text-sm font-medium leading-relaxed text-zinc-600 text-pretty break-inside-avoid"
        >
          <span className="w-[22px] shrink-0 pt-[3px] font-mono text-[11px] text-zinc-400">{pad2(i + 1)}</span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  </section>
);

/** Dates and addresses read in mono; everything else in the text face. */
const isMono = (value: string) => /^\d{4}\b/.test(value) || /^https?:/.test(value);

/** The details and the stack on one hairline-bounded row: what used to be the right column. */
const MetaStrip = ({ project }: { project: Project }) => {
  // Kind and group are the project's own fields; the register lists them first, then content's rows.
  const rows = [
    { label: 'Kind', value: project.kind },
    { label: 'Group', value: groupLabel(project.group) },
    ...project.caseStudy.details,
  ];
  return (
    <dl className="grid grid-cols-2 gap-x-8 gap-y-7 border-y border-zinc-100 py-6 md:grid-cols-4 lg:grid-cols-[repeat(4,minmax(0,1fr))_minmax(0,2fr)]">
      {rows.map((row) => (
        <div key={row.label} className="min-w-0">
          <Eyebrow as="dt">{row.label}</Eyebrow>
          <dd className={`mt-2 text-sm font-semibold leading-snug text-zinc-900 [overflow-wrap:anywhere]${isMono(row.value) ? ' font-mono' : ''}`}>
            {row.value}
          </dd>
        </div>
      ))}
      {/* The last, wide cell: on `md` the stack takes its own row; on a phone, both columns. */}
      <div className="col-span-2 min-w-0 md:col-span-4 lg:col-span-1 lg:col-start-5">
        <Eyebrow as="dt">Stack</Eyebrow>
        <dd className="mt-2.5">
          <ul className="flex flex-wrap gap-2">
            {project.technologies.map((t) => (
              <li key={t}>
                <Tag variant="detail">{t}</Tag>
              </li>
            ))}
          </ul>
        </dd>
      </div>
    </dl>
  );
};

const Gallery = ({
  pictures,
  current,
  onPick,
  className,
}: {
  pictures: Figure[];
  current: number;
  onPick: (i: number) => void;
  className: string;
}) => (
  <section className={className}>
    <div className="mb-4 flex items-baseline justify-between">
      <Eyebrow as="h3">Gallery</Eyebrow>
      <span className="font-mono text-[11px] text-zinc-400">{counter(current, pictures.length)}</span>
    </div>
    {/* Four tiles sit as two rows of two; every other count reads better in threes than with an orphan. */}
    <ul
      className={`grid grid-cols-1 gap-5 sm:grid-cols-2 md:gap-6 ${pictures.length === 4 ? 'lg:grid-cols-2' : 'lg:grid-cols-3'}`}
    >
      {pictures.map((picture, i) => (
        <li key={pictureKey(picture)}>
          <figure>
            <Thumb
              picture={picture}
              index={i}
              active={i === current}
              onPick={onPick}
              className="w-full rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_12px_32px_rgba(0,0,0,0.1)]"
            />
            <Caption index={i + 1} text={picture.caption} className="mt-2.5" />
          </figure>
        </li>
      ))}
    </ul>
  </section>
);

/** An outline card for the project before or after this one: eyebrow, title, kind, and its own window. */
const NeighbourCard = ({
  direction,
  project,
  onSelect,
  className = '',
}: {
  direction: 'previous' | 'next';
  project: Project;
  onSelect: (project: Project) => void;
  className?: string;
}) => (
  <button
    type="button"
    onClick={() => onSelect(project)}
    className={`group flex w-full flex-col rounded-[1.5rem] border border-zinc-200 bg-white p-5 text-left transition-colors hover:border-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 sm:rounded-[2rem] sm:p-6 ${className}`}
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

/** The pills at the top: the primary address solid, the rest outline; a repo-only project's one pill is its repo. */
const AddressPill = ({ address, primary }: { address: ProjectAddress; primary: boolean }) => (
  <PillLink
    size="sm"
    variant={primary ? 'solid' : 'outline'}
    href={address.href}
    className={`min-h-11 min-w-0 whitespace-nowrap md:min-h-0${primary ? ' w-full sm:w-auto' : ''}`}
  >
    <address.Icon size={14} className="shrink-0" />
    <span className="min-w-0 truncate">
      {address.kind === 'live' ? `Open ${address.label}` : primary ? 'View on GitHub' : 'GitHub'}
    </span>
  </PillLink>
);

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
          {showGallery ? <Gallery pictures={pictures} current={slides.current} onPick={jumpTo} className={BLOCK} /> : null}

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
