import { useRef, useState } from 'react';
import { Github } from 'lucide-react';
import data from './contributionsData.json';

/** GitHub's own light-mode heatmap scale, level 0 → 4. */
const LEVEL_COLORS = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

type Day = { date: string; level: number; count: number };
type Tip = { text: string; x: number; y: number };

/**
 * Groups the flat day list into GitHub-style columns: one column per week,
 * Sunday first, with the first column padded so weekday rows line up.
 */
function toWeeks(days: Day[]) {
  const weeks: (Day | null)[][] = [];
  let week: (Day | null)[] = [];

  const firstWeekday = new Date(`${days[0].date}T00:00:00Z`).getUTCDay();
  for (let i = 0; i < firstWeekday; i++) week.push(null);

  for (const day of days) {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }
  return weeks;
}

/** A month label sits above the first week that starts a new month. */
function monthLabels(weeks: (Day | null)[][]) {
  const raw: { index: number; label: string }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, index) => {
    const first = week.find(Boolean);
    if (!first) return;
    const month = new Date(`${first.date}T00:00:00Z`).getUTCMonth();
    if (month !== lastMonth) {
      raw.push({ index, label: MONTHS[month] });
      lastMonth = month;
    }
  });

  // The calendar opens mid-month, so the first label is a sliver. Drop it rather
  // than the full month beside it, then keep the rest from colliding.
  if (raw.length > 1 && raw[1].index - raw[0].index < 3) raw.shift();

  return raw.filter((label, i, all) => i === 0 || label.index - all[i - 1].index >= 3);
}

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });

const describe = (day: Day) =>
  `${day.count === 0 ? 'No contributions' : `${day.count} contribution${day.count === 1 ? '' : 's'}`} on ${formatDate(day.date)}`;

export default function GithubActivity() {
  const days = data.days as Day[];
  const weeks = toWeeks(days);
  const labels = monthLabels(weeks);
  const activeDays = days.filter((d) => d.count > 0).length;

  // The tooltip lives outside the scroll container so it is never clipped by it.
  const frameRef = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<Tip | null>(null);

  const showTip = (day: Day, el: HTMLElement) => {
    const frame = frameRef.current;
    if (!frame) return;
    const cell = el.getBoundingClientRect();
    const box = frame.getBoundingClientRect();
    setTip({
      text: describe(day),
      // Keep the bubble inside the frame rather than letting it hang off an edge.
      x: Math.min(Math.max(cell.left - box.left + cell.width / 2, 90), box.width - 90),
      y: cell.top - box.top,
    });
  };

  const columns = { gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` };

  return (
    <div>
      <h3 className="mb-6 flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">
        <span className="h-px w-12 bg-zinc-200" />
        GitHub activity
      </h3>

      <div ref={frameRef} className="relative" onMouseLeave={() => setTip(null)}>
        {tip ? (
          <div
            role="status"
            className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full rounded-lg bg-zinc-900 px-2.5 py-1.5 text-[11px] font-semibold whitespace-nowrap text-white shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
            style={{ left: tip.x, top: tip.y - 8 }}
          >
            {tip.text}
            <span
              className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45 bg-zinc-900"
              aria-hidden
            />
          </div>
        ) : null}

        {/* Fills the column on wide screens; scrolls once the cells hit their floor. */}
        <div className="overflow-x-auto pb-1 pt-7 [scrollbar-width:thin]">
          <div className="flex min-w-[720px] items-stretch gap-2">
            <div className="flex w-7 shrink-0 flex-col gap-[3px] pt-[18px] text-right text-[9px] font-medium text-zinc-400">
              {WEEKDAY_LABELS.map((label, i) => (
                <span key={i} className="flex flex-1 items-center justify-end leading-none">
                  {label}
                </span>
              ))}
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-1.5 grid gap-[3px] text-[10px] font-medium text-zinc-400" style={columns}>
                {labels.map(({ index, label }) => (
                  <span
                    key={label + index}
                    className="overflow-visible whitespace-nowrap"
                    style={{ gridColumnStart: index + 1 }}
                  >
                    {label}
                  </span>
                ))}
              </div>

              <div className="grid gap-[3px]" style={columns}>
                {weeks.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-[3px]">
                    {week.map((day, di) =>
                      day ? (
                        <span
                          key={day.date}
                          role="img"
                          aria-label={describe(day)}
                          className="aspect-square w-full rounded-[2px] transition-transform duration-150 hover:scale-[1.35]"
                          style={{ backgroundColor: LEVEL_COLORS[day.level] ?? LEVEL_COLORS[0] }}
                          onMouseEnter={(e) => showTip(day, e.currentTarget)}
                          // Touch has no hover, so a tap has to be able to ask too.
                          onClick={(e) => showTip(day, e.currentTarget)}
                        />
                      ) : (
                        <span key={`${wi}-${di}`} className="aspect-square w-full" aria-hidden />
                      ),
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <p className="text-xs font-medium text-zinc-500">
          <span className="font-bold text-zinc-900">{data.total.toLocaleString()}</span> contributions in the last year on{' '}
          <a
            href={`https://github.com/${data.user}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-bold text-zinc-900 underline decoration-zinc-300 underline-offset-2 transition-colors hover:decoration-zinc-900"
          >
            <Github size={12} /> GitHub
          </a>
          , across {activeDays} active days.
        </p>
        <div className="flex items-center gap-1.5 text-[10px] font-medium text-zinc-400 sm:ml-auto">
          Less
          {LEVEL_COLORS.map((color) => (
            <span key={color} className="h-[11px] w-[11px] rounded-[2px]" style={{ backgroundColor: color }} />
          ))}
          More
        </div>
      </div>
    </div>
  );
}
