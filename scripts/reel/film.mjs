/**
 * The film engine: the real site, filmed one frame at a time under its own
 * clock (see clock.js), with a camera, a cursor and a cue sheet for sound.
 *
 * A reel script directs it: `await film.until(t)` renders up to reel time t,
 * `film.cutTo` and `film.pushTo` move the camera (a crop of the viewport,
 * rendered at full size), `film.moveTo`, `press`, `release` and `click` drive
 * the pointer, `film.scroll` scrolls a container, and `film.cue` notes a
 * sound for music.mjs to place. Every frame is a pure function of time and
 * of what the script has done by then: two renders are identical.
 */
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from './cdp.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const CLOCK = readFileSync(join(HERE, 'clock.js'), 'utf8');

/* The site's own pencil (its hero cursor), drawn into the frame since a headless screenshot shows no pointer. */
const PENCIL =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='30' height='30' viewBox='0 0 24 24' fill='%23fafafa' stroke='%231f1f22' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z'/%3E%3Cpath d='m15 5 4 4'/%3E%3C/svg%3E";
const CURSOR_JS = `(() => {
  const d = document.createElement('div');
  d.id = '__cursor';
  d.style.cssText = ${JSON.stringify(`position:fixed;left:0;top:0;width:30px;height:30px;z-index:2147483647;pointer-events:none;opacity:0;background:url("${PENCIL}") no-repeat;`)};
  document.body.appendChild(d);
  window.__cursor = (x, y, on) => { d.style.opacity = on ? '1' : '0'; d.style.transform = 'translate(' + (x - 3) + 'px,' + (y - 27) + 'px)'; };
})()`;

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, u) => a + (b - a) * u;
/** Fast out, long settle: the site's own curve, as a function. */
export const EASE = (u) => 1 - Math.pow(1 - clamp(u), 3);
export const EASE_IN_OUT = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
export const LINEAR = (u) => clamp(u);

/** A damped spring from 0 to 1 as a pure function of time, in seconds. */
export function spring(t, k = 170, d = 26) {
  if (t <= 0) return 0;
  const w0 = Math.sqrt(k);
  const z = d / (2 * w0);
  if (z < 1) {
    const wd = w0 * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + ((z * w0) / wd) * Math.sin(wd * t));
  }
  return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
}

export class Film {
  /**
   * @param {object} o
   * @param {string} o.url        the page to film
   * @param {string} o.out        folder for silent.mp4, cues.json and frames
   * @param {number} [o.width]    output width (default 1920)
   * @param {number} [o.height]   output height (default 1080)
   * @param {number} [o.fps]      output frames per second (default 60)
   * @param {number} [o.sub]      sub-frames blended into each frame for motion blur (default 2)
   * @param {object} [o.viewport] the browser's size (default 1920x1080)
   * @param {number} [o.lead]     seconds of film before the site's clock starts (default 0)
   * @param {string} [o.ready]    a selector that must be on the page before the film starts
   * @param {number} [o.port]     DevTools port
   * @param {string} [o.format]   'jpeg' (default, quality 95: four times faster at full size) or 'png' for lossless frames
   */
  constructor(o) {
    this.o = { width: 1920, height: 1080, fps: 60, sub: 2, lead: 0, port: 9340, format: 'jpeg', ...o, out: resolve(o.out) };
    this.o.viewport = { width: 1920, height: 1080, ...(o.viewport || {}) };
    this.t = 0;
    this.frames = 0;
    this.cues = [];
    this.pointer = { x: -100, y: -100, on: false, down: false, dirty: false };
    this.scrolls = new Map();
    this.cam = { from: null, to: this.full(), start: 0, dur: 0, ease: EASE, follow: null };
    this.anims = new Map();
    this.log = [];
  }

  full() {
    return { x: 0, y: 0, w: this.o.viewport.width, h: this.o.viewport.height };
  }

