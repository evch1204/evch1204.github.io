import Section from '@/components/Section';
import { EXPERIENCE, EDUCATION, type Org } from '@/content/experience';
import CompanyLogo from './CompanyLogo';
import ExperienceList from './ExperienceList';

/** Both lists mark an organization the same way. */
const renderLogo = (org: Org) => <CompanyLogo domain={org.logoDomain} company={org.name} size={34} />;

export default function ExperiencePage() {
  return (
    <div className="space-y-20 w-full">
      <Section title="Journey">
        <div className="max-w-3xl mx-auto">
          <ExperienceList orgs={EXPERIENCE} renderLogo={renderLogo} />
        </div>
      </Section>

      <Section title="Education">
        <div className="max-w-3xl mx-auto">
          <ExperienceList orgs={EDUCATION} renderLogo={renderLogo} />
        </div>
      </Section>
    </div>
  );
}
