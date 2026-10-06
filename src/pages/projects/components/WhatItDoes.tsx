import { pad2 } from '@/lib/format';

/** The project's key features as a numbered register ruled by hand, two columns from `lg`. */
export default function WhatItDoes({ items, className }: { items: string[]; className: string }) {
  return (
    <section className={className}>
      <div className="mb-5">
        <h3 className="sk-heading">What it does</h3>
      </div>
      {/* Each row opens with its own ruled line, so the list reads as a register in either column. */}
      <ol className="lg:columns-2 lg:gap-12">
        {items.map((item, i) => (
          <li
            key={item}
            className="sk-rule flex gap-4 py-3.5 text-[15px] font-medium leading-relaxed text-pencil text-pretty break-inside-avoid"
          >
            <span className="w-[24px] shrink-0 text-sm font-semibold text-ink">{pad2(i + 1)}</span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
