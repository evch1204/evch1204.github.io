// Traces the line art of the reference sketch into SVG polylines: threshold, thin
// (Zhang-Suen), walk the skeleton into strokes, simplify (Douglas-Peucker).
// Usage: node scripts/trace-sketch.mjs <png> <out.ts> [preview.svg]
import fs from 'node:fs';
import { PNG } from 'pngjs';

const [,, src, outTs, preview] = process.argv;
const png = PNG.sync.read(fs.readFileSync(src));
const { width: W, height: H, data } = png;
const lum = (x, y) => { const i = (y * W + x) * 4; return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]; };

/** Regions of the sheet, each with its own threshold and the boxes (text, plane) to leave out. */
const REGIONS = {
  map:      { box: [500, 210, 1500, 720], thr: 215, mask: [[525, 365, 650, 440], [1405, 415, 1490, 455], [955, 335, 1035, 385], [895, 655, 1230, 720], [1150, 700, 1300, 720]] },
  /* The pencil shading: only what is lighter than the ink, and clear of it. */
  shade:    { box: [500, 210, 1500, 720], thr: 238, above: 215, mask: [[525, 365, 650, 440], [1405, 415, 1490, 455], [955, 335, 1035, 385], [895, 655, 1230, 720], [1150, 700, 1300, 720]] },
  desk:     { box: [735, 650, 1440, 870], thr: 150, mask: [[925, 690, 1110, 790], [1178, 718, 1262, 810]] },
  icons:    { box: [80, 695, 440, 755], thr: 150, mask: [] },
  mouse:    { box: [740, 875, 800, 925], thr: 150, mask: [] },
};

function trace({ box, thr, above, mask }) {
  const [x0, y0, x1, y1] = box;
  const w = x1 - x0, h = y1 - y0;
  let img = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const X = x + x0, Y = y + y0;
    const masked = mask.some(([a, b, c, d]) => X >= a && X <= c && Y >= b && Y <= d);
    img[y * w + x] = !masked && lum(X, Y) < thr ? 1 : 0;
  }
  if (above) {
    // Shading only: take out anything within 3px of the ink, so the coastlines are not traced twice.
    const ink = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (lum(x + x0, y + y0) < above) {
      for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
        const X = x + dx, Y = y + dy;
        if (X >= 0 && Y >= 0 && X < w && Y < h) ink[Y * w + X] = 1;
      }
    }
    for (let i = 0; i < img.length; i++) if (ink[i]) img[i] = 0;
  }
  // Zhang-Suen thinning.
  const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : img[y * w + x]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const step of [0, 1]) {
      const kill = [];
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (!img[y * w + x]) continue;
        const p2 = at(x, y - 1), p3 = at(x + 1, y - 1), p4 = at(x + 1, y), p5 = at(x + 1, y + 1), p6 = at(x, y + 1), p7 = at(x - 1, y + 1), p8 = at(x - 1, y), p9 = at(x - 1, y - 1);
        const n = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
        if (n < 2 || n > 6) continue;
        const seq = [p2, p3, p4, p5, p6, p7, p8, p9, p2];
        let s = 0; for (let i = 0; i < 8; i++) if (seq[i] === 0 && seq[i + 1] === 1) s++;
        if (s !== 1) continue;
        if (step === 0 ? (p2 * p4 * p6 !== 0 || p4 * p6 * p8 !== 0) : (p2 * p4 * p8 !== 0 || p2 * p6 * p8 !== 0)) continue;
        kill.push(y * w + x);
      }
      for (const k of kill) img[k] = 0;
      if (kill.length) changed = true;
    }
  }
  // Walk the skeleton into strokes, starting from endpoints first so strokes run end to end.
  const seen = new Uint8Array(w * h);
  const nbrs = (x, y) => {
    const r = [];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const X = x + dx, Y = y + dy;
      if (at(X, Y) && !seen[Y * w + X]) r.push([X, Y]);
    }
    return r;
  };
  const degree = (x, y) => { let n = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && at(x + dx, y + dy)) n++; return n; };
  const strokes = [];
  const walk = (x, y) => {
    const pts = [[x, y]]; seen[y * w + x] = 1;
    for (;;) {
      const [cx, cy] = pts[pts.length - 1];
      const n = nbrs(cx, cy);
      if (!n.length) break;
      // Prefer continuing straight-ish: pick the neighbour closest to the current heading.
      let best = n[0];
      if (pts.length > 1 && n.length > 1) {
        const [px, py] = pts[pts.length - 2];
        const hx = cx - px, hy = cy - py;
        best = n.reduce((b, c) => ((c[0] - cx) * hx + (c[1] - cy) * hy > (b[0] - cx) * hx + (b[1] - cy) * hy ? c : b), n[0]);
      }
      seen[best[1] * w + best[0]] = 1;
      pts.push(best);
    }
    return pts;
  };
  const order = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (img[y * w + x]) order.push([x, y, degree(x, y)]);
  order.sort((a, b) => a[2] - b[2]);
  for (const [x, y] of order) {
    if (seen[y * w + x]) continue;
    const pts = walk(x, y);
    if (pts.length >= 4) strokes.push(pts);
  }
  // Douglas-Peucker.
  const simplify = (pts, tol) => {
    if (pts.length < 3) return pts;
    const d2 = (p, a, b) => {
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const L = dx * dx + dy * dy || 1;
      const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L));
      const ex = a[0] + t * dx - p[0], ey = a[1] + t * dy - p[1];
      return ex * ex + ey * ey;
    };
    let idx = 0, max = 0;
    for (let i = 1; i < pts.length - 1; i++) { const d = d2(pts[i], pts[0], pts[pts.length - 1]); if (d > max) { max = d; idx = i; } }
    if (max > tol * tol) return [...simplify(pts.slice(0, idx + 1), tol).slice(0, -1), ...simplify(pts.slice(idx), tol)];
    return [pts[0], pts[pts.length - 1]];
  };
  return strokes.map((pts) => simplify(pts, 0.85).map(([x, y]) => [x + x0, y + y0]));
}

