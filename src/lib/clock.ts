import { pad2 } from '@/lib/format';

/** Minutes that `tz` is offset from UTC at `at`, DST included. */
function tzOffsetMinutes(tz: string, at: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(at);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? '0');
  // Intl renders midnight as hour 24; Date.UTC wants 0.
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'), get('second'));
  return Math.round((asUtc - at.getTime()) / 60000);
}

/** A gap of `minutes`, as the suffix says it: `3h`, `3.5h`, or `13:45h`. */
function formatGap(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (rest === 0) return `${hours}h`;
  if (rest === 30) return `${hours}.5h`;
  return `${hours}:${pad2(rest)}h`;
}

/**
 * The wall clock in `tz`, plus how far it sits from the visitor's own — the
 * suffix is relative to whoever is reading, so it says something different in
 * every city. The zone itself is a site fact, so it arrives as an argument.
 *
 * The gap reads as whole hours (`3h`), a half hour as a decimal (`3.5h`) and
 * any other quarter zone in clock form (`13:45h`) — Kathmandu sits 13:45 from
 * California, not 13.8.
 */
export function readLocalClock(tz: string, at = new Date()) {
  const time = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
  }).format(at);

  const deltaMinutes = tzOffsetMinutes(tz, at) - -at.getTimezoneOffset();
  if (deltaMinutes === 0) return { time, delta: '// same time as you' };

  return { time, delta: `// ${formatGap(Math.abs(deltaMinutes))} ${deltaMinutes > 0 ? 'ahead' : 'behind'}` };
}
