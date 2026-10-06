import { useState } from 'react';
import { GraduationCap, MapPin, Sparkles, type LucideIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import Chip from '@/components/Chip';
import Section from '@/components/Section';
import { CONTACT_LINKS, LOCATION, NAME, ROLE, SCHOOL } from '@/content/site';
import { EASE } from '@/lib/motion';
import GithubActivity from '@/pages/about/components/GithubActivity';
import Portrait from '@/pages/about/components/Portrait';
import ResumeModal from '@/pages/about/components/ResumeModal';
import ResumePanel from '@/pages/about/components/ResumePanel';
import TechIWorkWith from '@/pages/about/components/TechIWorkWith';

/** The three facts under the introduction: where, what was studied, and what the work is about. */
const FACTS: { Icon: LucideIcon; main: string; aside: string }[] = [
  { Icon: MapPin, main: LOCATION, aside: '(Originally from Taiwan)' },
  { Icon: GraduationCap, main: 'Computer Science, B.S.', aside: `${SCHOOL} · Data Science · ’25` },
  { Icon: Sparkles, main: 'Focus', aside: 'Full-stack · AI tooling · Data science' },
];

/** The places to write to; the city is one of the facts above, so it is not repeated as a chip. */
const LINKS = CONTACT_LINKS.filter((link) => link.href);

export default function AboutPage() {
  const [resumeOpen, setResumeOpen] = useState(false);
  const reduced = useReducedMotion();
  const rise = (delay: number) => ({
    initial: { opacity: 0, y: reduced ? 0 : 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: EASE, delay },
  });

  return (
    <Section title="About Me">
      <div className="flex flex-col gap-14">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.78fr)] lg:items-start lg:gap-10">
          <div className="min-w-0 space-y-7">
            <motion.div {...rise(0.1)} className="space-y-4 text-lg leading-relaxed text-pencil sm:text-xl sm:leading-relaxed">
              <p>
                Hi, I&apos;m <span className="font-semibold text-ink">{NAME}</span> — a Computer Science graduate, and I&apos;m
                seeking to learn and grow along with AI.
              </p>
              <p>
                I studied at <span className="font-semibold text-ink">{SCHOOL}</span> with a Data Science specialization.
                I&apos;m currently a <span className="font-semibold text-ink">{ROLE}</span>, where I build full-stack products
                end-to-end, from system design through production deployment.
              </p>
            </motion.div>

            <motion.ul {...rise(0.2)} className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {FACTS.map(({ Icon, main, aside }) => (
                <li key={main} className="flex items-start gap-3">
                  <Icon size={22} strokeWidth={1.7} className="mt-0.5 shrink-0 text-ink" aria-hidden />
                  <span className="min-w-0">
                    <span className="block text-base font-semibold text-ink">{main}</span>
                    <span className="block text-sm text-graphite">{aside}</span>
                  </span>
                </li>
              ))}
            </motion.ul>

            <motion.ul {...rise(0.3)} className="flex flex-wrap gap-2.5">
              {LINKS.map(({ label, href, Icon }) => (
                <li key={label}>
                  <Chip Icon={Icon} href={href}>
                    {label}
                  </Chip>
                </li>
              ))}
            </motion.ul>
          </div>

          <Portrait className="mx-auto max-w-[320px] lg:-mt-6 lg:max-w-[380px]" />
        </div>

        <div className="sk-rule pt-10">
          <TechIWorkWith className="w-full" />
        </div>

        <div className="sk-rule pt-10">
          <GithubActivity />
        </div>

        <div className="sk-rule pt-10">
          <ResumePanel onExpand={() => setResumeOpen(true)} />
        </div>
      </div>

      <ResumeModal open={resumeOpen} onClose={() => setResumeOpen(false)} />
    </Section>
  );
}
