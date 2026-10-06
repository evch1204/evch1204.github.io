// Traces the line art of the reference sketches into the drawings the site writes with its pen.
//
// For each region of a reference sheet: upsample (the references are small), threshold, lift out
// the solid areas (hair, a pin, a plane) as filled outlines, thin what is left to a one-pixel
// skeleton (Zhang-Suen), walk the skeleton into strokes, weigh each stroke by how thick and how
// dark the ink was, simplify (Douglas-Peucker) and round the corners a pen would round.
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
        const [px, py] = pts[Math.max(0, pts.length - 4)];
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

const dist2ToSegment = (p, a, b) => {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const L = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L));
  const ex = a[0] + t * dx - p[0], ey = a[1] + t * dy - p[1];
  return ex * ex + ey * ey;
};
function simplify(pts, tol) {
  if (pts.length < 3) return pts;
  let idx = 0, max = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = dist2ToSegment(pts[i], pts[0], pts[pts.length - 1]);
    if (d > max) { max = d; idx = i; }
  }
  if (max > tol * tol) return [...simplify(pts.slice(0, idx + 1), tol).slice(0, -1), ...simplify(pts.slice(idx), tol)];
  return [pts[0], pts[pts.length - 1]];
}
const lengthOf = (pts) => pts.reduce((n, p, i) => (i ? n + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);
const bounds = (pts) => {
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
};
const f = (n) => String(Math.round(n * 10) / 10);

/**
 * A polyline as a path a pen could have drawn: Catmull-Rom curves through the points, kept sharp
 * wherever the line turns hard, and never bulging past a third of a segment.
 */
function penPath(pts, closed = false) {
  const n = pts.length;
  if (n < 3) return 'M' + pts.map((p) => f(p[0]) + ' ' + f(p[1])).join('L') + (closed ? 'Z' : '');
  const get = (i) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  const sharp = (i) => {
    if (!closed && (i <= 0 || i >= n - 1)) return true;
    const a = get(i - 1), b = get(i), c = get(i + 1);
    const ux = b[0] - a[0], uy = b[1] - a[1], vx = c[0] - b[0], vy = c[1] - b[1];
    const cos = (ux * vx + uy * vy) / ((Math.hypot(ux, uy) || 1) * (Math.hypot(vx, vy) || 1));
    return cos < 0.55; // a turn of more than ~57 degrees is a corner, not a curve
  };
  const tangent = (i) => {
    if (sharp(i)) return [0, 0];
    const a = get(i - 1), c = get(i + 1);
    return [(c[0] - a[0]) / 6, (c[1] - a[1]) / 6];
  };
  let d = 'M' + f(pts[0][0]) + ' ' + f(pts[0][1]);
  const segments = closed ? n : n - 1;
  for (let i = 0; i < segments; i++) {
    const p = get(i), q = get(i + 1);
    const seg = Math.hypot(q[0] - p[0], q[1] - p[1]);
    const clamp = ([tx, ty]) => {
      const m = Math.hypot(tx, ty);
      const cap = seg / 3;
      return m > cap ? [(tx / m) * cap, (ty / m) * cap] : [tx, ty];
    };
    const t1 = clamp(tangent(i)), t2 = clamp(tangent(i + 1));
    if (!t1[0] && !t1[1] && !t2[0] && !t2[1]) d += 'L' + f(q[0]) + ' ' + f(q[1]);
    else d += 'C' + [p[0] + t1[0], p[1] + t1[1], q[0] - t2[0], q[1] - t2[1], q[0], q[1]].map(f).join(' ');
  }
  return d + (closed ? 'Z' : '');
}

/**
 * One region of a sheet, traced. Options, all in the sheet's own pixels:
 *   src, box            which sheet, which rectangle of it
 *   thr                 how dark a pixel must be to count as ink (0-255)
 *   k                   enlargement before tracing (default 4)
 *   mask                boxes or polygons to leave out (lettering that is typed instead, a neighbour)
 *   fills               lift areas thicker than this many pixels out as filled shapes (default off)
 *   minLen              drop strokes shorter than this (default 1.6)
 *   tol                 simplification tolerance (default 0.28)
 *   to                  { x, y, scale }: where the box's corner lands, and how much bigger, in the drawing
 *   weight              multiplies the measured stroke widths (default 1)
 *   maxW                the widest a stroke may be drawn (default 2.6)
 */
function trace(region) {
  const { src, box, thr, k = 4, mask = [], fills = 0, minLen = 1.6, tol = 0.28, to = { x: box[0], y: box[1], scale: 1 }, weight = 1, maxW = 2.6 } = region;
  const S = sheet(src);
  const { w, h, px } = enlarge(S, box, k);
  const [x0, y0] = box;
  const ink = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (px[y * w + x] >= thr) continue;
    if (mask.some((m) => masked(m, x / k + x0, y / k + y0))) continue;
    ink[y * w + x] = 1;
  }
  const paper = new Uint8Array(w * h);
  for (let i = 0; i < ink.length; i++) paper[i] = ink[i] ? 0 : 1;
  const depth = distance(paper, w, h); // how deep in the ink each ink pixel sits: half the local stroke width
  const place = ([x, y]) => [(x / k) * to.scale + to.x, (y / k) * to.scale + to.y];

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
        const loops = outlines(one, w, h)
          .map((loop) => simplify([...loop, loop[0]], tol * k).slice(0, -1))
          .filter((loop) => loop.length > 2)
          .map((loop) => loop.map(place));
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
    const pts = simplify(chain, tol * k).map(([x, y]) => place([x + 0.5, y + 0.5]));
    strokes.push({
      pts,
      len: lengthOf(pts),
      w: Math.min(maxW, Math.max(0.8, Math.round(width * 10) / 10)),
      o: Math.max(0.35, Math.min(1, Math.round(((255 - lum) / 175) * 20) / 20)),
    });
  }
  return { strokes, shapes };
}

