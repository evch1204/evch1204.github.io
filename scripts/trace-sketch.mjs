// Traces the line art of the reference sketches into the drawings the site writes with its pen.
//
// For each region of a reference sheet: upsample (the references are small), threshold, lift out
// the solid areas (hair, a plane) as filled outlines, and thin what is left to a one-pixel skeleton
// (Zhang-Suen). The skeleton is walked into strokes, and each stroke is then redrawn the way a
// steady hand would have drawn it: the pixel jitter is smoothed out along its length, real corners
// are kept, and clean Bézier curves are fitted to what remains (Schneider's algorithm). Each stroke
// keeps how thick and how dark the ink was.
//
// Usage: node scripts/trace-sketch.mjs [preview-dir]
//   Writes the generated modules listed in OUTPUTS; with a directory, also an SVG of each for the eye.
import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';
import { OUTPUTS } from './sketch-regions.mjs';

const REF = 'scripts/reference/';
const sheets = new Map();
function sheet(name) {
  if (!sheets.has(name)) {
    const png = PNG.sync.read(fs.readFileSync(REF + name));
    const lum = new Float32Array(png.width * png.height);
    for (let i = 0; i < lum.length; i++) lum[i] = 0.299 * png.data[i * 4] + 0.587 * png.data[i * 4 + 1] + 0.114 * png.data[i * 4 + 2];
    sheets.set(name, { W: png.width, H: png.height, lum });
  }
  return sheets.get(name);
}

/** Bicubic (Catmull-Rom) enlargement of a box of the sheet, `k` times. */
function enlarge({ W, H, lum }, [x0, y0, x1, y1], k) {
  const w = (x1 - x0) * k, h = (y1 - y0) * k;
  const out = new Float32Array(w * h);
  const at = (x, y) => lum[Math.min(H - 1, Math.max(0, y)) * W + Math.min(W - 1, Math.max(0, x))];
  const weights = (t) => [((-t + 2) * t - 1) * t / 2, ((3 * t - 5) * t * t + 2) / 2, ((-3 * t + 4) * t + 1) * t / 2, (t - 1) * t * t / 2];
  for (let y = 0; y < h; y++) {
    const fy = (y + 0.5) / k + y0 - 0.5, iy = Math.floor(fy), wy = weights(fy - iy);
    for (let x = 0; x < w; x++) {
      const fx = (x + 0.5) / k + x0 - 0.5, ix = Math.floor(fx), wx = weights(fx - ix);
      let v = 0;
      for (let j = 0; j < 4; j++) {
        let row = 0;
        for (let i = 0; i < 4; i++) row += wx[i] * at(ix - 1 + i, iy - 1 + j);
        v += wy[j] * row;
      }
      out[y * w + x] = v;
    }
  }
  return { w, h, px: out };
}

const inPolygon = (poly, x, y) => {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
/** A mask is a box `[x0, y0, x1, y1]` or a polygon `[[x, y], ...]`, in the sheet's own pixels. */
const masked = (mask, x, y) => (typeof mask[0] === 'number' ? x >= mask[0] && x <= mask[2] && y >= mask[1] && y <= mask[3] : inPolygon(mask, x, y));

/** Chamfer distance, in pixels, from every pixel to the nearest set pixel of `target`. */
function distance(target, w, h) {
  const d = new Float32Array(w * h).fill(1e9);
  for (let i = 0; i < d.length; i++) if (target[i]) d[i] = 0;
  const A = 1, B = Math.SQRT2;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    let v = d[i];
    if (x > 0) v = Math.min(v, d[i - 1] + A);
    if (y > 0) {
      v = Math.min(v, d[i - w] + A);
      if (x > 0) v = Math.min(v, d[i - w - 1] + B);
      if (x < w - 1) v = Math.min(v, d[i - w + 1] + B);
    }
    d[i] = v;
  }
  for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) {
    const i = y * w + x;
    let v = d[i];
    if (x < w - 1) v = Math.min(v, d[i + 1] + A);
    if (y < h - 1) {
      v = Math.min(v, d[i + w] + A);
      if (x < w - 1) v = Math.min(v, d[i + w + 1] + B);
      if (x > 0) v = Math.min(v, d[i + w - 1] + B);
    }
    d[i] = v;
  }
  return d;
}

