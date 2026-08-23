/**
 * Snapshots the GitHub contribution calendar into src/contributionsData.json.
 *
 * Run it manually (npm run contributions) before deploying — the data is baked
 * into the bundle rather than fetched at runtime, so the page needs no API token
 * and cannot break on a slow or failing request. The endpoint needs no auth and
 * honours the profile's "Include private contributions" setting, so what it
 * returns is exactly what an anonymous visitor sees.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const USER = process.argv[2] ?? 'evch1204';
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'contributionsData.json');

const html = await fetch(`https://github.com/users/${USER}/contributions`, {
  headers: { 'User-Agent': 'evch1204-portfolio-build', 'X-Requested-With': 'XMLHttpRequest' },
}).then((r) => {
  if (!r.ok) throw new Error(`GitHub responded ${r.status}`);
  return r.text();
});

// "1,439 contributions in the last year"
const totalMatch = html.replace(/\s+/g, ' ').match(/([\d,]+)\s+contributions\s+in the last year/i);
const total = totalMatch ? Number(totalMatch[1].replace(/,/g, '')) : null;

// Counts live in <tool-tip for="<cell id>">, so index those first.
const counts = new Map();
for (const m of html.matchAll(/<tool-tip[^>]*\sfor="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g)) {
  const text = m[2];
  counts.set(m[1], /^No contributions/i.test(text) ? 0 : Number((text.match(/^([\d,]+)/) ?? [0, '0'])[1].replace(/,/g, '')));
}

const days = [];
for (const m of html.matchAll(/<td[^>]*class="ContributionCalendar-day"[^>]*>/g)) {
  const tag = m[0];
  const date = (tag.match(/data-date="([^"]+)"/) ?? [])[1];
  if (!date) continue; // padding cells at the start and end of the calendar
  const id = (tag.match(/\sid="([^"]+)"/) ?? [])[1];
  days.push({
    date,
    level: Number((tag.match(/data-level="(\d)"/) ?? [0, '0'])[1]),
    count: counts.get(id) ?? 0,
  });
}

if (days.length === 0) throw new Error('Parsed zero days — GitHub markup likely changed.');

days.sort((a, b) => a.date.localeCompare(b.date));

const data = {
  user: USER,
  total: total ?? days.reduce((s, d) => s + d.count, 0),
  from: days[0].date,
  to: days[days.length - 1].date,
  fetchedAt: new Date().toISOString().slice(0, 10),
  days,
};

writeFileSync(OUT, `${JSON.stringify(data, null, 2)}\n`);
console.log(
  `wrote ${days.length} days — ${data.total} contributions, ${days.filter((d) => d.count > 0).length} active days (${data.from} → ${data.to})`,
);
