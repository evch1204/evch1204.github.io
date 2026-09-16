import { ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';
import Eyebrow from '@/components/Eyebrow';
import { linkProps } from '@/lib/links';
import { EASE } from '@/lib/motion';
import CopyButton from './CopyButton';

/**
 * A row of the register: its label, what it says, and where it goes. An
 * address reads in mono; a `note` is the mono aside after it, in the home
 * screen's `// comment` voice. `copy` is what the row's Copy button puts on
 * the clipboard.
 */
export type Row = {
  label: string;
  value: string;
  note?: string;
  href?: string;
  copy?: string;
  mono?: boolean;
};

/** The row's value: a link that opens elsewhere carries the arrow; a plain fact is just the words. */
function Value({ row }: { row: Row }) {
  const text = `text-sm font-semibold leading-snug text-zinc-900 [overflow-wrap:anywhere]${row.mono ? ' font-mono' : ''}`;
  const note = row.note ? <span className="ml-2.5 font-mono text-[11px] text-zinc-400">{row.note}</span> : null;
  if (!row.href) {
    return (
      <>
        <span className={text}>{row.value}</span>
        {note}
      </>
    );
  }
  return (
    <>
      <a
        href={row.href}
        {...linkProps(row.href)}
        className={`group inline-flex max-w-full items-center gap-1.5 rounded-sm focus-ring ${text}`}
      >
        <span className="min-w-0">{row.value}</span>
        <ArrowUpRight size={14} className="shrink-0 text-zinc-400 transition-colors group-hover:text-zinc-900" aria-hidden />
      </a>
      {note}
    </>
  );
}

/**
 * The addresses as a hairline-bounded register, the meta strip's idiom: label
 * on the left, value beside it, the row's one action on the right. On a phone
 * the label sits over the value and the action spans both lines.
 */
export default function Register({ rows }: { rows: Row[] }) {
  return (
    <dl className="border-t border-zinc-100">
      {rows.map((row, i) => (
        <motion.div
          key={row.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 + i * 0.04, ease: EASE }}
          className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 border-b border-zinc-100 py-4 sm:grid-cols-[116px_minmax(0,1fr)_auto] sm:py-5"
        >
          <Eyebrow as="dt" className="col-start-1">
            {row.label}
          </Eyebrow>
          <dd className="col-start-1 row-start-2 mt-1.5 min-w-0 sm:col-start-2 sm:row-start-1 sm:mt-0">
            <Value row={row} />
          </dd>
          {/* A second definition, so the row stays a term and its definitions; the button hangs into the gutter. */}
          {row.copy ? (
            <dd className="col-start-2 row-span-2 row-start-1 -mr-3 sm:col-start-3 sm:row-span-1">
              <CopyButton text={row.copy} label={row.label.toLowerCase()} />
            </dd>
          ) : null}
        </motion.div>
      ))}
    </dl>
  );
}