function thin(img, w, h) {
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
        let s = 0;
        for (let i = 0; i < 8; i++) if (seq[i] === 0 && seq[i + 1] === 1) s++;
        if (s !== 1) continue;
        if (step === 0 ? p2 * p4 * p6 !== 0 || p4 * p6 * p8 !== 0 : p2 * p4 * p8 !== 0 || p2 * p6 * p8 !== 0) continue;
        kill.push(y * w + x);
      }
      for (const i of kill) img[i] = 0;
      if (kill.length) changed = true;
    }
  }
}

/** Walks a skeleton into chains of pixels, end to end where it can, straight on at a fork. */
function walk(img, w, h) {
  const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : img[y * w + x]);
  const seen = new Uint8Array(w * h);
  const open = (x, y) => {
    const r = [];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && at(x + dx, y + dy) && !seen[(y + dy) * w + x + dx]) r.push([x + dx, y + dy]);
    return r;
  };
  const degree = (x, y) => {
    let n = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && at(x + dx, y + dy)) n++;
    return n;
  };
  const run = (x, y) => {
    const pts = [[x, y]];
    seen[y * w + x] = 1;
    for (;;) {
      const [cx, cy] = pts[pts.length - 1];
      const n = open(cx, cy);
      if (!n.length) break;
      let best = n[0];
      if (pts.length > 1 && n.length > 1) {
        // Straight on at a fork: the heading is read over the last few pixels, not the last one.
        const [px, py] = pts[Math.max(0, pts.length - 6)];
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
  const chains = [];
  for (const [x, y] of order) {
    if (seen[y * w + x]) continue;
    const pts = run(x, y);
    // A chain that started mid-line (a loop, or what a fork left) may run on the other way too.
    const back = open(x, y);
    if (back.length) pts.unshift(...run(back[0][0], back[0][1]).reverse());
    chains.push(pts);
  }
  return chains;
}

/** The outlines of a mask, as closed loops on the pixel grid's edges (outer edges and holes alike). */
function outlines(mask, w, h) {
  const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : mask[y * w + x]);
  // Directed edges with the ink on the right, keyed by their start corner.
  const next = new Map();
  const add = (ax, ay, bx, by) => {
    const key = ay * (w + 1) + ax;
    if (!next.has(key)) next.set(key, []);
    next.get(key).push([bx, by]);
  };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!mask[y * w + x]) continue;
    if (!at(x, y - 1)) add(x, y, x + 1, y);
    if (!at(x + 1, y)) add(x + 1, y, x + 1, y + 1);
    if (!at(x, y + 1)) add(x + 1, y + 1, x, y + 1);
    if (!at(x - 1, y)) add(x, y + 1, x, y);
  }
  const loops = [];
  for (const [start, outs] of next) {
    while (outs.length) {
      const loop = [];
      let key = start;
      for (;;) {
        const list = next.get(key);
        if (!list || !list.length) break;
        const [bx, by] = list.pop();
        loop.push([key % (w + 1), Math.floor(key / (w + 1))]);
        key = by * (w + 1) + bx;
        if (key === start) break;
      }
      if (loop.length > 3) loops.push(loop);
    }
  }
  return loops;
}

