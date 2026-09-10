import SectionHeading from '@/components/SectionHeading';
import { TECH } from '@/content/tech';

export default function TechIWorkWith({ className = '' }: { className?: string }) {
  return (
    <div className={className}>
      <SectionHeading>Tech I work with</SectionHeading>

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
