import { useState } from 'react';
import type { Org } from '@/content/experience';
import OrgGroup from './OrgGroup';

/** Every organization in one list, with one open-row set shared across them. */
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
