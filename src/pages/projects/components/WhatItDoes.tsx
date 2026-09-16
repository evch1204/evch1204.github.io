import Eyebrow from '@/components/Eyebrow';
import { pad2 } from '@/lib/format';

/** The project's key features as a numbered register, two columns from `lg`. */
export default function WhatItDoes({ items, className }: { items: string[]; className: string }) {
  return (
    <section className={className}>
      <Eyebrow as="h3" className="mb-4">
        What it does
      </Eyebrow>
      {/* The list's own top rule spans both columns; each row closes with its own. */}
      <ol className="border-t border-zinc-100 lg:columns-2 lg:gap-12">
        {items.map((item, i) => (
          <li
            key={item}
            className="flex gap-4 border-b border-zinc-100 py-3.5 text-sm font-medium leading-relaxed text-zinc-600 text-pretty break-inside-avoid"
          >
            <span className="w-[22px] shrink-0 pt-[3px] font-mono text-[11px] text-zinc-400">{pad2(i + 1)}</span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
