/** Where Tei actually is, for the live clock in the details list. */
export const HOME_TIMEZONE = 'America/Los_Angeles';

/** Minutes that `tz` is offset from UTC at `at`, DST included. */
export function tzOffsetMinutes(tz: string, at: Date) {
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

/**
 * Tei's wall clock, plus how far it sits from the visitor's own — the suffix is
 * relative to whoever is reading, so it says something different in every city.
 */
export function readLocalClock(at = new Date()) {
  const time = new Intl.DateTimeFormat('en-US', {
    timeZone: HOME_TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
  }).format(at);

  const deltaMinutes = tzOffsetMinutes(HOME_TIMEZONE, at) - -at.getTimezoneOffset();
  if (deltaMinutes === 0) return { time, delta: '// same time as you' };

  const hours = Math.abs(deltaMinutes) / 60;
  const rounded = Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
  return { time, delta: `// ${rounded}h ${deltaMinutes > 0 ? 'ahead' : 'behind'}` };
}