  async open() {
    const { url, out, width, height, fps, sub, viewport, port, ready } = this.o;
    mkdirSync(out, { recursive: true });
    this.c = await launch({ port, width: viewport.width, height: viewport.height, profile: join(out, 'profile') });
    const c = this.c;
    await c.send('Page.addScriptToEvaluateOnNewDocument', { source: CLOCK });
    await c.send('Animation.enable');
    await c.send('Animation.setPlaybackRate', { playbackRate: 0 });
    c.on('Animation.animationStarted', ({ animation }) => this.anims.set(animation.id, { vStart: this.siteMs(), id: animation.id }));
    c.on('Animation.animationCanceled', ({ id }) => this.anims.delete(id));
    c.on('Runtime.exceptionThrown', (p) => this.log.push(p.exceptionDetails?.exception?.description || p.exceptionDetails?.text));
    await c.send('Page.navigate', { url });
    for (let i = 0; i < 200; i++) {
      const ok = await c.evaluate(`document.fonts.status === 'loaded' && !!document.querySelector(${JSON.stringify(ready || 'body')})`);
      if (ok) break;
      await new Promise((r) => setTimeout(r, 100));
    }
    await c.evaluate(CURSOR_JS);

    const rate = fps * sub;
    // Chrome's crops come back a pixel short now and then (1079 tall for 1080): the stream is scaled to size
    // before anything else, and ffmpeg is told not to rebuild its filter graph on a size change, which drops frames.
    const blur = sub > 1 ? `,tmix=frames=${sub},select='eq(mod(n\,${sub})\,${sub - 1})',setpts=N/${fps}/TB` : '';
    this.ff = spawn(
      'ffmpeg',
      ['-y', '-loglevel', 'error', '-reinit_filter', '0', '-f', 'image2pipe', '-framerate', String(rate), '-i', '-', '-vf', `scale=${width}:${height}${blur}`, '-r', String(fps), '-c:v', 'libx264', '-crf', '16', '-pix_fmt', 'yuv420p', join(out, 'silent.mp4')],
      { stdio: ['pipe', 'inherit', 'inherit'] },
    );
    this.ffDone = new Promise((r) => this.ff.on('close', r));
    return this;
  }

  /** The site's clock, in ms, at the film's current time. */
  siteMs() {
    return Math.max(0, (this.t - this.o.lead) * 1000);
  }

  /* ---- Camera: a crop of the viewport, always in the output's proportions, always inside the viewport ---- */

  fit(r) {
    const { width: W, height: H } = this.o.viewport;
    const aspect = this.o.width / this.o.height;
    let w = Math.min(W, r.w);
    let h = w / aspect;
    if (h > H) {
      h = H;
      w = h * aspect;
    }
    const cx = r.cx ?? r.x + r.w / 2;
    const cy = r.cy ?? r.y + r.h / 2;
    const x = clamp(cx - w / 2, 0, W - w);
    const y = clamp(cy - h / 2, 0, H - h);
    return { x, y, w, h };
  }

  /** A crop `w` wide centred on (cx, cy). */
  at(cx, cy, w) {
    return this.fit({ cx, cy, w, h: w / (this.o.width / this.o.height) });
  }

  cutTo(rect) {
    this.cam = { from: null, to: this.fit(rect), start: this.t, dur: 0, ease: EASE, follow: null };
  }

  /** Moves the camera from where it is to `rect` over `seconds`. */
  pushTo(rect, seconds, ease = EASE) {
    this.cam = { from: this.camRect(), to: this.fit(rect), start: this.t, dur: seconds, ease, follow: null };
  }

  /** The camera is placed each frame by `fn(film)`, which returns a rect; for following a moving thing. */
  follow(fn) {
    this.cam = { from: null, to: this.camRect(), start: this.t, dur: 0, ease: EASE, follow: fn };
  }

  camRect() {
    const { from, to, start, dur, ease } = this.cam;
    if (!from || dur <= 0) return to;
    const u = ease(clamp((this.t - start) / dur));
    return { x: lerp(from.x, to.x, u), y: lerp(from.y, to.y, u), w: lerp(from.w, to.w, u), h: lerp(from.h, to.h, u) };
  }

  /* ---- Pointer and page ---- */

  /** Puts the pointer somewhere; the move is sent with the next frame. */
  cursor(x, y, on = true) {
    this.pointer = { ...this.pointer, x, y, on, dirty: true };
  }

