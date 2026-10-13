/**
 * The home reel: thirty seconds of the home page's motion, filmed from the
 * real site as one continuous take, the camera cutting on the beat.
 *
 * 120 BPM: a beat is half a second, a bar two. The site's clock starts 0.2 s
 * in, so that the drop lands on beat 9 (4.5 s) and the cuts fall on beats.
 *
 *  0.0  the pen, close: the hello written                 (hook)
 *  2.5  the word held; the ink drains into a drop
 *  4.5  the drop lands: the map spreads from the pin
 *  5.5  the name is written as the flight heads west
 *  7.5  wide: the tools, the notes, the sheet at rest
 *  9.5  the pencil over the tools: each is drawn again, named
 * 12.5  the desk comes alive: the person, the coffee
 * 15.5  the plane, touched, flies on and comes round again
 * 19.5  the pencil draws on the page: a loop round the name
 * 22.5  rubbed out
 * 23.5  the sheet scrolls: the road, the story so far
 * 28.5  the end of the road
 */
import { EASE, EASE_IN_OUT, LINEAR, lerp } from './film.mjs';

export const meta = {
  name: 'home',
  duration: 30,
  bpm: 120,
  lead: 0.2,
  ready: '.hello-intro-mark path',
  strip: 4.4,
  poster: 8.6,
};

/** Where the pen is: the end of what has been written of the hello, in viewport px. */
const HELLO_TIP = `(() => {
  const p = document.querySelector('.hello-intro-mark path');
  if (!p) return null;
  const L = p.getTotalLength();
  const drawn = Math.min(1, Math.max(0, parseFloat(getComputedStyle(p).strokeDasharray) || 0));
  const pt = p.getPointAtLength(L * drawn);
  const m = p.getScreenCTM();
  const b = p.getBoundingClientRect();
  return { x: m.a * pt.x + m.c * pt.y + m.e, y: m.b * pt.x + m.d * pt.y + m.f, cx: b.left + b.width / 2, cy: b.top + b.height / 2, w: b.width };
})()`;

