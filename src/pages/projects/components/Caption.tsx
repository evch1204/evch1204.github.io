import { pad2 } from '@/lib/format';

/**
 * Mono caption row under a picture: bold index, caption, and an optional
 * right-hand note. `live` has a screen reader read the row again whenever it
 * changes — the slider's caption is what says which picture arrived.
 */
export default function Caption({
  index,
  text,
  right,
  live = false,
  className = '',
}: {
  index: number;
  text: string;
  right?: string;
  live?: boolean;
  className?: string;
}) {
  return (
    <figcaption
      aria-live={live ? 'polite' : undefined}
      className={`flex justify-between gap-4 font-mono text-[10px] leading-relaxed text-zinc-400 md:text-[11px] ${className}`}
    >
      <span className="min-w-0">
        <b className="font-bold text-zinc-600">{pad2(index)}</b>
        <span className="ml-2.5">{text}</span>
      </span>
      {right ? <span className="shrink-0">{right}</span> : null}
    </figcaption>
  );
}
