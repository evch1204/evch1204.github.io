import { motion, useReducedMotion } from 'motion/react';
import { MapPin } from 'lucide-react';
import type { Org } from '@/content/experience';
import { EASE } from '@/lib/motion';
import CompanyLogo from './CompanyLogo';
import RoleRow from './RoleRow';

/** The year an org's first (most recent) role started: "MM.YYYY — …" → "YYYY". */
function startYear(org: Org) {
  return /^\d{2}\.(\d{4})/.exec(org.roles[0]?.period ?? '')?.[1] ?? '';
}

/**
 * One organization: the header, and its positions strung on a rail beneath it.
 * The rail is drawn by the rows themselves (see RoleRow), so it needs no
 * measuring — it is just a line through the icons.
 */
export default function OrgGroup({
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
