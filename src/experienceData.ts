/**
 * Experience and education, shaped the same way: an organization is a heading,
 * and each position or degree under it is its own expandable row. DeepSpace has
 * two roles, so both show as separate rows rather than one merged entry.
 */

export type RoleIcon = 'code' | 'ai' | 'data' | 'support' | 'degree' | 'school';

export type Role = {
  id: string;
  title: string;
  /** Employment type, or degree type in the education list. */
  kind: string;
  /** MM.YYYY — MM.YYYY, or "Present" for a current role. */
  period: string;
  bullets: string[];
  /** Stack for a job; relevant coursework and activities for a degree. */
  tags: string[];
  icon: RoleIcon;
};

export type Org = {
  id: string;
  name: string;
  /**
   * Website domain for the favicon (e.g. scu.edu). Omit for no logo,
   * pass an empty string for initials-only when there is no reliable domain.
   */
  logoDomain?: string;
  location?: string;
  /** Marks the current employer with a dot. */
  current?: boolean;
  roles: Role[];
};

export const EXPERIENCE: Org[] = [
  {
    id: 'deepspace',
    name: 'DeepSpace',
    logoDomain: 'deep.space',
    location: 'New York, NY',
    current: true,
    roles: [
      {
        id: 'ds-swe',
        title: 'Software Engineer',
        kind: 'Full-time',
        period: '05.2026 — Present',
        icon: 'code',
        bullets: [
          'Designed and shipped Create Mode, an AI development tool that turns plain-English chat into production-ready web applications, owning the feature end-to-end from initial architecture through launch.',
          'Architected per-session Cloudflare Containers that give each user project an isolated Node.js workspace, enabling safe, concurrent AI code generation and execution across sessions.',
        ],
        tags: ['TypeScript', 'React', 'Next.js', 'Node.js', 'Cloudflare Workers'],
      },
      {
        id: 'ds-intern',
        title: 'Software Engineer Intern',
        kind: 'Internship',
        period: '01.2026 — 04.2026',
        icon: 'code',
        bullets: [
          'Shipped 5+ full-stack web applications end-to-end (TypeScript, React, Next.js), owning system design, development and production deployment.',
          'Integrated 20+ third-party services across 100+ API endpoints, ensuring reliable data flow and fault-tolerant behavior across production applications.',
        ],
        tags: ['TypeScript', 'React', 'Next.js', 'REST APIs'],
      },
    ],
  },
  {
    id: 'paidwork',
    name: 'Paidwork',
    logoDomain: 'paidwork.com',
    location: 'Sacramento, CA',
    roles: [
      {
        id: 'pw-ml',
        title: 'AI / Machine Learning Intern',
        kind: 'Internship',
        period: '09.2025 — 12.2025',
        icon: 'ai',
        bullets: [
          "Built the testing framework for the AI service's data pipeline and API layer, reaching 85%+ code coverage and catching integration failures before production rollout.",
          'Extended the AI assistant to 100+ languages by integrating translation APIs with language-detection and fallback routing, replacing English-only handling of non-English queries.',
          'Built an internal integration testing page that let the team validate endpoints and inspect responses in-browser, replacing the manual Postman workflow.',
        ],
        tags: ['Python', 'REST APIs', 'Microservices', 'Testing'],
      },
    ],
  },
  {
    id: 'scu-work',
    name: 'Santa Clara University',
    logoDomain: 'scu.edu',
    location: 'Santa Clara, CA',
    roles: [
      {
        id: 'scu-ta',
        title: 'Technical Service Student Assistant',
        kind: 'Part-time',
        period: '05.2024 — 06.2025',
        icon: 'data',
        bullets: [
          'Optimized library database systems managing 50,000+ records.',
          'Leveraged SQL for data integrity and archival compliance.',
        ],
        tags: ['SQL', 'Databases'],
      },
    ],
  },
  {
    id: 'dupont',
    name: 'DuPont de Nemours',
    logoDomain: 'dupont.com',
    location: 'Hsinchu, Taiwan',
    roles: [
      {
        id: 'dp-eng',
        title: 'Technical Engineer Intern',
        kind: 'Internship',
        period: '06.2023 — 08.2023',
        icon: 'code',
        bullets: [
          'Automated recurring reporting for a 20-person team by building Python scripts that pulled raw data and generated formatted Excel deliverables, eliminating a manual data-entry step from the reporting cycle.',
          'Prototyped a computer-vision safety monitor using OpenCV and a pre-trained detection model, flagging workers missing required PPE from live lab camera feeds.',
          'Presented on internal automation and AI tooling at a company-wide session for 500+ DuPont employees; placed 1st in the Internship Program Competition.',
        ],
        tags: ['Python', 'OpenCV', 'Excel Automation'],
      },
    ],
  },
  {
    id: 'guoqing',
    name: 'GuoQing Express Co., Ltd',
    logoDomain: '',
    location: 'Taipei, Taiwan',
    roles: [
      {
        id: 'gq-cs',
        title: 'Data and Operations Intern',
        kind: 'Internship',
        period: '06.2022 — 09.2022',
        icon: 'data',
        bullets: [
          'Automated complex data workflows using VBA, significantly increasing team throughput and data accuracy.',
        ],
        tags: ['VBA', 'Excel'],
      },
    ],
  },
];

export const EDUCATION: Org[] = [
  {
    id: 'scu-edu',
    name: 'Santa Clara University',
    logoDomain: 'scu.edu',
    location: 'Santa Clara, CA',
    roles: [
      {
        id: 'scu-bs',
        title: 'B.S. Computer Science',
        kind: "Bachelor's Degree",
        period: '09.2021 — 06.2025',
        icon: 'degree',
        bullets: [
          'Specialization in Data Science / Machine Learning.',
          'Minors in Mathematics and Computer Engineering.',
          'Activities: Alpha Phi Omega (Vice President), Technical Service Student Assistant, AI Collaborate SCU.',
        ],
        tags: [
          'Artificial Intelligence',
          'Applied Machine Learning',
          'Algorithms',
          'Data Structures',
          'OOP',
          'Data Science',
        ],
      },
    ],
  },
  {
    id: 'smic',
    name: 'SMIC-International School',
    logoDomain: 'smicschool.com',
    location: 'Shanghai, China',
    roles: [
      {
        id: 'smic-hs',
        title: 'High School Diploma',
        kind: 'Secondary Education',
        period: '09.2017 — 06.2021',
        icon: 'school',
        bullets: [
          'Honor Roll.',
          'Student Athletic Council President and Student Council Historian.',
          'Varsity Basketball and Varsity Volleyball.',
        ],
        tags: ['Honor Roll', 'Student Leadership', 'Varsity Athletics'],
      },
    ],
  },
];

/** The most recent position — open by default so the section never lands fully collapsed. */
export const defaultOpenRoleId = (orgs: Org[]) => orgs[0]?.roles[0]?.id ?? null;
