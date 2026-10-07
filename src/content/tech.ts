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
import CursorIcon from '@/components/icons/CursorIcon';

type IconProps = { className?: string };

/** `color` is the mark's own brand colour, as Simple Icons records it. */
type Tech = { name: string; Icon: ComponentType<IconProps>; color: string };

/**
 * One flat list, ordered languages → frontend → infra → data → AI tooling so it
 * still reads in a sensible run without headings. 27 items lands as three full
 * rows of nine at desktop width.
 */
export const TECH: Tech[] = [
  { name: 'TypeScript', Icon: SiTypescript, color: '#3178C6' },
  { name: 'JavaScript', Icon: SiJavascript, color: '#F7DF1E' },
  { name: 'Python', Icon: SiPython, color: '#3776AB' },
  { name: 'Java', Icon: FaJava, color: '#007396' },
  { name: 'SQL', Icon: FaDatabase, color: '#4479A1' },
  { name: 'HTML', Icon: SiHtml5, color: '#E34F26' },
  { name: 'CSS', Icon: SiCss, color: '#663399' },
  { name: 'React', Icon: SiReact, color: '#61DAFB' },
  // React Native has no distinct mark — it ships under the React logo.
  { name: 'React Native', Icon: SiReact, color: '#61DAFB' },
  { name: 'Next.js', Icon: SiNextdotjs, color: '#000000' },
  { name: 'Tailwind', Icon: SiTailwindcss, color: '#06B6D4' },
  { name: 'Three.js', Icon: SiThreedotjs, color: '#000000' },
  { name: 'Vite', Icon: SiVite, color: '#646CFF' },
  { name: 'Node.js', Icon: SiNodedotjs, color: '#5FA04E' },
  { name: 'Cloudflare', Icon: SiCloudflare, color: '#F38020' },
  { name: 'CF Workers', Icon: SiCloudflareworkers, color: '#F38020' },
  { name: 'Docker', Icon: SiDocker, color: '#2496ED' },
  { name: 'Git', Icon: SiGit, color: '#F05032' },
  { name: 'Markdown', Icon: SiMarkdown, color: '#000000' },
  { name: 'TensorFlow', Icon: SiTensorflow, color: '#FF6F00' },
  { name: 'Pandas', Icon: SiPandas, color: '#150458' },
  { name: 'NumPy', Icon: SiNumpy, color: '#013243' },
  { name: 'OpenCV', Icon: SiOpencv, color: '#5C3EE8' },
  { name: 'MediaPipe', Icon: SiMediapipe, color: '#0097A7' },
  { name: 'Cursor', Icon: CursorIcon, color: '#000000' },
  { name: 'OpenAI', Icon: SiOpenai, color: '#412991' },
  { name: 'Claude', Icon: SiAnthropic, color: '#D97757' },
];
