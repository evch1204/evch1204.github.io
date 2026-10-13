/**
 * The sheets a director looks at before anyone else sees the film: a contact
 * sheet (two frames a second), a strip around one moment to catch a glitch, a
 * phone-size test, a poster frame and a loop check.
 *
 *   node scripts/reel/review.mjs out/home/final.mp4 [--strip 4.2] [--poster 9]
 */
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';

const ff = (args) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...args], { stdio: 'inherit' });

export function duration(video) {
  return Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', video]).toString().trim());
}

export function review(video, { strip, poster, out = dirname(video) } = {}) {
  const dur = duration(video);
  const rows = (perSecond, across) => Math.max(1, Math.ceil((dur * perSecond) / across));
  const sheets = {};
  sheets.contact = join(out, 'contact.png');
  ff(['-i', video, '-vf', `fps=2,scale=320:-1,tile=6x${rows(2, 6)}`, '-frames:v', '1', sheets.contact]);
  sheets.phone = join(out, 'phone.png');
  ff(['-i', video, '-vf', `fps=1,scale=360:-1,tile=5x${rows(1, 5)}`, '-frames:v', '1', sheets.phone]);
  if (strip !== undefined) {
    sheets.strip = join(out, 'strip.png');
    ff(['-ss', String(Math.max(0, strip - 0.1)), '-i', video, '-vf', 'fps=60,scale=320:-1,tile=12x1', '-frames:v', '1', sheets.strip]);
  }
  sheets.poster = join(out, 'poster.png');
  ff(['-ss', String(poster ?? dur * 0.6), '-i', video, '-frames:v', '1', sheets.poster]);
  sheets.loop = join(out, 'loop_check.mp4');
  ff(['-stream_loop', '1', '-i', video, '-c', 'copy', sheets.loop]);
  return sheets;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop())) {
  const [video, ...rest] = process.argv.slice(2);
  const arg = (k) => {
    const i = rest.indexOf('--' + k);
    return i >= 0 ? Number(rest[i + 1]) : undefined;
  };
  if (!video) {
    console.error('usage: node scripts/reel/review.mjs <video> [--strip s] [--poster s]');
    process.exit(1);
  }
  console.log(review(video, { strip: arg('strip'), poster: arg('poster') }));
}