// ---- Geometry -------------------------------------------------------------------------------
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const mul = (a, s) => [a[0] * s, a[1] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const norm = (a) => Math.hypot(a[0], a[1]);
const unit = (a) => { const n = norm(a) || 1; return [a[0] / n, a[1] / n]; };
const lengthOf = (pts) => pts.reduce((n, p, i) => (i ? n + norm(sub(p, pts[i - 1])) : 0), 0);
const bounds = (pts) => {
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
};
const f = (n) => String(Math.round(n * 10) / 10);

/**
 * Smooths a chain along its own length with a Gaussian `sigma` points wide. The ends stay where
 * they are (the window narrows towards them), so a stroke keeps its reach and a corner, once the
 * chain is cut there, keeps its point. A closed chain is smoothed all the way round.
 */
function smoothChain(pts, sigma, closed = false) {
  if (sigma <= 0 || pts.length < 4) return pts;
  const n = pts.length, reach = Math.ceil(sigma * 3);
  const out = [];
  for (let i = 0; i < n; i++) {
    const r = closed ? reach : Math.min(reach, i, n - 1 - i);
    if (r === 0) { out.push(pts[i]); continue; }
    const s = closed ? sigma : Math.min(sigma, r / 2 + 0.01);
    let x = 0, y = 0, total = 0;
    for (let j = -r; j <= r; j++) {
      const p = pts[closed ? (i + j + n * 8) % n : i + j];
      const wgt = Math.exp(-(j * j) / (2 * s * s));
      x += p[0] * wgt; y += p[1] * wgt; total += wgt;
    }
    out.push([x / total, y / total]);
  }
  return out;
}

/** Where a chain turns hard: indices of real corners, found on a lightly smoothed copy over a window of `span` points. */
function corners(pts, span, degrees) {
  const calm = smoothChain(pts, span / 3);
  const n = calm.length, limit = Math.cos((degrees * Math.PI) / 180);
  const turn = new Float32Array(n).fill(1);
  for (let i = span; i < n - span; i++) turn[i] = dot(unit(sub(calm[i], calm[i - span])), unit(sub(calm[i + span], calm[i])));
  const found = [];
  for (let i = span; i < n - span; i++) {
    if (turn[i] > limit) continue;
    let sharpest = true;
    for (let j = Math.max(span, i - span); j <= Math.min(n - span - 1, i + span); j++) if (turn[j] < turn[i]) { sharpest = false; break; }
    if (sharpest && (!found.length || i - found[found.length - 1] > span)) found.push(i);
  }
  return found;
}

// ---- Schneider's curve fitting: a run of points as the fewest cubic Béziers within `error` -----
const bez = (c, t) => {
  const u = 1 - t;
  return [u * u * u * c[0][0] + 3 * u * u * t * c[1][0] + 3 * u * t * t * c[2][0] + t * t * t * c[3][0], u * u * u * c[0][1] + 3 * u * u * t * c[1][1] + 3 * u * t * t * c[2][1] + t * t * t * c[3][1]];
};
const bezD1 = (c, t) => {
  const u = 1 - t;
  return add(add(mul(sub(c[1], c[0]), 3 * u * u), mul(sub(c[2], c[1]), 6 * u * t)), mul(sub(c[3], c[2]), 3 * t * t));
};
const bezD2 = (c, t) => add(mul(add(sub(c[2], mul(c[1], 2)), c[0]), 6 * (1 - t)), mul(add(sub(c[3], mul(c[2], 2)), c[1]), 6 * t));

function fitCubic(pts, t1, t2, error) {
  const first = pts[0], last = pts[pts.length - 1];
  if (pts.length === 2) {
    const d = norm(sub(last, first)) / 3;
    return [[first, add(first, mul(t1, d)), add(last, mul(t2, d)), last]];
  }
  // Chord-length parameters.
  let u = [0];
  for (let i = 1; i < pts.length; i++) u.push(u[i - 1] + norm(sub(pts[i], pts[i - 1])));
  const total = u[u.length - 1] || 1;
  u = u.map((v) => v / total);

  const generate = (params) => {
    let c00 = 0, c01 = 0, c11 = 0, x0 = 0, x1 = 0;
    for (let i = 0; i < pts.length; i++) {
      const t = params[i], s = 1 - t;
      const b0 = s * s * s, b1 = 3 * s * s * t, b2 = 3 * s * t * t, b3 = t * t * t;
      const a1 = mul(t1, b1), a2 = mul(t2, b2);
      c00 += dot(a1, a1); c01 += dot(a1, a2); c11 += dot(a2, a2);
      const tmp = sub(pts[i], add(mul(first, b0 + b1), mul(last, b2 + b3)));
      x0 += dot(a1, tmp); x1 += dot(a2, tmp);
    }
    const det = c00 * c11 - c01 * c01;
    let al = Math.abs(det) > 1e-9 ? (x0 * c11 - x1 * c01) / det : 0;
    let ar = Math.abs(det) > 1e-9 ? (c00 * x1 - c01 * x0) / det : 0;
    const seg = norm(sub(last, first));
    // A degenerate or runaway solution falls back to the plain third-of-the-chord handles.
    if (al < seg * 1e-3 || ar < seg * 1e-3 || al > seg * 2.5 || ar > seg * 2.5) al = ar = seg / 3;
    return [first, add(first, mul(t1, al)), add(last, mul(t2, ar)), last];
  };
  const worst = (curve, params) => {
    let max = 0, at = Math.floor(pts.length / 2);
    for (let i = 1; i < pts.length - 1; i++) {
      const d = sub(bez(curve, params[i]), pts[i]);
      const e = dot(d, d);
      if (e > max) { max = e; at = i; }
    }
    return [max, at];
  };

  let curve = generate(u);
  let [max, split] = worst(curve, u);
  if (max < error * error) return [curve];
  if (max < error * error * 16) {
    for (let pass = 0; pass < 4; pass++) {
      // Newton-Raphson: move each parameter towards the nearest point of the curve.
      u = u.map((t, i) => {
        const d = sub(bez(curve, t), pts[i]), d1 = bezD1(curve, t), d2 = bezD2(curve, t);
        const den = dot(d1, d1) + dot(d, d2);
        return Math.abs(den) < 1e-9 ? t : Math.max(0, Math.min(1, t - dot(d, d1) / den));
      });
      curve = generate(u);
      [max, split] = worst(curve, u);
      if (max < error * error) return [curve];
    }
  }
  const centre = unit(sub(pts[Math.max(0, split - 1)], pts[Math.min(pts.length - 1, split + 1)]));
  return [...fitCubic(pts.slice(0, split + 1), t1, centre, error), ...fitCubic(pts.slice(split), mul(centre, -1), t2, error)];
}

/** Evenly spaced points along a chain, `step` apart, ends included. */
function resample(pts, step) {
  const out = [pts[0]];
  let carried = 0;
  for (let i = 1; i < pts.length; i++) {
    const seg = norm(sub(pts[i], pts[i - 1]));
    let at = step - carried;
    while (at <= seg) {
      out.push(add(pts[i - 1], mul(sub(pts[i], pts[i - 1]), at / seg)));
      at += step;
    }
    carried = (carried + seg) % step;
  }
  const last = pts[pts.length - 1];
  if (norm(sub(out[out.length - 1], last)) > step * 0.3) out.push(last);
  else out[out.length - 1] = last;
  return out;
}

/**
 * A walked chain as a steady hand would have drawn it. The chain is cut at its real corners;
 * each run between them is smoothed, and is then either a straight line (if it never strays from
 * one by more than `straight`) or the fewest cubic curves that stay within `fit` of it.
 * Returns segments: `[a, b]` for a line, `[a, c1, c2, b]` for a curve.
 */
function steady(pts, { smooth, fit, straight, cornerSpan, cornerAngle }) {
  const cuts = [0, ...corners(pts, cornerSpan, cornerAngle), pts.length - 1];
  const segs = [];
  for (let c = 0; c < cuts.length - 1; c++) {
    let run = pts.slice(cuts[c], cuts[c + 1] + 1);
    if (run.length < 2) continue;
    run = smoothChain(run, smooth);
    const a = run[0], b = run[run.length - 1];
    const chord = norm(sub(b, a)) || 1;
    let stray = 0;
    for (const p of run) stray = Math.max(stray, Math.abs((p[0] - a[0]) * (b[1] - a[1]) - (p[1] - a[1]) * (b[0] - a[0])) / chord);
    if (stray <= straight || run.length < 4) { segs.push([a, b]); continue; }
    const even = resample(run, Math.max(1, fit * 1.5));
    if (even.length < 3) { segs.push([a, b]); continue; }
    const lead = Math.min(3, even.length - 1);
    segs.push(...fitCubic(even, unit(sub(even[lead], even[0])), unit(sub(even[even.length - 1 - lead], even[even.length - 1])), fit));
  }
  return segs;
}

const segsPath = (segs) => {
  let d = '';
  let at = null;
  for (const s of segs) {
    const a = s[0], b = s[s.length - 1];
    if (!at || Math.abs(at[0] - a[0]) > 0.05 || Math.abs(at[1] - a[1]) > 0.05) d += 'M' + f(a[0]) + ' ' + f(a[1]);
    d += s.length === 2 ? 'L' + f(b[0]) + ' ' + f(b[1]) : 'C' + [s[1][0], s[1][1], s[2][0], s[2][1], b[0], b[1]].map(f).join(' ');
    at = b;
  }
  return d;
};
/** Points along the fitted segments: for a stroke's length, its box, and where it starts and ends. */
const segsPoints = (segs) => segs.flatMap((s) => (s.length === 2 ? [s[0], s[1]] : Array.from({ length: 9 }, (_, i) => bez(s, i / 8))));

/**
 * One region of a sheet, traced. Options, all in the sheet's own pixels:
 *   src, box            which sheet, which rectangle of it
 *   thr                 how dark a pixel must be to count as ink (0-255)
 *   k                   enlargement before tracing (default 4)
 *   mask                boxes or polygons to leave out (lettering that is typed instead, a neighbour)
 *   keep                boxes or polygons: when given, only ink inside one of them is traced
 *   clearOf             { thr, by }: leave out ink within `by` pixels of anything darker than `thr`; for a
 *                       second, lighter pass that picks up the faint lines a darker pass left behind
 *   fills               lift areas thicker than this many pixels out as filled shapes (default off)
 *   minLen              drop strokes shorter than this (default 1.6)
 *   smooth              how far along a stroke the hand evens out its wobble (default 1.1)
 *   fit                 how far a fitted curve may sit from the smoothed stroke (default 0.4)
 *   straight            a run that strays less than this from a ruler is a straight line (default 0.45)
 *   cornerAngle         a turn sharper than this many degrees is a corner and is kept (default 48)
 *   to                  { x, y, scale }: where the box's corner lands, and how much bigger, in the drawing
 *   weight              multiplies the measured stroke widths (default 1)
 *   maxW                the widest a stroke may be drawn (default 2.6)
 */
function trace(region) {
  const {
    src, box, thr, k = 4, mask = [], keep, clearOf, fills = 0, minLen = 1.6, smooth = 1.1, fit = 0.4, straight = 0.45, cornerAngle = 48,
    to = { x: box[0], y: box[1], scale: 1 }, weight = 1, maxW = 2.6,
  } = region;
  const S = sheet(src);
  const { w, h, px } = enlarge(S, box, k);
  const [x0, y0] = box;
  const ink = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (px[y * w + x] >= thr) continue;
    if (mask.some((m) => masked(m, x / k + x0, y / k + y0))) continue;
    if (keep && !keep.some((m) => masked(m, x / k + x0, y / k + y0))) continue;
    ink[y * w + x] = 1;
  }
  if (clearOf) {
    const dark = new Uint8Array(w * h);
    for (let i = 0; i < dark.length; i++) dark[i] = px[i] < clearOf.thr ? 1 : 0;
    const fromDark = distance(dark, w, h);
    for (let i = 0; i < ink.length; i++) if (fromDark[i] <= clearOf.by * k) ink[i] = 0;
  }
  const paper = new Uint8Array(w * h);
  for (let i = 0; i < ink.length; i++) paper[i] = ink[i] ? 0 : 1;
  const depth = distance(paper, w, h); // how deep in the ink each ink pixel sits: half the local stroke width
  const place = ([x, y]) => [(x / k) * to.scale + to.x, (y / k) * to.scale + to.y];
  const hand = { smooth: smooth * k, fit: fit * k, straight: straight * k, cornerSpan: Math.round(2.4 * k), cornerAngle };

  // Solid areas: the cores deeper than half the fill width, grown back out to the ink's own edge.
  const shapes = [];
  if (fills) {
    const r = (fills * k) / 2;
    const core = new Uint8Array(w * h);
    let any = false;
    for (let i = 0; i < ink.length; i++) if (ink[i] && depth[i] >= r) { core[i] = 1; any = true; }
    if (any) {
      const fromCore = distance(core, w, h);
      const solid = new Uint8Array(w * h);
      for (let i = 0; i < ink.length; i++) if (ink[i] && fromCore[i] <= r * 1.25) { solid[i] = 1; ink[i] = 0; }
      // Each connected solid is one shape: its outer edge and its holes together.
      const label = new Int32Array(w * h).fill(-1);
      let count = 0;
      for (let i = 0; i < solid.length; i++) {
        if (!solid[i] || label[i] >= 0) continue;
        const stack = [i];
        label[i] = count;
        while (stack.length) {
          const j = stack.pop(), jx = j % w, jy = (j - jx) / w;
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            const nx = jx + dx, ny = jy + dy;
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
            const n = ny * w + nx;
            if (solid[n] && label[n] < 0) { label[n] = count; stack.push(n); }
          }
        }
        count++;
      }
      for (let c = 0; c < count; c++) {
        const one = new Uint8Array(w * h);
        let area = 0, cx = 0, cy = 0;
        for (let i = 0; i < one.length; i++) if (label[i] === c) { one[i] = 1; area++; cx += i % w; cy += Math.floor(i / w); }
        if (area < fills * fills * k * k * 0.6) {
          // Too small to be a shape: give it back to the pen.
          for (let i = 0; i < one.length; i++) if (one[i]) ink[i] = 1;
          continue;
        }
        // A shape's edge is smoothed all the way round and fitted like any other line.
        const loops = outlines(one, w, h)
          .filter((loop) => loop.length > 8)
          .map((loop) => {
            const round = smoothChain(loop, hand.smooth * 0.4, true);
            const even = resample([...round, round[0]], Math.max(1, hand.fit * 1.5));
            const tangent = unit(sub(even[Math.min(2, even.length - 1)], even[even.length - 3] ?? even[0]));
            return fitCubic(even, tangent, mul(tangent, -1), hand.fit).map((s) => s.map(place));
          });
        if (loops.length) shapes.push({ loops, c: place([cx / area, cy / area]) });
      }
    }
  }

  thin(ink, w, h);
  const strokes = [];
  for (const chain of walk(ink, w, h)) {
    if (lengthOf(chain) / k < minLen) continue;
    // Weight and darkness, read along the chain from the ink it was thinned out of.
    const depths = chain.map(([x, y]) => depth[y * w + x]).sort((a, b) => a - b);
    const width = ((2 * depths[Math.floor(depths.length / 2)]) / k) * to.scale * weight;
    const lum = chain.reduce((n, [x, y]) => n + px[y * w + x], 0) / chain.length;
    const segs = steady(chain.map(([x, y]) => [x + 0.5, y + 0.5]), hand).map((s) => s.map(place));
    if (!segs.length) continue;
    strokes.push({
      segs,
      w: Math.min(maxW, Math.max(0.8, Math.round(width * 10) / 10)),
      o: Math.max(0.35, Math.min(1, Math.round(((255 - lum) / 175) * 20) / 20)),
    });
  }
  return { strokes, shapes };
}

