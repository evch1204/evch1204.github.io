import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  ChevronsUpDown,
  Code2,
  Cpu,
  Database,
  GraduationCap,
  Headset,
  MapPin,
  School,
} from 'lucide-react';
import Tag from '@/components/Tag';
import type { Org, Role, RoleIcon } from '@/content/experience';
import { EASE } from '@/lib/motion';
import CompanyLogo from './CompanyLogo';

/** Shared easing + duration so height, fade and chevron travel as one motion. */
const ROW_EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';
const DURATION = 460;

const ROLE_ICONS: Record<RoleIcon, typeof Code2> = {
  code: Code2,
  ai: Cpu,
  data: Database,
  support: Headset,
  degree: GraduationCap,
  school: School,
};

/** The year an org's first (most recent) role started: "MM.YYYY — …" → "YYYY". */
function startYear(org: Org) {
  return /^\d{2}\.(\d{4})/.exec(org.roles[0]?.period ?? '')?.[1] ?? '';
}

/**
 * One position or degree: a header that is always visible, and a panel whose
 * height animates open. The panel stays mounted so there is something to
 * animate between — `inert` keeps its content out of the tab order when closed.
 * Closed, the header carries a one-line teaser (the first bullet) so the list
 * reads without opening anything; it folds away as the panel opens.
 *
 * The row's icon sits on the org's rail; the open row inks it. Each row draws
 * its own stretch of the rail, from its top edge (under the org mark, or the
 * row above) down through its icon to the next row — the last row stops at
 * its icon, so the line hangs from the mark to the final position and no
 * further.
 */
