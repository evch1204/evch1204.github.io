/**
 * The hand that rules the page's boxes. A card's edge, a pill, a chip: each
 * is an outline generated to the box's measured size, with the small
 * wanderings of a line drawn without a ruler, and closed the way a pen closes
 * a shape, running a little past where it began.
 */

type Point = [number, number];

/** A small seeded generator, so a box keeps the same outline every time it is drawn. */
function seeded(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A number from a string: turns a component's id into its seed. */
export function seedOf(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

const n1 = (v: number) => Math.round(v * 10) / 10;

/** Catmull-Rom through the points, as cubic Béziers: one unbroken line. */
function smooth(pts: Point[]) {
  const at = (i: number) => pts[Math.max(0, Math.min(pts.length - 1, i))];
  let d = `M${n1(pts[0][0])} ${n1(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = at(i - 1), p = at(i), q = at(i + 1), b = at(i + 2);
    d += `C${n1(p[0] + (q[0] - a[0]) / 6)} ${n1(p[1] + (q[1] - a[1]) / 6)} ${n1(q[0] - (b[0] - p[0]) / 6)} ${n1(q[1] - (b[1] - p[1]) / 6)} ${n1(q[0])} ${n1(q[1])}`;
  }
  return d;
}

/**
 * The outline of a `w` × `h` box with rounded corners, drawn clockwise from
 * the top-left. `wander` is how far the line strays, in px. Closed with `Z`
 * for a shape to be filled; left open, with the pen's overshoot, for a line.
 */
export function boxOutline(w: number, h: number, radius: number, seed: number, { wander = 0.55, closed = false } = {}) {
  const r = Math.max(0, Math.min(radius, w / 2, h / 2));
  const rnd = seeded(seed);
  const stray = (scale = 1) => (rnd() - 0.5) * 2 * wander * scale;
  const pts: Point[] = [];
  const edge = (x0: number, y0: number, x1: number, y1: number) => {
    const steps = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / 48));
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      pts.push([x0 + (x1 - x0) * t + stray(), y0 + (y1 - y0) * t + stray()]);
    }
  };
  const corner = (cx: number, cy: number, from: number) => {
    const steps = r > 12 ? 3 : r > 3 ? 2 : 1;
    for (let i = 0; i < steps; i++) {
      const a = from + (Math.PI / 2) * (i / steps);
      pts.push([cx + Math.cos(a) * r + stray(0.5), cy + Math.sin(a) * r + stray(0.5)]);
    }
  };
  edge(r, 0, w - r, 0);
  corner(w - r, r, -Math.PI / 2);
  edge(w, r, w, h - r);
  corner(w - r, h - r, 0);
  edge(w - r, h, r, h);
  corner(r, h - r, Math.PI / 2);
  edge(0, h - r, 0, r);
  corner(r, r, Math.PI);
  if (closed) return `${smooth([...pts, pts[0]])}Z`;
  // The pen comes back round, misses its own start by a hair and runs on a little.
  const [sx, sy] = pts[0];
  const run = Math.min(16, w * 0.1);
  pts.push([sx + stray(0.4), sy + 0.9 + stray(0.4)], [sx + run, sy + 1.3 + stray(0.6)]);
  return smooth(pts);
}
