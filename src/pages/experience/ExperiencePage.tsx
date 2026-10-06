import { Download } from 'lucide-react';
import PillLink from '@/components/PillLink';
import Section from '@/components/Section';
import Sketch from '@/components/sketch/Sketch';
import { ARROW_RIGHT } from '@/components/sketch/marks';
import { EXPERIENCE, EDUCATION } from '@/content/experience';
import { RESUME_FILENAME, RESUME_URL } from '@/content/site';
import ExperienceList from '@/pages/experience/components/ExperienceList';

/**
 * One centred column holds both lists and their title rows, so the title,
 * the resume pill and the org headers share a left edge. From `sm` the column
 * reserves 64px on the left for the year gutter; from `lg` there is room in
 * the page margin, so the gutter hangs outside the column instead. The first
 * list ends with the sketch's margin note, which hands over the rest.
 */
export default function ExperiencePage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-20 sm:pl-16 lg:pl-0">
      <Section
        title="Experience"
        actions={
          <PillLink variant="outline" size="sm" href={RESUME_URL} download={RESUME_FILENAME}>
            <Download size={14} aria-hidden />
            <span className="sm:hidden">Resume</span>
            <span className="hidden sm:inline">Download resume</span>
          </PillLink>
        }
      >
        <ExperienceList orgs={EXPERIENCE} />
        <a
          href={RESUME_URL}
          download={RESUME_FILENAME}
          className="sk-note group mt-4 ml-1 rounded-md focus-ring"
          aria-label="More experience: download the resume"
        >
          More
          <br />
          experience
          <Sketch
            drawing={ARROW_RIGHT}
            duration={0.4}
            delay={0.3}
            weight={1.3}
            className="ml-2 inline-block h-auto w-7 align-middle transition-transform duration-300 group-hover:translate-x-1"
          />
        </a>
      </Section>

      <Section title="Education" as="h2">
        <ExperienceList orgs={EDUCATION} />
      </Section>
    </div>
  );
}
