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

type IconProps = { className?: string };

function CursorBrandIcon({ className }: IconProps) {
  return (
    <svg role="img" viewBox="0 0 24 24" className={className} aria-hidden>
      <title>{siCursor.title}</title>
      <path fill="currentColor" d={siCursor.path} />
    </svg>
  );
}

type Tech = { name: string; Icon: ComponentType<IconProps> };

/**
 * One flat list, ordered languages → frontend → infra → data → AI tooling so it
 * still reads in a sensible run without headings. 27 items lands as three full
 * rows of nine at desktop width.
 */
const TECH: Tech[] = [
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

export default function TechIWorkWith({ className = '' }: { className?: string }) {
  return (
    <div className={className}>
      <h3 className="mb-6 flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">
        <span className="h-px w-12 bg-zinc-200" />
        Tech I work with
      </h3>

      <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-9">
        {TECH.map(({ name, Icon }) => (
          <li
            key={name}
            className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-zinc-100 bg-white px-1.5 py-2.5 text-center shadow-[0_6px_20px_rgba(0,0,0,0.03)] transition-colors hover:border-zinc-300"
          >
            <Icon className="h-[22px] w-[22px] shrink-0 text-zinc-800" />
            <span className="text-[9px] font-semibold leading-tight tracking-tight text-zinc-600">{name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