export default async function direct(film, { to }) {
  const beat = 0.5;
  const stop = (t) => Math.min(t, to);
  const full = film.full();

  /* ---- The hello, close: the camera rides a little behind the pen ---- */
  film.cue('scratch', { at: 0.4, dur: 2.0, gain: 1 });
  let word = null;
  film.follow(async (f) => {
    const tip = await f.measure(HELLO_TIP);
    if (!tip) return f.full();
    word = word || tip;
    // A wide close-up riding a little ahead of the pen; as the word is finished the camera settles on the whole of it.
    const u = Math.min(1, Math.max(0, (f.t - 0.4) / 2));
    const settle = Math.min(1, Math.max(0, (u - 0.7) / 0.3));
    const cx = lerp(tip.x + 60, tip.cx + 40, settle);
    return f.at(cx, tip.cy + 10, lerp(1150, 1240, settle));
  });
  await film.until(stop(2.5));
  if (film.t >= to) return;

  /* ---- Held, drained into a drop, thrown; a slow push in ---- */
  film.cutTo(film.at(word.cx + 60, word.cy + 10, 1180));
  film.pushTo(film.at(word.cx + 110, word.cy + 10, 1060), 2, LINEAR);
  film.cue('whoosh', { at: 3.75, dur: 0.75 });
  film.cue('plip', { at: 4.5 });
  film.cue('pop', { at: 4.56 });
  await film.until(stop(4.5));
  if (film.t >= to) return;

  /* ---- The map spreads from the pin; the flight sets off ---- */
  const scene = await film.rect('.home-scene');
  // Inside the map's own column: the name being written to the left must not show at the edge.
  film.cutTo(film.fit({ x: scene.x + 40, y: scene.cy - 400, w: 1280, h: 720 }));
  film.pushTo(film.fit({ x: scene.x + 40, y: scene.cy - 420, w: 1350, h: 760 }), 1, LINEAR);
  await film.until(stop(5.5));
  if (film.t >= to) return;

  /* ---- The name, written as the plane heads its way ---- */
  const copy = await film.rect('.home-copy');
  film.cutTo(film.at(copy.cx + 60, copy.cy - 20, 1000));
  film.pushTo(film.at(copy.cx + 80, copy.cy, 1080), 2, LINEAR);
  film.cue('scratch', { at: 4.85, dur: 1.75, gain: 0.55 });
  film.cue('scratch', { at: 6.6, dur: 0.8, gain: 0.35 });
  await film.until(stop(7.5));
  if (film.t >= to) return;

  /* ---- Wide: the sheet comes to rest ---- */
  film.cutTo(full);
  await film.until(stop(9.5));
  if (film.t >= to) return;

  /* ---- The tools under the pencil ---- */
  const tools = await Promise.all([0, 1, 2, 3, 4].map((i) => film.rect('.home-tool', i)));
  const toolsBox = { cx: (tools[0].cx + tools[4].cx) / 2, cy: tools[0].cy - 60, w: 1000 };
  film.cutTo(film.at(toolsBox.cx + 150, toolsBox.cy, 980));
  film.cursor(tools[0].cx - 80, tools[0].cy + 160, true);
  await film.moveTo(tools[0].cx, tools[0].cy, 0.5);
  for (let i = 1; i < 5; i++) {
    film.cue('click', { gain: 0.8 });
    await film.until(stop(9.5 + beat * (i + 1)));
    await film.moveTo(tools[i].cx, tools[i].cy, 0.3, EASE);
  }
  film.cue('click', { gain: 0.8 });
  await film.until(stop(12.5));
  if (film.t >= to) return;

  /* ---- The desk: the person, then the coffee ---- */
  const person = await film.rect('.home-thing', 0);
  const mug = await film.rect('.home-thing', 3);
  // Close: the desk fills the frame, the pencil large enough to be seen waking things.
  film.cutTo(film.at((person.cx + mug.cx) / 2 + 20, (person.cy + mug.cy) / 2 - 20, 720));
  film.pushTo(film.at((person.cx + mug.cx) / 2 + 40, (person.cy + mug.cy) / 2 - 10, 660), 3, LINEAR);
  await film.moveTo(person.cx + 10, person.cy - 10, 0.6);
  film.cue('click', { gain: 0.6 });
  await film.until(stop(14));
  await film.moveTo(mug.cx, mug.cy - 6, 0.4);
  film.cue('click', { gain: 0.6 });
  await film.until(stop(15.5));
  if (film.t >= to) return;

  /* ---- The plane: touched, it finishes the flight and comes round again ---- */
  const plane = await film.rect('.home-plane');
  // Inside the map's own column, so no line of the name shows at the edge.
  film.cutTo(film.fit({ x: scene.x + 30, y: scene.cy - 80 - 360, w: 1280, h: 720 }));
  await film.moveTo(plane.cx, plane.cy, 0.5);
  film.cue('click');
  await film.click();
  await film.moveTo(plane.cx + 40, plane.cy + 120, 0.5);
  film.cue('plip', { at: 17.4 });
  film.cue('whoosh', { at: 16.2, dur: 1.1 });
  film.cue('whoosh', { at: 18.1, dur: 1.3 });
  film.cue('pop', { at: 18.1 });
  await film.until(stop(19.5));
  if (film.t >= to) return;

  /* ---- The pencil: a loop drawn round the name, then rubbed out ---- */
  const nameBox = await film.rect('.home-name');
  film.cutTo(film.at(copy.cx + 120, copy.cy - 40, 1100));
  const loop = (u) => {
    // Once round and a little over, the way a hand closes a loop, with a slight wobble to the line.
    const a = -0.35 + u * (Math.PI * 2 + 0.6);
    const wob = 1 + 0.025 * Math.sin(a * 5 + 1) + 0.015 * Math.sin(a * 9);
    return { x: nameBox.cx + (nameBox.w / 2 + 28) * Math.cos(a) * wob, y: nameBox.cy + (nameBox.h / 2 + 16) * Math.sin(a) * wob };
  };
  const p0 = loop(0);
  await film.moveTo(p0.x, p0.y, 0.5);
  await film.press();
  film.cue('scratch', { dur: 1.6, gain: 0.8 });
  await film.over(1.6, (u) => {
    const p = loop(EASE_IN_OUT(u));
    film.cursor(p.x, p.y);
  });
  await film.release();
  await film.until(stop(22.5));
  if (film.t >= to) return;

  film.cutTo(full);
  const rub = await film.rect('.home-pencil-note');
  await film.moveTo(rub.cx, rub.cy, 0.5);
  film.cue('click');
  await film.click();
  await film.until(stop(23.5));
  if (film.t >= to) return;

  /* ---- The sheet scrolls: the road and the story so far ---- */
  film.cursor(-100, -100, false);
  const max = await film.measure(`(() => { const el = document.querySelector('.home-screen'); return el.scrollHeight - el.clientHeight; })()`);
  // The story is a column down the middle of the sheet: as the sheet scrolls, the camera closes slowly on the column,
  // never so tight that a line of the hero is cut at the edge while it is still on its way out.
  const more = await film.rect('.home-more');
  film.pushTo(film.at(more.cx, full.h / 2, 1500), 3, LINEAR);
  film.cue('swish', { dur: 5.5 });
  await film.over(5.5, (u) => film.scroll('.home-screen', Math.round(max * EASE_IN_OUT(u))));
  // The end of the road: the paper plane and the notes that point on; a slow push in to close, the footer kept out.
  const end = await film.rect('.home-story-end');
  film.pushTo(film.at(end.cx, end.cy - 60, 1000), 1.2, EASE);
  await film.until(stop(30));
}
