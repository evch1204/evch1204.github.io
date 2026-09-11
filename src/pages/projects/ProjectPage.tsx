import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import Eyebrow from '@/components/Eyebrow';
import PillLink from '@/components/PillLink';
import Tag from '@/components/Tag';
import { groupLabel, type CaseStudy, type CaseStudySection, type Figure, type Project } from '@/content/projects';
import { projectAddresses, type ProjectAddress } from './addresses';
import ProjectFigure from './ProjectFigure';
import ProjectPanel, { HERO_TRANSITION, heroLayoutId } from './ProjectPanel';

const pad = (n: number) => String(n).padStart(2, '0');

const EASE = [0.23, 1, 0.32, 1] as const;

/** The About page's photo frame: white border, big radius, the soft shadow. Thinner and tighter on a phone. */
const FRAME =
  'overflow-hidden rounded-[1.25rem] border-4 border-white bg-white shadow-[0_16px_40px_rgba(0,0,0,0.12)] md:rounded-[2rem] md:border-[6px] md:shadow-[0_24px_64px_rgba(0,0,0,0.12)]';

/** Mono caption row under a picture: bold index, caption, and an optional right-hand note. */
const Caption = ({ index, text, right, className = '' }: { index: number; text: string; right?: string; className?: string }) => (
  <figcaption className={`flex justify-between gap-4 font-mono text-[10px] leading-relaxed text-zinc-400 md:text-[11px] ${className}`}>
    <span className="min-w-0">
      <b className="font-bold text-zinc-600">{pad(index)}</b>
      <span className="ml-2.5">{text}</span>
    </span>
    {right ? <span className="hidden shrink-0 md:inline">{right}</span> : null}
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
          <span className="w-[22px] shrink-0 pt-[3px] font-mono text-[11px] text-zinc-400">{pad(i + 1)}</span>
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

/** What a picture is, for keys and de-duplication: the image path, or the drawing's id. */
const pictureKey = (figure: Figure) => figure.src ?? figure.illustration;

/**
 * Every picture the case study shows, once each, in reading order: the hero,
 * the section figures, then whatever content lists only for the gallery.
 */
function galleryOf(caseStudy: CaseStudy): Figure[] {
  const seen = new Set<string>();
  const pictures: Figure[] = [];
  for (const figure of [caseStudy.hero, ...caseStudy.sections.flatMap((s) => (s.figure ? [s.figure] : [])), ...caseStudy.gallery]) {
    const key = pictureKey(figure);
    if (seen.has(key)) continue;
    seen.add(key);
    pictures.push(figure);
  }
  return pictures;
}

/** True when the gallery adds a picture the hero and the sections have not already shown. */
const hasExtraPictures = (caseStudy: CaseStudy) => {
  const shown = new Set([caseStudy.hero, ...caseStudy.sections.flatMap((s) => (s.figure ? [s.figure] : []))].map(pictureKey));
  return caseStudy.gallery.some((figure) => !shown.has(pictureKey(figure)));
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
      <span className="font-mono text-[11px] text-zinc-400">
        {pad(current + 1)} / {pad(pictures.length)}
      </span>
    </div>
    <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
      {pictures.map((picture, i) => {
        const active = i === current;
        return (
          <li key={pictureKey(picture)}>
            <figure>
              <button
                type="button"
                onClick={() => onPick(i)}
                aria-pressed={active}
                aria-label={`Show picture ${pad(i + 1)}: ${picture.caption}`}
                className={`block w-full overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_12px_32px_rgba(0,0,0,0.1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 ${
                  active ? 'ring-2 ring-zinc-900 ring-offset-2' : ''
                }`}
              >
                <div className="aspect-[16/10] w-full">
                  <ProjectFigure figure={picture} className="h-full w-full object-contain" />
                </div>
              </button>
              <Caption index={i + 1} text={picture.caption} className="mt-2.5" />
            </figure>
          </li>
        );
      })}
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
  const pictures = galleryOf(caseStudy);
  const showGallery = hasExtraPictures(caseStudy);
  const [current, setCurrent] = useState(0);
  const hero = pictures[current];
  const titleRef = useRef<HTMLHeadingElement>(null);
  const heroRef = useRef<HTMLElement>(null);

  // The page is the new thing on screen: the keyboard starts at its title.
  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true });
  }, []);

  const pick = (i: number) => {
    setCurrent(i);
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
  const heroFade = {
    initial: shared && arrival === 'grid' ? false : { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.35, ease: EASE } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  };

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

      {/*
       * Hero: from `md`, the photo frame on the card sill's zinc band, reaching
       * a little past the content edges — as far as the gutter allows until
       * the content is centred with room to spare. On a phone the frame takes
       * the full width on its own.
       */}
      <motion.figure
        ref={heroRef}
        {...heroFade}
        className="md:-mx-3 md:rounded-[2rem] md:border md:border-zinc-100 md:bg-zinc-50 md:px-8 md:pb-6 md:pt-8 lg:px-10 lg:pb-7 lg:pt-10 xl:-mx-8"
      >
        {/* The frame hugs the picture: a tall figure is capped in height and centred rather than letterboxed. */}
        <div className="flex justify-center">
          <motion.div
            layoutId={shared ? heroLayoutId(project.id) : undefined}
            layoutDependency={project.id}
            transition={{ layout: HERO_TRANSITION }}
            className={`max-w-full ${FRAME}`}
          >
            <ProjectFigure figure={hero} eager className="block h-auto max-h-[640px] w-auto max-w-full" />
          </motion.div>
        </div>
        <Caption index={current + 1} text={hero.caption} right={primary?.label} className="mt-3 md:mt-5" />
      </motion.figure>

      <motion.div {...rise} className="mt-10 md:mt-12">
        <MetaStrip project={project} />

        <div className="mt-12 flex flex-col gap-12">
          {blocks}
          <WhatItDoes items={project.keyFeatures} className={BLOCK} />
          {showGallery ? <Gallery pictures={pictures} current={current} onPick={pick} className={BLOCK} /> : null}

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
