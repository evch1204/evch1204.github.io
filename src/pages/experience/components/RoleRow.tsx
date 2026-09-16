import { useReducedMotion } from 'motion/react';
import { ChevronsUpDown, Code2, Cpu, Database, GraduationCap, Headset, School } from 'lucide-react';
import Tag from '@/components/Tag';
import type { Role, RoleIcon } from '@/content/experience';

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
export default function RoleRow({ role, open, last, onToggle }: { role: Role; open: boolean; last: boolean; onToggle: () => void }) {
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