/** Strokes a script made rather than traced (see sketch-bridge.mjs): polylines, fitted like the rest. */
function made({ strokes }) {
  const hand = { smooth: 0.6, fit: 0.25, straight: 0.3, cornerSpan: 3, cornerAngle: 50 };
  return {
    strokes: strokes.map((s) => ({ segs: steady(resample(s.pts, 0.6), hand), w: s.w, o: s.o })).filter((s) => s.segs.length),
    shapes: [],
  };
}

// ---- Ordering: the way a hand would go about a drawing -------------------------------------
const startOf = (s) => s.segs[0][0];
const endOf = (s) => { const last = s.segs[s.segs.length - 1]; return last[last.length - 1]; };
const ORDERS = {
  /** Left to right across the sheet. */
  west: (a, b) => startOf(a)[0] - startOf(b)[0],
  /** Right to left: each stroke is turned to run westwards, too. */
  east: (a, b) => startOf(b)[0] - startOf(a)[0],
  /** The long outlines first, the details after. */
  longest: (a, b) => b.len - a.len,
  /** Top to bottom. */
  north: (a, b) => startOf(a)[1] - startOf(b)[1],
};
const reversed = (s) => ({ ...s, segs: s.segs.map((seg) => [...seg].reverse()).reverse() });
/** Each stroke picked up where the last one was put down: for dashes that follow one another along a trail. */
function trail(strokes, from) {
  const left = [...strokes], out = [];
  let at = from;
  while (left.length) {
    let best = 0, bestD = Infinity, flip = false;
    left.forEach((s, i) => {
      const da = norm(sub(startOf(s), at)), db = norm(sub(endOf(s), at));
      if (da < bestD) { bestD = da; best = i; flip = false; }
      if (db < bestD) { bestD = db; best = i; flip = true; }
    });
    const [s] = left.splice(best, 1);
    out.push(flip ? reversed(s) : s);
    at = endOf(out[out.length - 1]);
  }
  return out;
}

