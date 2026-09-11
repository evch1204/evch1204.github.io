import { Download } from 'lucide-react';
import PillLink from '@/components/PillLink';
import Section from '@/components/Section';
import { EXPERIENCE, EDUCATION } from '@/content/experience';
import { RESUME_FILENAME, RESUME_URL } from '@/content/site';
import ExperienceList from './ExperienceList';

/**
 * One centred column holds both lists and their title rows, so the eyebrow,
 * the resume pill and the org headers share a left edge. From `sm` the column
 * reserves 64px on the left for the year gutter; from `lg` there is room in
 * the page margin, so the gutter hangs outside the column instead.
 */
export default function ExperiencePage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-20 sm:pl-16 lg:pl-0">
      <Section
        title="Journey"
        actions={
          <PillLink variant="outline" size="sm" href={RESUME_URL} download={RESUME_FILENAME}>
            <Download size={14} aria-hidden />
            <span className="sm:hidden">Resume</span>
            <span className="hidden sm:inline">Download resume</span>
          </PillLink>
        }
      >
        <ExperienceList orgs={EXPERIENCE} />
      </Section>

      <Section title="Education">
        <ExperienceList orgs={EDUCATION} />
      </Section>
    </div>
  );
}
