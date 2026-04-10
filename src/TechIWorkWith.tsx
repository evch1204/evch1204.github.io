import { SiAnthropic, SiMysql, SiOpenai, SiOpenjdk, SiPython, SiTypescript } from 'react-icons/si';
import { siCursor } from 'simple-icons';

function CursorBrandIcon({ className }: { className?: string }) {
  return (
    <svg role="img" viewBox="0 0 24 24" className={className} aria-hidden>
      <title>{siCursor.title}</title>
      <path fill="currentColor" d={siCursor.path} />
    </svg>
  );
}

const tech = [
  { name: 'OpenAI', Icon: SiOpenai },
  { name: 'Claude', Icon: SiAnthropic },
  { name: 'Cursor', Icon: CursorBrandIcon },
  { name: 'TypeScript', Icon: SiTypescript },
  { name: 'Python', Icon: SiPython },
  { name: 'Java', Icon: SiOpenjdk },
  { name: 'MySQL', Icon: SiMysql },
] as const;

type TechIWorkWithProps = {
  className?: string;
  /** Below bio + image: heading + icons centered on page, single row */
  pageRow?: boolean;
};

export default function TechIWorkWith({ className = '', pageRow = false }: TechIWorkWithProps) {
  return (
    <div className={`${className} ${pageRow ? 'flex flex-col items-center' : ''}`}>
      {pageRow ? (
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400 mb-6 text-center w-full">
          Tech I work with
        </h3>
      ) : (
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400 mb-6 flex items-center gap-3">
          <span className="w-12 h-px bg-zinc-200" />
          Tech I work with
        </h3>
      )}
      <ul
        className={
          pageRow
            ? 'flex w-full flex-row flex-nowrap items-stretch justify-between gap-2 sm:gap-3 md:gap-4 overflow-x-auto pb-1 [scrollbar-width:thin] [-webkit-overflow-scrolling:touch]'
            : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4'
        }
      >
        {tech.map(({ name, Icon }) => (
          <li
            key={name}
            className={`flex flex-col items-center justify-center rounded-2xl border border-zinc-100 bg-white text-center shadow-[0_8px_30px_rgba(0,0,0,0.03)] transition-colors hover:border-zinc-200 ${
              pageRow
                ? 'min-w-[5.25rem] flex-1 basis-0 gap-2 px-3 py-4 sm:min-w-0 sm:px-4 sm:py-5'
                : 'gap-2 px-2 py-4 shrink-0'
            }`}
          >
            <Icon
              className={`${pageRow ? 'h-9 w-9 sm:h-10 sm:w-10 md:h-11 md:w-11' : 'h-9 w-9'} shrink-0 text-zinc-800`}
              aria-hidden
            />
            <span
              className={`font-semibold text-zinc-600 tracking-tight leading-snug ${
                pageRow
                  ? 'text-[11px] sm:text-xs md:text-sm max-w-[7rem] sm:max-w-none'
                  : 'text-[10px] sm:text-xs'
              }`}
            >
              {name}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