/** A stroke turned the way a right hand draws it: left to right, or top to bottom if it is more upright than level. */
function byHand(s) {
  const a = startOf(s), b = endOf(s);
  const dx = b[0] - a[0], dy = b[1] - a[1];
  return (Math.abs(dx) >= Math.abs(dy) ? dx < 0 : dy < 0) ? reversed(s) : s;
}

/** A region is traced once, however many drawings pick their strokes out of it. */
const traced = new Map();
function traceOnce(region) {
  const key = JSON.stringify(region, (_, v) => (typeof v === 'function' ? undefined : v));
  if (!traced.has(key)) traced.set(key, trace(region));
  return traced.get(key);
}

/** A drawing's regions, traced (or made), filtered and put in the order the pen takes them. */
function arrange(drawing) {
  const parts = drawing.regions.map((region) => {
    const t = typeof region.make === 'function' ? made(region.make()) : traceOnce(region);
    let strokes = t.strokes.map((s) => { const pts = segsPoints(s.segs); return { ...s, pts, len: lengthOf(pts) }; });
    let shapes = t.shapes;
    if (region.pick) {
      strokes = strokes.filter((s) => region.pick(bounds(s.pts), s));
      shapes = shapes.filter((s) => region.pick(bounds(s.loops.flat(2)), null));
    }
    if (region.order === 'trail') strokes = trail(strokes, region.from);
    else if (region.order === 'east') strokes = strokes.map(byHand).map(reversed).sort(ORDERS.east);
    else if (region.order !== 'made') strokes = strokes.map(byHand).sort(ORDERS[region.order ?? 'longest']);
    return { strokes, shapes };
  });
  let strokes = parts.flatMap((p) => p.strokes);
  const total = strokes.reduce((n, s) => n + s.len, 0) || 1;
  // A shape is inked in when the pen reaches the stroke nearest to it.
  let run = 0;
  const starts = strokes.map((s) => { const at = run / total; run += s.len; return at; });
  let shapes = parts.flatMap((p) => p.shapes).map((shape) => {
    let best = 0, bestD = Infinity;
    strokes.forEach((s, i) => {
      for (const p of s.pts) {
        const d = norm(sub(p, shape.c));
        if (d < bestD) { bestD = d; best = i; }
      }
    });
    return { loops: shape.loops, at: Math.round((starts[best] ?? 0) * 100) / 100 };
  });
  // The drawing's own box; a mark the page places itself is moved to the origin.
  const all = [...strokes.flatMap((s) => s.pts), ...shapes.flatMap((s) => s.loops.flat(2))];
  const b = bounds(all.length ? all : [[0, 0]]);
  const pad = 2;
  const box = [Math.floor(b.x0 - pad), Math.floor(b.y0 - pad), Math.ceil(b.x1 - b.x0 + pad * 2), Math.ceil(b.y1 - b.y0 + pad * 2)];
  if (drawing.origin) {
    const move = (p) => [p[0] - box[0], p[1] - box[1]];
    strokes = strokes.map((s) => ({ ...s, segs: s.segs.map((seg) => seg.map(move)) }));
    shapes = shapes.map((s) => ({ ...s, loops: s.loops.map((loop) => loop.map((seg) => seg.map(move))) }));
    box[0] = 0;
    box[1] = 0;
  }
  return { strokes, shapes, box };
}

