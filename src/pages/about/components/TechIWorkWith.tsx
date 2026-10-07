import SectionHeading from '@/components/SectionHeading';
import Frame from '@/components/sketch/Frame';
import { TECH } from '@/content/tech';

/** Every tool as a small pencilled tile: its mark in its own colour, its name under it. */
export default function TechIWorkWith({ className = '' }: { className?: string }) {
  return (
    <div className={className}>
      <SectionHeading>Tech I work with</SectionHeading>

      <ul className="grid grid-cols-4 gap-2.5 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-9">
        {TECH.map(({ name, Icon, color }) => (
          <li key={name} className="sk-frame sk-card flex flex-col items-center justify-center gap-1.5 px-1.5 py-3 text-center">
            <Frame r={10} weight={1.2} tone={0.38} />
            <span className="flex shrink-0" style={{ color }}>
              <Icon className="h-[22px] w-[22px]" />
            </span>
            <span className="text-[11px] font-medium leading-tight text-pencil">{name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
