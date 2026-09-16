import { Clock, CodeXml, GraduationCap, Mail, MapPin, Phone, User, type LucideIcon } from 'lucide-react';
import { EMAIL, LOCATION, PHONE } from '@/content/site';
import PhysBlock from './PhysBlock';

type Fact = {
  /** Stable across renders: the physics engine holds on to each span it launched. */
  id: string;
  Icon: LucideIcon;
  value: string;
  /** The muted `//` aside after the value. */
  note?: string;
  /** The one fact that spans both columns. */
  wide?: boolean;
};

type HomeFactsProps = {
  /** The clock is the one live fact, so it arrives from the screen's ticker. */
  time: string;
  delta: string;
};

/** The details list: icon, monospace value, muted `//` suffix. Every row falls. */
export default function HomeFacts({ time, delta }: HomeFactsProps) {
  const facts: Fact[] = [
    {
      id: 'role',
      Icon: CodeXml,
      value: 'Software Engineer at @DeepSpace',
      note: '// open to work',
      wide: true,
    },
    { id: 'location', Icon: MapPin, value: LOCATION },
    { id: 'clock', Icon: Clock, value: time, note: delta },
    { id: 'school', Icon: GraduationCap, value: "B.S. Computer Science, SCU '25" },
    { id: 'pronouns', Icon: User, value: 'he/him' },
    { id: 'email', Icon: Mail, value: EMAIL },
    { id: 'phone', Icon: Phone, value: PHONE },
  ];

  return (
    <div className="home-facts">
      {facts.map(({ id, Icon, value, note, wide }) => (
        <PhysBlock key={id} cls="fact" sourceCls={wide ? 'fact fact-wide' : 'fact'} rich>
          <Icon size={16} strokeWidth={2} aria-hidden />
          <span className="fact-v">{value}</span>
          {note ? <span className="fact-m">{note}</span> : null}
        </PhysBlock>
      ))}
    </div>
  );
}
