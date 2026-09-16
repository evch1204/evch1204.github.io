import Eyebrow from '@/components/Eyebrow';
import Tag from '@/components/Tag';
import { groupLabel, type Project } from '@/content/projects';

/** Dates and addresses read in mono; everything else in the text face. */
const isMono = (value: string) => /^\d{4}\b/.test(value) || /^https?:/.test(value);

/** The details and the stack on one hairline-bounded row: what used to be the right column. */
export default function MetaStrip({ project }: { project: Project }) {
  // Kind and group are the project's own fields; the register lists them first, then content's rows.
  // Content writes its own labels, so a row keyed by label alone could collide with `Kind` or `Group`.
  const rows = [
    { key: 'kind', label: 'Kind', value: project.kind },
    { key: 'group', label: 'Group', value: groupLabel(project.group) },
    ...project.caseStudy.details.map((detail, i) => ({ key: `detail-${i}`, ...detail })),
  ];
  return (
    <dl className="grid grid-cols-2 gap-x-8 gap-y-7 border-y border-zinc-100 py-6 md:grid-cols-4 lg:grid-cols-[repeat(4,minmax(0,1fr))_minmax(0,2fr)]">
      {rows.map((row) => (
        <div key={row.key} className="min-w-0">
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
}
