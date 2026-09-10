/**
 * Every site fact in one place: the name, the addresses, the links and the
 * resume. These used to be retyped in the header, the footer, the home screen
 * and the contact row, which is how they drifted apart.
 */
import { Github, Linkedin, Mail, MapPin } from 'lucide-react';
import { hostLabel } from '@/lib/url';

export const NAME = 'Tei Chang';
/** The wordmark, in caps. The footer adds its own full stop. */
export const BRAND = 'TEI CHANG';
export const EMAIL = 'changtei1204@gmail.com';
export const MAILTO = `mailto:${EMAIL}`;
export const GITHUB_URL = 'https://github.com/evch1204';
export const LINKEDIN_URL = 'https://www.linkedin.com/in/evan-chang1/';
export const LOCATION = 'Santa Clara, CA';
export const PHONE = '+1 (301) 768-8151';
/** Where Tei is; drives the live clock in the home screen's details list. */
export const TIMEZONE = 'America/Los_Angeles';

/** Lives in public/, so it has to follow the Vite base path. */
export const RESUME_URL = `${import.meta.env.BASE_URL}resume.pdf`;
/** The one name every resume link saves the file as. */
export const RESUME_FILENAME = 'Tei-Chang-Resume.pdf';

type SocialLink = {
  id: 'github' | 'linkedin' | 'mail';
  /** Accessible name; these links are icon-only everywhere they appear. */
  label: string;
  href: string;
  Icon: typeof Github;
};

export const SOCIAL_LINKS: SocialLink[] = [
  { id: 'github', label: 'GitHub', href: GITHUB_URL, Icon: Github },
  { id: 'linkedin', label: 'LinkedIn', href: LINKEDIN_URL, Icon: Linkedin },
  { id: 'mail', label: 'Email', href: MAILTO, Icon: Mail },
];

/** The address row under the profile copy. No `href` means it is not a link. */
export const CONTACT_LINKS = [
  { label: EMAIL, href: MAILTO, Icon: Mail },
  { label: hostLabel(GITHUB_URL), href: GITHUB_URL, Icon: Github },
  { label: hostLabel(LINKEDIN_URL), href: LINKEDIN_URL, Icon: Linkedin },
  { label: LOCATION, href: undefined, Icon: MapPin },
] as const;
