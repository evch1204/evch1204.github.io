import { Download, Mail } from 'lucide-react';
import { motion } from 'motion/react';
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
import { hostLabel } from '@/lib/url';
import Register, { type Row } from '@/pages/contact/components/Register';

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
