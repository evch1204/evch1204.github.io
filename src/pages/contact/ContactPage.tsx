import { ArrowRight, Briefcase, Clock, Download, Github, Linkedin, Mail, MapPin, Phone } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import PillLink from '@/components/PillLink';
import Section from '@/components/Section';
import Sketch from '@/components/sketch/Sketch';
import { SMILE } from '@/components/sketch/marks';
import {
  AVAILABILITY,
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
import { EASE } from '@/lib/motion';
import { hostLabel } from '@/lib/url';
import PaperPlane from '@/pages/contact/components/PaperPlane';
import Register, { type Row } from '@/pages/contact/components/Register';
import { useLocalClock } from './useLocalClock';

/** The headline, a line at a time, the way the sketch breaks it. */
const HEADLINE = ['Let’s', 'Build Something', 'Great'];

/**
 * The last page of the sketchbook: the invitation written large, a paper
 * plane looping off beside it, the one button that matters, and under them
 * every address as a row of the register. It signs off in the margin.
 */
export default function ContactPage() {
  const clock = useLocalClock(TIMEZONE);
  const reduced = useReducedMotion();

  const rows: Row[] = [
    { label: 'Email', Icon: Mail, value: EMAIL, href: MAILTO, copy: EMAIL },
    { label: 'Phone', Icon: Phone, value: PHONE, href: TEL, copy: PHONE },
    { label: 'LinkedIn', Icon: Linkedin, value: hostLabel(LINKEDIN_URL), href: LINKEDIN_URL },
    { label: 'GitHub', Icon: Github, value: hostLabel(GITHUB_URL), href: GITHUB_URL },
    { label: 'Location', Icon: MapPin, value: LOCATION },
    { label: 'Local time', Icon: Clock, value: clock.time, note: clock.delta },
    { label: 'Status', Icon: Briefcase, value: ROLE, note: AVAILABILITY },
  ];

  return (
    <Section>
      <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start lg:gap-16">
        <div className="relative min-w-0 pt-6">
          <h1 className="-rotate-[4deg] origin-bottom-left text-[2.5rem] font-medium leading-[1.2] text-ink sm:text-[3.4rem] sm:leading-[1.16]">
            {HEADLINE.map((line, i) => (
              <motion.span
                key={line}
                className="block whitespace-nowrap"
                initial={{ opacity: 0, x: reduced ? 0 : -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: EASE, delay: 0.08 * i }}
              >
                {line}
              </motion.span>
            ))}
          </h1>
          <PaperPlane className="absolute right-0 top-[34%] w-[104px] sm:right-2 sm:w-[165px]" />
          <p className="mt-8 max-w-[44ch] pr-28 text-lg leading-relaxed text-pencil text-pretty sm:pr-44">
            I&apos;m a software engineer at DeepSpace, open to roles in software and AI engineering. Email is the best way to
            reach me; the rest of my addresses are here too, with the time where I am.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <PillLink href={MAILTO} className="group">
              Get in Touch
              <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
            </PillLink>
            <PillLink variant="outline" href={RESUME_URL} download={RESUME_FILENAME}>
              <Download size={18} aria-hidden /> Download resume
            </PillLink>
          </div>
        </div>

        <div className="min-w-0">
          <Register rows={rows} />
          <p className="sk-note float-right mt-10 mr-2 -rotate-[14deg] text-lg">
            Thanks
            <br />
            for stopping by!
            <Sketch drawing={SMILE} duration={0.5} delay={0.4} weight={1.4} label="A smile" className="ml-auto mt-1 h-auto w-7 rotate-[14deg]" />
          </p>
        </div>
      </div>
    </Section>
  );
}
