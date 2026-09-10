/**
 * Every site fact in one place: the name, the addresses, the links and the
 * resume. These used to be retyped in the header, the footer, the home screen
 * and the contact row, which is how they drifted apart.
 */
import { Github, Linkedin, Mail, MapPin } from 'lucide-react';

export const NAME = 'Tei Chang';
/** The wordmark, in caps. The footer adds its own full stop. */
export const BRAND = 'TEI CHANG';
export const EMAIL = 'changtei1204@gmail.com';
/** The footer prints the address in title case; the `mailto:` stays lower case. */
export const EMAIL_DISPLAY = 'ChangTei1204@gmail.com';
export const MAILTO = `mailto:${EMAIL}`;
export const GITHUB_URL = 'https://github.com/evch1204';
export const LINKEDIN_URL = 'https://www.linkedin.com/in/evan-chang1/';
export const LOCATION = 'Santa Clara, CA';
export const PHONE = '+1 (301) 768-8151';

/** Lives in public/, so it has to follow the Vite base path. */
export const RESUME_URL = `${import.meta.env.BASE_URL}resume.pdf`;
/** Filename the home screen's Resume block saves as. */
export const RESUME_DOWNLOAD_FILENAME = 'CV_Tei_Chang.pdf';
/** Filename the About page's resume links save as — a different name to today. */
export const RESUME_PANEL_DOWNLOAD_FILENAME = 'Tei-Chang-Resume.pdf';

export type SocialLink = {
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
  { label: 'github.com/evch1204', href: GITHUB_URL, Icon: Github },
  { label: 'linkedin.com/in/evan-chang1', href: LINKEDIN_URL, Icon: Linkedin },
  { label: LOCATION, href: undefined, Icon: MapPin },
] as const;