// ---- Ordering: the way a hand would go about a drawing -------------------------------------
const ORDERS = {
  /** Left to right across the sheet. */
  west: (a, b) => a.pts[0][0] - b.pts[0][0],
  /** The long outlines first, the details after. */
  longest: (a, b) => b.len - a.len,
  /** Top to bottom. */
  north: (a, b) => a.pts[0][1] - b.pts[0][1],
};
/** Each stroke picked up where the last one was put down: for dashes that follow one another along a trail. */
function trail(strokes, from) {
  const left = [...strokes], out = [];
  let at = from;
  while (left.length) {
    let best = 0, bestD = Infinity, flip = false;
    left.forEach((s, i) => {
      const a = s.pts[0], b = s.pts[s.pts.length - 1];
      const da = Math.hypot(a[0] - at[0], a[1] - at[1]), db = Math.hypot(b[0] - at[0], b[1] - at[1]);
      if (da < bestD) { bestD = da; best = i; flip = false; }
      if (db < bestD) { bestD = db; best = i; flip = true; }
    });
    const [s] = left.splice(best, 1);
    if (flip) s.pts.reverse();
    out.push(s);
    at = s.pts[s.pts.length - 1];
  }
  return out;
}

/** A drawing's regions, traced (or made), filtered and put in the order the pen takes them. */
function arrange(drawing) {
  const parts = drawing.regions.map((region) => {
    const t = typeof region.make === 'function' ? region.make() : trace(region);
    let { strokes, shapes } = t;
    if (region.pick) {
      strokes = strokes.filter((s) => region.pick(bounds(s.pts)));
      shapes = shapes.filter((s) => region.pick(bounds(s.loops.flat())));
    }
    if (region.order === 'trail') strokes = trail(strokes, region.from);
    else if (region.order !== 'made') strokes.sort(ORDERS[region.order ?? 'longest']);
    return { strokes, shapes };
  });
  const strokes = parts.flatMap((p) => p.strokes);
  const total = strokes.reduce((n, s) => n + s.len, 0) || 1;
  // A shape is inked in when the pen reaches the stroke nearest to it.
  let run = 0;
  const starts = strokes.map((s) => { const at = run / total; run += s.len; return at; });
  const shapes = parts.flatMap((p) => p.shapes).map((shape) => {
    let best = 0, bestD = Infinity;
    strokes.forEach((s, i) => {
      for (const p of s.pts) {
        const d = Math.hypot(p[0] - shape.c[0], p[1] - shape.c[1]);
        if (d < bestD) { bestD = d; best = i; }
      }
    });
    return { loops: shape.loops, at: Math.round((starts[best] ?? 0) * 100) / 100 };
  });
  // The drawing's own box; a mark the page places itself is moved to the origin.
  const all = [...strokes.map((s) => s.pts), ...shapes.flatMap((s) => s.loops)].flat();
  const b = bounds(all.length ? all : [[0, 0]]);
  const pad = 2;
  const box = [Math.floor(b.x0 - pad), Math.floor(b.y0 - pad), Math.ceil(b.x1 - b.x0 + pad * 2), Math.ceil(b.y1 - b.y0 + pad * 2)];
  if (drawing.origin) {
    const move = (pts) => pts.forEach((pt) => { pt[0] -= box[0]; pt[1] -= box[1]; });
    strokes.forEach((s) => move(s.pts));
    shapes.forEach((s) => s.loops.forEach(move));
    box[0] = 0;
    box[1] = 0;
  }
  return { strokes, shapes, box };
}

// ---- Writing the modules --------------------------------------------------------------------
const shapePath = (shape) => shape.loops.map((loop) => penPath(loop, true)).join('');
const list = (rows) => (rows.length ? '\n' + rows.join('\n') + '\n  ' : '');
function emitDrawing({ strokes, shapes, box }) {
  const lines = strokes.map((s) => "    { d: '" + penPath(s.pts) + "', len: " + f(s.len) + ', w: ' + s.w + (s.o < 1 ? ', o: ' + s.o : '') + ' },');
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
    for (const s of result.strokes) svg.push('<path d="' + penPath(s.pts) + '" stroke-width="' + s.w + '" stroke-opacity="' + s.o + '"/>');
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
