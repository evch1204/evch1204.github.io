import Section from '@/components/Section';
import { EXPERIENCE, EDUCATION } from '@/content/experience';
import ExperienceList from './ExperienceList';

export default function ExperiencePage() {
  return (
    <div className="space-y-20 w-full">
      <Section title="Journey">
        <div className="max-w-3xl mx-auto">
          <ExperienceList orgs={EXPERIENCE} />
        </div>
      </Section>

      <Section title="Education">
        <div className="max-w-3xl mx-auto">
          <ExperienceList orgs={EDUCATION} />
        </div>
      </Section>
    </div>
  );
}