  async press() {
    const { x, y } = this.pointer;
    this.pointer.down = true;
    await this.c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1, pointerType: 'mouse' });
  }

  async release() {
    const { x, y } = this.pointer;
    this.pointer.down = false;
    await this.c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1, pointerType: 'mouse' });
  }

  /** Glides the pointer to (x, y) over `seconds`, rendering as it goes. */
  async moveTo(x, y, seconds, ease = EASE_IN_OUT) {
    const from = { x: this.pointer.x, y: this.pointer.y };
    if (!this.pointer.on) {
      this.cursor(x, y);
      await this.until(this.t + seconds);
      return;
    }
    await this.over(seconds, (u) => this.cursor(lerp(from.x, x, ease(u)), lerp(from.y, y, ease(u))));
  }

  /** A press and release where the pointer is, `seconds` apart. */
  async click(seconds = 0.12) {
    await this.press();
    await this.until(this.t + seconds);
    await this.release();
  }

  /** Runs `expression` in the page and returns its value. */
  measure(expression) {
    return this.c.evaluate(expression);
  }

  /** The box of the `index`th element matching `selector`, in viewport px. */
  async rect(selector, index = 0) {
    const r = await this.c.evaluate(
      `(() => { const el = document.querySelectorAll(${JSON.stringify(selector)})[${index}]; if (!el) return null; const b = el.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height, cx: b.left + b.width / 2, cy: b.top + b.height / 2 }; })()`,
    );
    if (!r) throw new Error(`nothing matches ${selector}[${index}]`);
    return r;
  }

  /** Scrolls the container matching `selector` to `top` px with the next frame. */
  scroll(selector, top) {
    this.scrolls.set(selector, top);
  }

  /** Notes a sound at the film's current time (or at `at`), for music.mjs. */
  cue(name, opts = {}) {
    this.cues.push({ name, at: this.t, ...opts });
  }

  /* ---- Rendering ---- */

  /** Renders `seconds` of film, calling `fn(u)` before every sub-frame with u from 0 to 1. */
  async over(seconds, fn) {
    const start = this.t;
    const end = start + seconds;
    while (this.t < end - 1e-9) {
      const u = clamp((this.t - start) / seconds);
      fn?.(u);
      await this.frame();
    }
    fn?.(1);
  }

  /** Renders up to reel time `seconds`. */
  async until(seconds) {
    while (this.t < seconds - 1e-9) await this.frame();
  }

  async frame() {
    const c = this.c;
    const step = 1 / (this.o.fps * this.o.sub);
    this.t += step;
    // The page: scrolls, the pointer, then the clock.
    for (const [sel, top] of this.scrolls) await c.evaluate(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (el) el.scrollTop = ${top}; })()`);
    this.scrolls.clear();
    const p = this.pointer;
    if (p.dirty) {
      await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y, button: p.down ? 'left' : 'none', buttons: p.down ? 1 : 0, pointerType: 'mouse' });
      await c.evaluate(`window.__cursor(${p.x}, ${p.y}, ${p.on})`);
      p.dirty = false;
    }
    const ms = this.siteMs();
    await c.evaluate(`window.__seek(${ms})`);
    for (const [id, a] of this.anims) {
      await c.send('Animation.seekAnimations', { animations: [id], currentTime: Math.max(0, ms - a.vStart) }).catch(() => this.anims.delete(id));
    }
    // The camera, then the frame.
    const r = this.cam.follow ? this.fit(await this.cam.follow(this)) : this.camRect();
    const { data } = await c.send('Page.captureScreenshot', {
      format: this.o.format,
      ...(this.o.format === 'jpeg' ? { quality: 95 } : {}),
      clip: { x: r.x, y: r.y, width: r.w, height: r.h, scale: this.o.width / r.w },
      captureBeyondViewport: false,
    });
    const png = Buffer.from(data, 'base64');
    if (!this.ff.stdin.write(png)) await new Promise((res) => this.ff.stdin.once('drain', res));
    this.frames++;
    if (this.frames % (this.o.fps * this.o.sub) === 0) process.stdout.write(`\r  ${this.t.toFixed(1)}s`);
  }

  async finish() {
    this.ff.stdin.end();
    await this.ffDone;
    writeFileSync(join(this.o.out, 'cues.json'), JSON.stringify({ duration: this.t, cues: this.cues }, null, 1));
    if (this.log.length) writeFileSync(join(this.o.out, 'page-errors.log'), this.log.join('\n'));
    this.c.close();
    process.stdout.write(`\n  ${this.frames} frames, ${this.t.toFixed(2)}s\n`);
  }
}
