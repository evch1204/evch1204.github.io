import type { ComponentType } from 'react';
import {
  SiAnthropic,
  SiCloudflare,
  SiCloudflareworkers,
  SiCss,
  SiDocker,
  SiGit,
  SiHtml5,
  SiJavascript,
  SiMarkdown,
  SiMediapipe,
  SiNextdotjs,
  SiNodedotjs,
  SiNumpy,
  SiOpenai,
  SiOpencv,
  SiPandas,
  SiPython,
  SiReact,
  SiTailwindcss,
  SiTensorflow,
  SiThreedotjs,
  SiTypescript,
  SiVite,
} from 'react-icons/si';
// Simple Icons dropped the Java mark (trademark), so the Java cup and the
// generic SQL database glyph come from Font Awesome instead.
import { FaDatabase, FaJava } from 'react-icons/fa';
import { siCursor } from 'simple-icons';

export type IconProps = { className?: string };

function CursorBrandIcon({ className }: IconProps) {
  return (
    <svg role="img" viewBox="0 0 24 24" className={className} aria-hidden>
      <title>{siCursor.title}</title>
      <path fill="currentColor" d={siCursor.path} />
    </svg>
  );
}

export type Tech = { name: string; Icon: ComponentType<IconProps> };

/**
 * One flat list, ordered languages → frontend → infra → data → AI tooling so it
 * still reads in a sensible run without headings. 27 items lands as three full
 * rows of nine at desktop width.
 */
export const TECH: Tech[] = [
  { name: 'TypeScript', Icon: SiTypescript },
  { name: 'JavaScript', Icon: SiJavascript },
  { name: 'Python', Icon: SiPython },
  { name: 'Java', Icon: FaJava },
  { name: 'SQL', Icon: FaDatabase },
  { name: 'HTML', Icon: SiHtml5 },
  { name: 'CSS', Icon: SiCss },
  { name: 'React', Icon: SiReact },
  // React Native has no distinct mark — it ships under the React logo.
  { name: 'React Native', Icon: SiReact },
  { name: 'Next.js', Icon: SiNextdotjs },
  { name: 'Tailwind', Icon: SiTailwindcss },
  { name: 'Three.js', Icon: SiThreedotjs },
  { name: 'Vite', Icon: SiVite },
  { name: 'Node.js', Icon: SiNodedotjs },
  { name: 'Cloudflare', Icon: SiCloudflare },
  { name: 'CF Workers', Icon: SiCloudflareworkers },
  { name: 'Docker', Icon: SiDocker },
  { name: 'Git', Icon: SiGit },
  { name: 'Markdown', Icon: SiMarkdown },
  { name: 'TensorFlow', Icon: SiTensorflow },
  { name: 'Pandas', Icon: SiPandas },
  { name: 'NumPy', Icon: SiNumpy },
  { name: 'OpenCV', Icon: SiOpencv },
  { name: 'MediaPipe', Icon: SiMediapipe },
  { name: 'Cursor', Icon: CursorBrandIcon },
  { name: 'OpenAI', Icon: SiOpenai },
  { name: 'Claude', Icon: SiAnthropic },
];
