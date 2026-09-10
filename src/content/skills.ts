/** Skills as they are grouped on the resume, so the two never drift apart. */
export const RESUME_SKILLS = [
  {
    heading: 'Languages',
    items: ['Python', 'Java', 'C++', 'TypeScript', 'JavaScript', 'SQL'],
  },
  {
    heading: 'Frameworks & tools',
    items: ['React', 'Next.js', 'Node.js', 'TensorFlow', 'OpenCV', 'Cloudflare Workers', 'Docker', 'Git', 'REST APIs'],
  },
  {
    heading: 'Certifications',
    items: [
      'Advanced AI Essentials (Google)',
      'Developing Applications in Python (AWS)',
      'Deploying AI in Your Enterprise (IBM)',
      'Introduction to LLMs (Google)',
      'Generative AI (Google)',
    ],
  },
] as const;
