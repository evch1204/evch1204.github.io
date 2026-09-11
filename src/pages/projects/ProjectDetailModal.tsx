import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ChevronDown, ExternalLink, Github, X } from 'lucide-react';
import { motion } from 'motion/react';
import Modal from '@/components/Modal';
import PillLink from '@/components/PillLink';
import Tag from '@/components/Tag';
import { groupLabel, type CaseStudySection, type Figure, type Project } from '@/content/projects';
import { linkProps } from '@/lib/links';
import { hostLabel, repoLabel } from '@/lib/url';
import ProjectFigure from './ProjectFigure';

const TITLE_ID = 'project-modal-title';

const pad = (n: number) => String(n).padStart(2, '0');

/** The small uppercase label that opens every block of the case study. */
const Label = ({ children, className = 'mb-3' }: { children: string; className?: string }) => (
  <p className={`text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 ${className}`}>{children}</p>
);

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

/** The About page's photo frame, on a case-study picture. */
const FRAME =
  'overflow-hidden rounded-[14px] border-4 border-white bg-white shadow-[0_16px_40px_rgba(0,0,0,0.12)] md:rounded-[20px] md:border-[6px] md:shadow-[0_24px_64px_rgba(0,0,0,0.12)]';

const Section = ({ section }: { section: CaseStudySection }) => (
  <section>
    <Label>{section.heading}</Label>
    <div className="space-y-3">
      {section.body.map((paragraph) => (
        <p key={paragraph.slice(0, 40)} className="text-sm font-medium leading-relaxed text-zinc-600 text-pretty">
          {paragraph}
        </p>
      ))}
    </div>
    {section.figure ? (
      <figure className="mt-5">
        {/* Eager: a lazy figure has no height until it loads, and the page would jump under the reader. */}
        <div className={FRAME}>
          <ProjectFigure figure={section.figure} eager className="block h-auto w-full" />
        </div>
        <figcaption className="mt-2.5 font-mono text-[10px] leading-relaxed text-zinc-400 md:text-[11px]">
          {section.figure.caption}
        </figcaption>
      </figure>
    ) : null}
  </section>
);

