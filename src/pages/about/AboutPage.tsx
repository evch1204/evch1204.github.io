import { useState } from 'react';
import { motion } from 'motion/react';
import Section from '@/components/Section';
import { CONTACT_LINKS } from '@/content/site';
import profilePhoto from '@/assets/images/your-photo.jpg';
import GithubActivity from './GithubActivity';
import ResumeModal from './ResumeModal';
import ResumePanel from './ResumePanel';
import TechIWorkWith from './TechIWorkWith';

export default function AboutPage() {
  const [resumeOpen, setResumeOpen] = useState(false);

  return (
    <Section title="Profile">
      <div className="flex flex-col gap-12">
        <div className="grid gap-10 sm:gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(240px,320px)] lg:gap-14 lg:items-center">
          <div className="min-w-0 space-y-5">
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-4xl font-bold tracking-tighter text-zinc-900 sm:text-5xl lg:text-6xl"
              >
                Tei Chang
              </motion.h1>
              <p className="mt-3 text-sm font-semibold uppercase tracking-[0.18em] text-zinc-400">
                B.S. Computer Science (Data Science) · SCU &apos;25
              </p>
            </div>
            <div className="text-base leading-relaxed text-zinc-600 sm:text-lg">
              <p>
                I&apos;m a Computer Science graduate and I&apos;m seeking to learn and grow along with AI. I studied at{' '}
                <span className="font-semibold text-zinc-900">Santa Clara University</span> with a Data Science
                specialization. I&apos;m currently a{' '}
                <span className="font-semibold text-zinc-900">Software Engineer at DeepSpace</span>, where I
                build full-stack products end-to-end—from system design through production deployment.
              </p>
            </div>
            <ul className="flex flex-wrap gap-2.5 pt-1">
              {CONTACT_LINKS.map(({ label, href, Icon }) => (
                <li key={label}>
                  {href ? (
                    <a
                      href={href}
                      target={href.startsWith('mailto:') ? undefined : '_blank'}
                      rel={href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                      className="group inline-flex max-w-full items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 font-mono text-xs font-bold text-zinc-600 transition-colors hover:border-zinc-900 hover:text-zinc-900"
                    >
                      <Icon size={14} className="shrink-0" />
                      <span className="truncate">{label}</span>
                    </a>
                  ) : (
                    <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-zinc-100 bg-zinc-50 px-4 py-2 font-mono text-xs font-bold text-zinc-500">
                      <Icon size={14} className="shrink-0" />
                      <span className="truncate">{label}</span>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[260px] sm:max-w-[300px] lg:max-w-none lg:w-full">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
                className="relative z-10 aspect-[3/4] w-full overflow-hidden rounded-[2rem] border-[6px] border-white bg-zinc-100 shadow-[0_24px_64px_rgba(0,0,0,0.12)] sm:rounded-[2.25rem] sm:border-8"
              >
                <img
                  src={profilePhoto}
                  alt="Tei Chang"
                  className="h-full w-full object-cover"
                  decoding="async"
                />
              </motion.div>
              <div className="absolute -inset-3 rounded-[2.5rem] bg-zinc-900/[0.04] blur-2xl sm:-inset-4 sm:rounded-[3rem]" aria-hidden />
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-100 pt-10">
          <TechIWorkWith className="w-full" />
        </div>

        <div className="border-t border-zinc-100 pt-10">
          <GithubActivity />
        </div>

        <div className="border-t border-zinc-100 pt-10">
          <ResumePanel onExpand={() => setResumeOpen(true)} />
        </div>
      </div>

      <ResumeModal open={resumeOpen} onClose={() => setResumeOpen(false)} />
    </Section>
  );
}