function RoleRow({ role, open, last, onToggle }: { role: Role; open: boolean; last: boolean; onToggle: () => void }) {
  const Icon = ROLE_ICONS[role.icon];
  const panelId = `role-panel-${role.id}`;
  const teaser = role.bullets[0];
  // Reduced motion: the row still opens and closes, just without the travel.
  const reduceMotion = useReducedMotion();
  const duration = reduceMotion ? 0 : DURATION;
  const timing = { transitionDuration: `${duration}ms`, transitionTimingFunction: ROW_EASE };
  const fade = (ms: number) => (reduceMotion ? 0 : ms);

  return (
    <div className="relative">
      <span className={`absolute left-[13px] top-0 w-0.5 bg-zinc-200 ${last ? 'h-[26px]' : 'bottom-0'}`} aria-hidden />
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="group relative flex w-full items-start gap-4 rounded-lg py-3 text-left cursor-pointer focus-ring focus-visible:ring-offset-4 focus-visible:ring-offset-page"
      >
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-colors ${
            open
              ? 'border-zinc-900 bg-zinc-900 text-white'
              : 'border-zinc-200 bg-zinc-50 text-zinc-500 group-hover:border-zinc-400 group-hover:text-zinc-900'
          }`}
          style={timing}
        >
          <Icon size={14} strokeWidth={2} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold tracking-[-0.015em] text-zinc-900 text-pretty">
            {role.title}
          </span>
          <span className="mt-1 block text-xs font-medium text-zinc-400">
            {role.kind}
            <span className="px-2 text-zinc-300" aria-hidden>
              |
            </span>
            <span className="font-mono text-[11px]">{role.period}</span>
          </span>
          {/* A visual preview of the first bullet, which the panel below already carries. */}
          {teaser ? (
            <span
              className="grid"
              style={{ gridTemplateRows: open ? '0fr' : '1fr', transition: `grid-template-rows ${duration}ms ${ROW_EASE}` }}
              aria-hidden
            >
              <span className="block min-h-0 overflow-hidden">
                <span
                  className="mt-1 line-clamp-1 text-[13px] font-medium leading-normal text-zinc-400"
                  style={{ opacity: open ? 0 : 1, transition: `opacity ${fade(open ? 200 : 300)}ms ease` }}
                >
                  {teaser}
                </span>
              </span>
            </span>
          ) : null}
        </span>
        <span
          className={`mt-1 flex shrink-0 items-center transition-[transform,color] group-hover:text-zinc-900 ${
            open ? 'text-zinc-900' : 'text-zinc-400'
          }`}
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', ...timing }}
          aria-hidden
        >
          <ChevronsUpDown size={15} />
        </span>
      </button>

      <div
        id={panelId}
        className="grid"
        style={{ gridTemplateRows: open ? '1fr' : '0fr', transition: `grid-template-rows ${duration}ms ${ROW_EASE}` }}
        {...(open ? {} : { inert: true })}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className="pb-5 pl-11 pt-0.5"
            style={{
              opacity: open ? 1 : 0,
              transform: open ? 'translateY(0)' : 'translateY(-6px)',
              transition: `opacity ${fade(300)}ms ease, transform ${fade(300)}ms ${ROW_EASE}`,
              // Content waits for the height to get going, but leaves immediately.
              transitionDelay: open ? `${fade(120)}ms` : '0ms',
            }}
          >
            <ul className="flex flex-col gap-2">
              {role.bullets.map((bullet) => (
                <li key={bullet} className="flex gap-2.5 text-[13.5px] font-medium leading-[1.65] text-zinc-500 text-pretty">
                  <span className="shrink-0 text-zinc-300" aria-hidden>
                    •
                  </span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
            {role.tags.length > 0 ? (
              <ul className="mt-4 flex flex-wrap gap-[7px]">
                {role.tags.map((tag) => (
                  <li key={tag}>
                    <Tag>{tag}</Tag>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * One organization: the header, and its positions strung on a rail beneath it.
 * The rail is drawn by the rows themselves (see RoleRow), so it needs no
 * measuring — it is just a line through the icons.
 */
function OrgGroup({
  org,
  index,
  openIds,
  onToggle,
}: {
  org: Org;
  index: number;
  openIds: Set<string>;
  onToggle: (id: string) => void;
}) {
  const reduceMotion = useReducedMotion();
  const first = index === 0;
  const year = startYear(org);

  return (
    <motion.div
      className="sm:grid sm:grid-cols-[44px_minmax(0,1fr)] sm:gap-x-5"
      {...(reduceMotion
        ? {}
        : {
            initial: { opacity: 0, y: 18 },
            whileInView: { opacity: 1, y: 0 },
            viewport: { once: true, margin: '-10% 0px' },
            transition: { duration: 0.7, ease: EASE, delay: index * 0.08 },
          })}
    >
      {/* Year gutter: holds beside the group while it scrolls past. Hidden on phones. */}
      <div className={`hidden sm:block ${first ? 'pt-2.5' : 'pt-[34px]'}`} aria-hidden>
        <span className="sticky top-28 block text-right font-mono text-[11px] font-bold leading-4 text-zinc-400">
          {year}
        </span>
      </div>

      <div className={`min-w-0 ${first ? '' : 'border-t border-zinc-100 pt-6'} pb-6`}>
        {/* Wraps on narrow screens: the location drops under the name, indented to
            line up with it, instead of squeezing the org name to nothing. */}
        <div className="mb-1 flex flex-wrap items-center gap-3">
          <CompanyLogo domain={org.logoDomain} company={org.name} size={36} />
          <h3 className="text-[17px] font-bold tracking-[-0.025em] text-zinc-900">{org.name}</h3>
          {org.current ? (
            <span
              className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-900"
              title="Current"
            >
              <span className="block h-[7px] w-[7px] rounded-full bg-zinc-900" aria-hidden />
              Now
            </span>
          ) : null}
          {org.location ? (
            <span className="flex basis-full items-center gap-1 pl-12 text-[11px] font-medium text-zinc-400 sm:ml-auto sm:basis-auto sm:pl-0">
              <MapPin size={11} aria-hidden />
              {org.location}
            </span>
          ) : null}
        </div>

        {/* Rows indented so their icons sit centred under the org mark. */}
        <div className="ml-1 flex flex-col">
          {org.roles.map((role, i) => (
            <RoleRow
              key={role.id}
              role={role}
              open={openIds.has(role.id)}
              last={i === org.roles.length - 1}
              onToggle={() => onToggle(role.id)}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function ExperienceList({ orgs }: { orgs: Org[] }) {
  /** The most recent position opens by default, so the list never lands fully collapsed. */
  const [openIds, setOpenIds] = useState<Set<string>>(() => {
    const first = orgs[0]?.roles[0]?.id;
    return new Set(first ? [first] : []);
  });

  const toggle = (id: string) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // From `sm` the year column hangs left of the content column's edge, into
  // the space the page reserves for it (see ExperiencePage).
  return (
    <div className="sm:-ml-16">
      {orgs.map((org, index) => (
        <OrgGroup key={org.id} org={org} index={index} openIds={openIds} onToggle={toggle} />
      ))}
    </div>
  );
}
