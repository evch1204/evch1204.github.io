/**
 * Renders a reel: serves the built site, films the reel script, synthesizes
 * the soundtrack from its cue sheet, mixes to -14 LUFS, and writes the review
 * sheets.
 *
 *   node scripts/reel/render.mjs scripts/reel/home.reel.mjs [--draft] [--to 10] [--url http://...] [--out out/home]
 *   --draft   960x540 at 30 fps, no motion blur: for looking, fast
 *   --to s    stop after s seconds of film
 *   --sub n   sub-frames blended per frame (motion blur), default 2
 *   --fps n   default 60
 *   --png     lossless frame captures (slower; the default is JPEG at quality 95)
 *   --no-audio
 */
import { spawn, execFileSync } from 'node:child_process';
import { existsSync, copyFileSync, readFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Film } from './film.mjs';
import { renderAudio } from './music.mjs';
import { review } from './review.mjs';

const args = process.argv.slice(2);
const script = args.find((a) => !a.startsWith('--'));
if (!script) {
  console.error('usage: node scripts/reel/render.mjs <reel.mjs> [--draft] [--to s] [--url u] [--out dir]');
  process.exit(1);
}
const flag = (k) => args.includes('--' + k);
const opt = (k, d) => {
  const i = args.indexOf('--' + k);
  return i >= 0 ? args[i + 1] : d;
};

const reel = await import(pathToFileURL(resolve(script)).href);
const meta = reel.meta || {};
const name = meta.name || basename(script).replace(/\.reel\.mjs$/, '');
const draft = flag('draft');
const out = resolve(opt('out', join('out', name + (draft ? '-draft' : ''))));
const to = Number(opt('to', meta.duration || 30));

/* The site: served from dist/ unless a URL is given. */
let server;
let url = opt('url');
if (!url) {
  if (!existsSync('dist/index.html')) {
    console.error('No dist/: run `npm run build` first, or pass --url.');
    process.exit(1);
  }
  const port = Number(opt('port', 4197));
  server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--port', String(port), '--strictPort'], { stdio: 'ignore' });
  url = `http://localhost:${port}/`;
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(url)).ok) break;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 100));
  }
}

try {
  const film = new Film({
    url,
    out,
    width: draft ? 960 : 1920,
    height: draft ? 540 : 1080,
    fps: draft ? 30 : Number(opt('fps', 60)),
    sub: draft ? 1 : Number(opt('sub', 2)),
    lead: meta.lead ?? 0,
    ready: meta.ready,
    viewport: meta.viewport,
    port: Number(opt('devtools', 9340)),
    format: flag('png') ? 'png' : 'jpeg',
  });
  console.log(`Filming ${name} → ${out}`);
  await film.open();
  await reel.default(film, { to });
  await film.finish();

  const silent = join(out, 'silent.mp4');
  const final = join(out, 'final.mp4');
  if (flag('no-audio')) {
    copyFileSync(silent, final);
  } else {
    const { duration, cues } = JSON.parse(readFileSync(join(out, 'cues.json'), 'utf8'));
    const wav = renderAudio({ duration, bpm: meta.bpm || 120, cues, out: join(out, 'audio.wav'), musicFrom: meta.musicFrom || 0, musicGain: meta.musicGain ?? 1 });
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', silent, '-i', wav, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', final], { stdio: 'inherit' });
  }
  const sheets = review(final, { strip: meta.strip, poster: meta.poster });
  console.log('Done:', final);
  console.log(sheets);
} finally {
  server?.kill();
}