const result = {};
for (const [name, region] of Object.entries(REGIONS)) {
  const strokes = trace(region);
  result[name] = { box: region.box, strokes };
  const pts = strokes.reduce((n, s) => n + s.length, 0);
  console.log(name, strokes.length, 'strokes', pts, 'points');
}

// A preview sheet to eyeball: every stroke drawn in ink on paper.
const svgPaths = Object.entries(result).flatMap(([n, r]) => r.strokes.map((s) => `<path ${n === 'shade' ? 'stroke="#999" stroke-width="1"' : ''} d="M${s.map(([x, y]) => `${x} ${y}`).join('L')}"/>`)).join('');
if (preview) fs.writeFileSync(preview, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" style="background:#fff"><g fill="none" stroke="#1a1a1a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${svgPaths}</g></svg>`);

// ---- The module the home screen draws from: strokes grouped by what they are, in the order a pen would write them.
const len = (s) => s.reduce((n, p, i) => (i ? n + Math.hypot(p[0] - s[i - 1][0], p[1] - s[i - 1][1]) : 0), 0);
const bbox = (s) => { const xs = s.map((p) => p[0]), ys = s.map((p) => p[1]); return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) }; };
const toD = (s) => 'M' + s.map(([x, y]) => `${x} ${y}`).join('L');
const west = (a, b) => a[0][0] - b[0][0];
const longest = (a, b) => len(b) - len(a);
const strokesOf = (name) => result[name].strokes;
const desk = strokesOf('desk');
const groups = {
  MAP: strokesOf('map').sort(west),
  SHADE: strokesOf('shade').sort(west),
  DESK: desk.filter((s) => { const b = bbox(s); return b.y0 > 785 && (b.x1 < 905 || b.x0 > 1215); }).sort(west),
  LAPTOP: desk.filter((s) => { const b = bbox(s); return b.x1 <= 1150 && !(b.y0 > 785 && b.x1 < 905); }).sort(longest),
  NOTEBOOK: desk.filter((s) => { const b = bbox(s); return b.x1 > 1150 && b.x0 < 1292 && !(b.y0 > 785 && b.x0 > 1215); }).sort(longest),
  MUG: desk.filter((s) => { const b = bbox(s); return b.x0 >= 1292 && !(b.y0 > 785 && b.x0 > 1215); }).sort(longest),
  MOUSE: strokesOf('mouse').sort(longest),
};
const iconsAt = [[80, 135], [145, 205], [220, 280], [295, 360], [375, 440]];
const ICONS = iconsAt.map(([a, b]) => strokesOf('icons').filter((s) => { const c = bbox(s); return c.x0 >= a && c.x1 <= b; }).sort(longest));
const emit = (strokes) => '[\n' + strokes.map((s) => `  { d: '${toD(s)}', len: ${len(s).toFixed(1)} },`).join('\n') + '\n]';
let ts = `/* Generated by scripts/trace-sketch.mjs from scripts/reference/home-sketch.png: the line art of the
 * reference sketch, traced stroke by stroke. Coordinates are the sketch's own, a 1536 × 1024 sheet.
 * Do not edit by hand; run \`npm run sketch\`. */

/** One stroke of the pen: its path, and its length for pacing the writing. */
export type Stroke = { d: string; len: number };

`;
for (const [name, strokes] of Object.entries(groups)) ts += `export const ${name}: Stroke[] = ${emit(strokes)};\n\n`;
ts += `/** The five tools under the blurb, left to right: TypeScript, React, Node, code, cloud. */\nexport const ICONS: Stroke[][] = [\n${ICONS.map((g) => emit(g).replace(/^/gm, '  ')).join(',\n')},\n];\n`;
fs.writeFileSync(outTs, ts);