const WhatItDoes = ({ items }: { items: string[] }) => (
  <div>
    <Label>What it does</Label>
    <ol>
      {items.map((item, i) => (
        <li
          key={item}
          className="flex gap-4 border-t border-zinc-100 py-3 text-sm font-medium leading-relaxed text-zinc-600 last:border-b text-pretty"
        >
          <span className="w-[22px] shrink-0 pt-[3px] font-mono text-[11px] text-zinc-400">{pad(i + 1)}</span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  </div>
);

const Details = ({ rows }: { rows: Project['caseStudy']['details'] }) => (
  <div>
    <Label>Details</Label>
    <dl>
      {rows.map((row) => (
        <div key={row.label} className="flex items-start justify-between gap-4 border-t border-zinc-100 py-2.5 last:border-b">
          <dt className="shrink-0 pt-[3px] text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">{row.label}</dt>
          <dd className="min-w-0 text-right font-mono text-xs font-bold leading-relaxed text-zinc-900 [overflow-wrap:anywhere]">
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  </div>
);

const Stack = ({ items }: { items: string[] }) => (
  <div>
    <Label>Stack</Label>
    <ul className="flex flex-wrap gap-2">
      {items.map((t) => (
        <li key={t}>
          <Tag variant="detail">{t}</Tag>
        </li>
      ))}
    </ul>
  </div>
);

/** The About page's contact chip, pointed at the project's addresses. */
const Links = ({ links }: { links: Project['caseStudy']['links'] }) => (
  <div>
    <Label>Links</Label>
    <ul className="flex flex-wrap gap-2">
      {links.map((link) => {
        const Icon = link.kind === 'repo' ? Github : ExternalLink;
        return (
          <li key={link.href} className="min-w-0 max-w-full">
            <a
              href={link.href}
              {...linkProps(link.href)}
              className="inline-flex max-w-full items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 font-mono text-xs font-bold text-zinc-600 transition-colors hover:border-zinc-900 hover:text-zinc-900"
            >
              <Icon size={14} className="shrink-0" />
              <span className="truncate">{link.label}</span>
            </a>
          </li>
        );
      })}
    </ul>
  </div>
);

const Gallery = ({
  pictures,
  current,
  onPick,
}: {
  pictures: Figure[];
  current: number;
  onPick: (i: number) => void;
}) => (
  <div>
    <div className="mb-3 flex items-baseline justify-between">
      <Label className="">Gallery</Label>
      <span className="font-mono text-[11px] text-zinc-400">
        {pad(current + 1)} / {pad(pictures.length)}
      </span>
    </div>
    <ul className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3">
      {pictures.map((picture, i) => {
        const active = i === current;
        return (
          <li key={picture.src ?? picture.illustration}>
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
            <Caption index={i + 1} text={picture.caption} className="mt-2" />
          </li>
        );
      })}
    </ul>
  </div>
);

/* `max-w-full`: a grid item placed at a column edge is not stretched, so without it a long title would overflow the column. */
const NAV_BUTTON =
  'inline-flex min-h-11 min-w-0 max-w-full items-center gap-2 text-sm font-bold text-zinc-900 transition-colors hover:text-black';

/** "← Prev: X" and "Next: Y →". Each keeps its own side of the row whether or not the other exists. */
const PrevNext = ({
  prev,
  next,
  onSelect,
  className,
}: {
  prev: Project | null;
  next: Project | null;
  onSelect: (project: Project) => void;
  className: string;
}) => (
  <div className={className}>
    {prev ? (
      <button type="button" onClick={() => onSelect(prev)} className={`${NAV_BUTTON} col-start-1 justify-self-start`}>
        <ArrowLeft size={16} className="shrink-0" />
        <span className="truncate">
          <span className="text-zinc-400">Prev:</span> {prev.cardTitle}
        </span>
      </button>
    ) : null}
    {next ? (
      <button type="button" onClick={() => onSelect(next)} className={`${NAV_BUTTON} col-start-2 justify-self-end`}>
        <span className="truncate">
          <span className="text-zinc-400">Next:</span> {next.cardTitle}
        </span>
        <ArrowRight size={16} className="shrink-0" />
      </button>
    ) : null}
  </div>
);

/** Everything below the toolbar. Keyed by project, so the gallery choice resets on navigation. */
function CaseStudyBody({
  project,
  index,
  total,
  prev,
  next,
  onClose,
  onSelect,
}: {
  project: Project;
  index: number;
  total: number;
  prev: Project | null;
  next: Project | null;
  onClose: () => void;
  onSelect: (project: Project) => void;
}) {
  const { caseStudy } = project;
  const pictures = [caseStudy.hero, ...caseStudy.gallery];
  const [current, setCurrent] = useState(0);
  const hero = pictures[current];
  const address = project.liveUrl
    ? hostLabel(project.liveUrl)
    : project.githubUrl
      ? repoLabel(project.githubUrl)
      : undefined;
  const group = groupLabel(project.group);
  const nav = { prev, next, onSelect };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
      {/* Hero band */}
      <div className="border-b border-zinc-100 bg-[#FAFAFA] px-4 pb-3.5 pt-4 md:px-10 md:pb-6 md:pt-8">
        <figure>
          {/* The frame hugs the picture: a tall figure is capped in height and centred rather than letterboxed. */}
          <div className="flex justify-center">
            <div className={`max-w-full ${FRAME}`}>
              <ProjectFigure figure={hero} eager className="block h-auto max-h-[520px] w-auto max-w-full" />
            </div>
          </div>
          <Caption index={current + 1} text={hero.caption} right={address} className="mt-2.5 md:mt-3.5" />
        </figure>
      </div>

      {/* Body */}
      {/* `grid-cols-1` is minmax(0, 1fr): an auto column would grow to fit the longest link chip. */}
      <div className="grid grid-cols-1 gap-8 px-5 pb-6 pt-6 md:grid-cols-[minmax(0,1fr)_264px] md:gap-14 md:px-10 md:pb-10 md:pt-9">
        <div className="min-w-0">
          <h2
            id={TITLE_ID}
            className="mb-3 text-[26px] font-bold leading-[1.1] tracking-[-0.03em] text-zinc-900 md:mb-3.5 md:text-[32px]"
          >
            {project.cardTitle}
          </h2>
          <p className="mb-7 text-[15px] font-medium leading-[1.65] text-zinc-600 text-pretty md:mb-8 md:text-base md:leading-[1.7]">
            {caseStudy.summary}
          </p>
          <div className="space-y-7">
            {caseStudy.sections.map((section) => (
              <Section key={section.heading} section={section} />
            ))}
            <WhatItDoes items={project.keyFeatures} />
          </div>
        </div>
        <div className="flex flex-col gap-7">
          <Details rows={caseStudy.details} />
          <Stack items={project.technologies} />
          <Links links={caseStudy.links} />
        </div>
      </div>

      {pictures.length > 1 ? (
        <div className="border-t border-zinc-100 px-5 pb-6 pt-6 md:px-10 md:pb-9">
          <Gallery pictures={pictures} current={current} onPick={setCurrent} />
        </div>
      ) : null}

      {/* Footer, desktop: index, Close, Prev / Next */}
      <div className="hidden items-center gap-4 border-t border-zinc-100 bg-white px-7 py-4 md:flex">
        <span className="font-mono text-[11px] text-zinc-400">
          {pad(index + 1)} / {pad(total)} &nbsp;·&nbsp; {group}
        </span>
        <div className="ml-auto flex items-center gap-5">
          <PillLink as="button" variant="outline" size="sm" onClick={onClose}>
            Close
          </PillLink>
          <PrevNext {...nav} className="flex items-center gap-5" />
        </div>
      </div>

      {/* Phone: prev / next row, then the sticky action bar above the tab bar */}
      <div className="border-t border-zinc-100 px-5 py-2 md:hidden">
        <p className="mb-1 font-mono text-[10px] text-zinc-400">
          {pad(index + 1)} / {pad(total)} &nbsp;·&nbsp; {group}
        </p>
        <PrevNext {...nav} className="grid grid-cols-2 items-center gap-3" />
      </div>
      <div className="sticky bottom-0 flex gap-2 border-t border-zinc-100 bg-white/90 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur md:hidden">
        <PillLink as="button" variant="outline" onClick={onClose} className="shrink-0">
          Close
        </PillLink>
        {project.liveUrl ? (
          <PillLink href={project.liveUrl} className="min-w-0 flex-1">
            <ExternalLink size={16} className="shrink-0" />
            <span className="truncate">Open {hostLabel(project.liveUrl)}</span>
          </PillLink>
        ) : project.githubUrl ? (
          <PillLink href={project.githubUrl} className="min-w-0 flex-1">
            <Github size={16} className="shrink-0" />
            View on GitHub
          </PillLink>
        ) : null}
      </div>
    </motion.div>
  );
}

/**
 * The case study. On desktop it is the site's dialog frame, scrolled as one
 * page; below `md` it becomes a full-height sheet with a sticky action bar,
 * sitting above the tab bar. ← / → move between projects; Escape closes.
 */
export default function ProjectDetailModal({
  project,
  projects,
  onClose,
  onSelect,
}: {
  project: Project | null;
  /** Every project, in prev / next order. */
  projects: Project[];
  onClose: () => void;
  onSelect: (project: Project) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const index = project ? projects.indexOf(project) : -1;
  const prev = index > 0 ? projects[index - 1] : null;
  const next = index >= 0 && index < projects.length - 1 ? projects[index + 1] : null;

  useEffect(() => {
    if (!project) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && next) onSelect(next);
      if (e.key === 'ArrowLeft' && prev) onSelect(prev);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [project, prev, next, onSelect]);

  /*
   * Moving to another project keeps the dialog mounted, so it is this
   * component's job to start the new one at the top with focus on the panel.
   * Which element scrolls depends on the layout: the panel itself on phones,
   * the overlay around it on desktop.
   */
  useEffect(() => {
    if (!project) return;
    const panel = rootRef.current?.closest<HTMLElement>('[role="dialog"]');
    if (!panel) return;
    panel.scrollTop = 0;
    if (panel.parentElement) panel.parentElement.scrollTop = 0;
    panel.focus({ preventScroll: true });
  }, [project]);

  return (
    <Modal
      open={project !== null}
      onClose={onClose}
      overlayClassName="fixed inset-0 z-[100] md:flex md:items-start md:justify-center md:overflow-y-auto md:p-4 md:pt-24 md:pb-12"
      backdropClassName="bg-black/45 backdrop-blur-[1px]"
      backdropLabel="Close project details"
      labelledBy={TITLE_ID}
      panelClassName="fixed inset-x-0 bottom-0 top-3 z-[102] overflow-y-auto overscroll-contain rounded-t-[1.5rem] border border-zinc-100 bg-white shadow-[0_-16px_48px_rgba(0,0,0,0.12)] focus:outline-none md:relative md:inset-auto md:my-auto md:w-full md:max-w-4xl md:overflow-visible md:rounded-[2rem] md:shadow-[0_32px_64px_rgba(0,0,0,0.12)]"
    >
      {project ? (
        <div ref={rootRef} className="md:overflow-hidden md:rounded-[2rem]">
          {/* Toolbar */}
          <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-zinc-100 bg-white/95 py-2 pl-2 pr-2 backdrop-blur md:static md:gap-3 md:py-3.5 md:pl-7 md:pr-4">
            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 md:hidden"
              aria-label="Close"
            >
              <ChevronDown size={22} />
            </button>
            <p className="flex min-w-0 items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400 md:gap-2.5 md:text-xs">
              <span className="truncate">{groupLabel(project.group)}</span>
              <span className="text-zinc-300">/</span>
              <span className="shrink-0 text-zinc-600">{project.kind}</span>
            </p>
            {/* The pills never wrap; the eyebrow's group name truncates instead when the row is tight. */}
            <div className="ml-auto hidden shrink-0 items-center gap-2 md:flex">
              {project.liveUrl ? (
                <PillLink size="sm" href={project.liveUrl} className="whitespace-nowrap">
                  <ExternalLink size={14} /> Open {hostLabel(project.liveUrl)}
                </PillLink>
              ) : null}
              {project.githubUrl ? (
                <PillLink size="sm" variant="outline" href={project.githubUrl} className="whitespace-nowrap">
                  <Github size={14} /> GitHub
                </PillLink>
              ) : null}
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <CaseStudyBody
            key={project.id}
            project={project}
            index={index}
            total={projects.length}
            prev={prev}
            next={next}
            onClose={onClose}
            onSelect={onSelect}
          />
        </div>
      ) : null}
    </Modal>
  );
}
