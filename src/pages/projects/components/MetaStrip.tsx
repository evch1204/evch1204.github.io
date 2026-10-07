import Eyebrow from '@/components/Eyebrow';
import Tag from '@/components/Tag';
import { groupLabel, type Project } from '@/content/projects';

/** The details and the stack on one row, between two lines ruled by hand. */
export default function MetaStrip({ project }: { project: Project }) {
  // Kind and group are the project's own fields; the register lists them first, then content's rows.
  // Content writes its own labels, so a row keyed by label alone could collide with `Kind` or `Group`.
  const rows = [
    { key: 'kind', label: 'Kind', value: project.kind },
    { key: 'group', label: 'Group', value: groupLabel(project.group) },
    ...project.caseStudy.details.map((detail, i) => ({ key: `detail-${i}`, ...detail })),
  ];
  return (
    <>
      <dl className="sk-rule grid grid-cols-2 gap-x-8 gap-y-7 py-6 md:grid-cols-4 lg:grid-cols-[repeat(4,minmax(0,1fr))_minmax(0,2fr)]">
        {rows.map((row) => (
          <div key={row.key} className="min-w-0">
            <Eyebrow as="dt">{row.label}</Eyebrow>
            <dd className="mt-1.5 text-base font-semibold leading-snug text-ink [overflow-wrap:anywhere]">{row.value}</dd>
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
      <div className="sk-rule h-0" aria-hidden />
    </>
  );
}
