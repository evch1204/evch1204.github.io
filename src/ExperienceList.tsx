import { useState, type ReactNode } from 'react';
import { ChevronsUpDown, Code2, Cpu, Database, GraduationCap, Headset, School } from 'lucide-react';
import type { Org, Role, RoleIcon } from './experienceData';
import { defaultOpenRoleId } from './experienceData';

/** Shared easing + duration so height, fade and chevron travel as one motion. */
const EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';
const DURATION = 460;

const ROLE_ICONS: Record<RoleIcon, typeof Code2> = {
  code: Code2,
  ai: Cpu,
  data: Database,
  support: Headset,
  degree: GraduationCap,
  school: School,
};

/**
 * One position or degree: a header that is always visible, and a panel whose
 * height animates open. The panel stays mounted so there is something to
 * animate between — `inert` keeps its content out of the tab order when closed.
 */
function RoleRow({ role, open, onToggle }: { role: Role; open: boolean; onToggle: () => void }) {
  const Icon = ROLE_ICONS[role.icon];
  const panelId = `role-panel-${role.id}`;

  return (
    <div
      className="rounded-2xl transition-colors"
      style={{ backgroundColor: open ? '#ffffff' : 'rgba(255,255,255,0)', transitionDuration: `${DURATION}ms`, transitionTimingFunction: EASE }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="group flex w-full items-start gap-3 rounded-2xl px-3.5 py-3 text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
      >
        <span className="mt-px flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-500 transition-colors group-hover:border-zinc-300 group-hover:text-zinc-900">
          <Icon size={13} strokeWidth={2} aria-hidden />
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
        </span>
        <span
          className="mt-1 flex shrink-0 items-center text-zinc-400 transition-transform group-hover:text-zinc-900"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transitionDuration: `${DURATION}ms`, transitionTimingFunction: EASE }}
          aria-hidden
        >
          <ChevronsUpDown size={15} />
        </span>
      </button>

      <div
        id={panelId}
        className="grid"
        style={{ gridTemplateRows: open ? '1fr' : '0fr', transition: `grid-template-rows ${DURATION}ms ${EASE}` }}
        {...(open ? {} : { inert: true })}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className="pb-4 pl-10 sm:pl-[52px] pr-3.5 pt-0.5"
            style={{
              opacity: open ? 1 : 0,
              transform: open ? 'translateY(0)' : 'translateY(-6px)',
              transition: `opacity 300ms ease, transform 300ms ${EASE}`,
              // Content waits for the height to get going, but leaves immediately.
              transitionDelay: open ? '120ms' : '0ms',
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
                    <span className="inline-block rounded-full bg-zinc-100 px-[11px] py-[5px] text-[10px] font-bold uppercase leading-none tracking-wider text-zinc-500">
                      {tag}
                    </span>
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

function OrgGroup({
  org,
  first,
  openIds,
  onToggle,
  renderLogo,
}: {
  org: Org;
  first: boolean;
  openIds: Set<string>;
  onToggle: (id: string) => void;
  renderLogo: (org: Org) => ReactNode;
}) {
  return (
    <div className={first ? 'pb-6' : 'border-t border-zinc-100 py-6'}>
      {/* Wraps on narrow screens: the location drops under the name, indented to
          line up with it, instead of squeezing the org name to nothing. */}
      <div className="mb-2.5 flex flex-wrap items-center gap-3 pl-0.5">
        {renderLogo(org)}
        <h3 className="text-[17px] font-bold tracking-[-0.025em] text-zinc-900">{org.name}</h3>
        {org.current ? (
          <span className="block h-[7px] w-[7px] rounded-full bg-zinc-900" title="Current" aria-label="Current" />
        ) : null}
        {org.location ? (
          <span className="basis-full pl-[46px] text-[11px] font-medium text-zinc-400 sm:ml-auto sm:basis-auto sm:pl-0">
            {org.location}
          </span>
        ) : null}
      </div>
      {/* Rail tying a company's positions together. */}
      <div className="ml-3 border-l border-zinc-100 pl-3 sm:ml-4 sm:pl-[17px]">
        {org.roles.map((role) => (
          <RoleRow key={role.id} role={role} open={openIds.has(role.id)} onToggle={() => onToggle(role.id)} />
        ))}
      </div>
    </div>
  );
}

export default function ExperienceList({
  orgs,
  renderLogo,
}: {
  orgs: Org[];
  renderLogo: (org: Org) => ReactNode;
}) {
  const [openIds, setOpenIds] = useState<Set<string>>(() => {
    const first = defaultOpenRoleId(orgs);
    return new Set(first ? [first] : []);
  });

  const toggle = (id: string) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div>
      {orgs.map((org, i) => (
        <OrgGroup
          key={org.id}
          org={org}
          first={i === 0}
          openIds={openIds}
          onToggle={toggle}
          renderLogo={renderLogo}
        />
      ))}
    </div>
  );
}