// ---- Writing the modules --------------------------------------------------------------------
const shapePath = (shape) => shape.loops.map((loop) => segsPath(loop) + 'Z').join('');
const list = (rows) => (rows.length ? '\n' + rows.join('\n') + '\n  ' : '');
function emitDrawing({ strokes, shapes, box }) {
  const lines = strokes.map((s) => "    { d: '" + segsPath(s.segs) + "', len: " + f(s.len) + ', w: ' + s.w + (s.o < 1 ? ', o: ' + s.o : '') + ' },');
  const solids = shapes.map((s) => "    { d: '" + shapePath(s) + "', at: " + s.at + ' },');
  return '{\n  box: [' + box.join(', ') + '],\n  strokes: [' + list(lines) + '],\n  fills: [' + list(solids) + '],\n}';
}

const previewDir = process.argv[2];
for (const output of OUTPUTS) {
  let ts =
    '/* Generated by scripts/trace-sketch.mjs from the reference sketches in scripts/reference:\n * ' +
    output.about +
    "\n * Do not edit by hand; change scripts/sketch-regions.mjs and run `npm run sketch`. */\nimport type { Drawing } from '@/components/sketch/drawing';\n\n";
  const svg = [];
  let box = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  let shelf = 0;
  for (const drawing of output.drawings) {
    const result = arrange(drawing);
    console.log(output.file, drawing.name, result.strokes.length, 'strokes', result.shapes.length, 'fills');
    ts += '/** ' + drawing.about + ' */\nexport const ' + drawing.name + ': Drawing = ' + emitDrawing(result) + ';\n\n';
    // In the preview, marks moved to the origin are shelved side by side so they do not overprint.
    const dx = drawing.origin ? shelf : 0;
    if (drawing.origin) shelf += result.box[2] + 16;
    const [bx, by, bw, bh] = result.box;
    box = { x0: Math.min(box.x0, bx + dx), y0: Math.min(box.y0, by), x1: Math.max(box.x1, bx + dx + bw), y1: Math.max(box.y1, by + bh) };
    svg.push('<g transform="translate(' + dx + ' 0)">');
    for (const s of result.strokes) svg.push('<path d="' + segsPath(s.segs) + '" stroke-width="' + s.w + '" stroke-opacity="' + s.o + '"/>');
    for (const s of result.shapes) svg.push('<path d="' + shapePath(s) + '" fill="#1f1f22" fill-rule="evenodd" stroke="none"/>');
    svg.push('</g>');
  }
  fs.writeFileSync(output.file, ts.trimEnd() + '\n');
  if (previewDir) {
    const pad = 12, W = box.x1 - box.x0 + pad * 2, H = box.y1 - box.y0 + pad * 2;
    const zoom = Math.min(4, 1500 / W);
    const name = path.basename(path.dirname(output.file)) + '-' + path.basename(output.file).replace(/\.ts$/, '') + '.svg';
    fs.writeFileSync(
      path.join(previewDir, name),
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + [box.x0 - pad, box.y0 - pad, W, H].join(' ') + '" width="' + W * zoom + '" height="' + H * zoom +
        '" style="background:#fafafa"><g fill="none" stroke="#1f1f22" stroke-linecap="round" stroke-linejoin="round">' + svg.join('') + '</g></svg>',
    );
  }
}
