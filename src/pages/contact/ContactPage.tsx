import { useEffect, useState } from 'react';
import { ArrowUpRight, Check, Copy, Download, Mail } from 'lucide-react';
import { motion } from 'motion/react';
import Eyebrow from '@/components/Eyebrow';
import PillLink from '@/components/PillLink';
import Section from '@/components/Section';
import {
  EMAIL,
  GITHUB_URL,
  LINKEDIN_URL,
  LOCATION,
  MAILTO,
  PHONE,
  RESUME_FILENAME,
  RESUME_URL,
  ROLE,
  TEL,
  TIMEZONE,
} from '@/content/site';
import { useLocalClock } from '@/hooks/useLocalClock';
import { linkProps } from '@/lib/links';
import { EASE } from '@/lib/motion';
import { hostLabel } from '@/lib/url';

/**
 * A row of the register: its label, what it says, and where it goes. An
 * address reads in mono; a `note` is the mono aside after it, in the home
 * screen's `// comment` voice. `copy` is what the row's Copy button puts on
 * the clipboard.
 */
type Row = {
  label: string;
  value: string;
  note?: string;
  href?: string;
  copy?: string;
  mono?: boolean;
};

/** Copies `text` and says so for a moment. Not offered where the clipboard is out of reach. */
function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(id);
  }, [copied]);

  if (!navigator.clipboard) return null;
  // A refused copy leaves the label as it was: there is nothing useful to say.
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => setCopied(true), () => {});
  };
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy ${label}`}
      className="inline-flex h-11 items-center gap-1.5 rounded-full px-3 font-mono text-[11px] text-zinc-400 transition-colors hover:text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 sm:h-8"
    >
      {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
      <span aria-live="polite">{copied ? 'copied' : 'copy'}</span>
    </button>
  );
}

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
        className={`group inline-flex max-w-full items-center gap-1.5 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 ${text}`}
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
function Register({ rows }: { rows: Row[] }) {
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

export default function ContactPage() {
  const clock = useLocalClock(TIMEZONE);

  const rows: Row[] = [
    { label: 'Email', value: EMAIL, href: MAILTO, copy: EMAIL, mono: true },
    { label: 'Phone', value: PHONE, href: TEL, copy: PHONE, mono: true },
    { label: 'LinkedIn', value: hostLabel(LINKEDIN_URL), href: LINKEDIN_URL, mono: true },
    { label: 'GitHub', value: hostLabel(GITHUB_URL), href: GITHUB_URL, mono: true },
    { label: 'Location', value: LOCATION },
    { label: 'Local time', value: clock.time, note: clock.delta, mono: true },
    { label: 'Status', value: ROLE, note: '// open to work' },
  ];

  return (
    <Section title="Connect">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-start lg:gap-20">
        <div className="min-w-0">
          <motion.h1
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl font-bold tracking-tighter text-zinc-900 sm:text-5xl lg:text-6xl"
          >
            Let&apos;s talk.
          </motion.h1>
          <p className="mt-5 max-w-[46ch] text-base leading-relaxed text-zinc-600 text-pretty sm:text-lg">
            I&apos;m a software engineer at DeepSpace, open to roles in software and AI engineering. Email is the best way
            to reach me; the rest of my addresses are here too, with the time where I am.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <PillLink href={MAILTO}>
              <Mail size={18} aria-hidden /> Email me
            </PillLink>
            <PillLink variant="outline" href={RESUME_URL} download={RESUME_FILENAME}>
              <Download size={18} aria-hidden /> Download resume
            </PillLink>
          </div>
        </div>

        <Register rows={rows} />
      </div>
    </Section>
  );
}
