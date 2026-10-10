/**
 * The ink bloom's geometry: the demo button's drop spreading into the
 * video's stage. One blob, always 24 cubic segments in the same order — a
 * blend of an ellipse and the stage's rounded rectangle, sized, carried
 * along a slight arc and wobbled at the rim — so from the first frame to the
 * last it is the same shape changing, and nothing pops. Pure functions, in
 * the viewport's pixels; the stage writes what they return straight into
 * its one path.
 */

type Point = [number, number];
/** A box on screen, in the viewport's coordinates. */
type Box = { x: number; y: number; w: number; h: number };
type Segment = [Point, Point, Point, Point];

/** The stage's corner radius: the blob at rest is the player's box exactly. */
const RADIUS = 16;

const n1 = (v: number) => Math.round(v * 10) / 10;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerp2 = (p: Point, q: Point, t: number): Point => [lerp(p[0], q[0], t), lerp(p[1], q[1], t)];
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (x: number) => x * x * (3 - 2 * x);

/** cubic-bezier(x1, y1, x2, y2) as a function of progress: the same curve a stylesheet would name. */
const bezier = (x1: number, y1: number, x2: number, y2: number) => (x: number) => {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  let lo = 0, hi = 1, t = x;
  for (let i = 0; i < 48; i++) {
    t = (lo + hi) / 2;
    const cx = 3 * x1 * t * (1 - t) * (1 - t) + 3 * x2 * t * t * (1 - t) + t * t * t;
    if (cx < x) lo = t;
    else hi = t;
  }
  return 3 * y1 * t * (1 - t) * (1 - t) + 3 * y2 * t * t * (1 - t) + t * t * t;
};

/** Ink's own pace: slow to leave the drop, quick across the page, a long calm settle. */
export const liquid = bezier(0.6, 0, 0.1, 1);
/** In and out, gently: the overshoot coming back to rest. */
const easeInOut = bezier(0.45, 0, 0.55, 1);

/**
 * Where the blob's centre is, `c` of the way from the drop to the stage's
 * centre: a slight arc, a quadratic bow whose control point is lifted off
 * the straight line, upwards, by 12% of its length.
 */
function centreAt(drop: Point, target: Box, c: number): Point {
  const o: Point = [target.x + target.w / 2, target.y + target.h / 2];
  const dx = o[0] - drop[0], dy = o[1] - drop[1];
  const length = Math.hypot(dx, dy) || 1;
  let nx = -dy / length, ny = dx / length;
  if (ny > 0) [nx, ny] = [-nx, -ny];
  const q: Point = [(drop[0] + o[0]) / 2 + nx * length * 0.12, (drop[1] + o[1]) / 2 + ny * length * 0.12];
  const u = 1 - c;
  return [u * u * drop[0] + 2 * u * c * q[0] + c * c * o[0], u * u * drop[1] + 2 * u * c * q[1] + c * c * o[1]];
}

/**
 * How much the rim may wobble at growth `g`: nothing while the ink is still a
 * drop, all of it once it has spread three hundred pixels.
 */
export const wobbleAt = (target: Box, d0: number, g: number) => clamp(((target.w - d0) * g) / 300);

/**
 * The blob, as a path. `target` is the stage's box, `drop` the swollen drop's
 * centre and `d0` its diameter; `g` is the growth, 0 the drop and 1 the
 * stage (a little over 1 as it overshoots); `c` the centre's progress along
 * the arc; `amp` the rim's wobble in px; `t` the wobble's clock, in seconds.
 *
 * The rounded rectangle's 24 segments — six along each long side, four down
 * each short one, one round each corner — are matched one for one with arcs
 * of the ellipse through the same angles, and the two are blended: all
 * ellipse while the ink is small, all rectangle by the time it fills the box.
 * The wobble pushes each node out along the ellipse's normal by three
 * harmonics running round the rim and a little of each node's own.
 */
export function blobPath(target: Box, drop: Point, d0: number, g: number, c: number, amp: number, t: number): string {
  const a = (d0 + (target.w - d0) * g) / 2;
  const b = (d0 + (target.h - d0) * g) / 2;
  const r = Math.min(RADIUS, a, b);
  const k = 0.5523 * r;
  const rect: Segment[] = [];
  const line = (p: Point, q: Point, n: number) => {
    for (let j = 0; j < n; j++) {
      const p0 = lerp2(p, q, j / n), p1 = lerp2(p, q, (j + 1) / n);
      rect.push([p0, lerp2(p0, p1, 1 / 3), lerp2(p0, p1, 2 / 3), p1]);
    }
  };
  const bend = (p: Point, t1: Point, q: Point, t2: Point) =>
    rect.push([p, [p[0] + k * t1[0], p[1] + k * t1[1]], [q[0] - k * t2[0], q[1] - k * t2[1]], q]);
  line([-a + r, -b], [a - r, -b], 6);
  bend([a - r, -b], [1, 0], [a, -b + r], [0, 1]);
  line([a, -b + r], [a, b - r], 4);
  bend([a, b - r], [0, 1], [a - r, b], [-1, 0]);
  line([a - r, b], [-a + r, b], 6);
  bend([-a + r, b], [-1, 0], [-a, b - r], [0, -1]);
  line([-a, b - r], [-a, -b + r], 4);
  bend([-a, -b + r], [0, -1], [-a + r, -b], [1, 0]);

  // Each segment's start, as an angle round the ellipse, always increasing.
  const n = rect.length;
  const phi: number[] = [];
  for (let i = 0; i < n; i++) {
    let f = Math.atan2(rect[i][0][1] / b, rect[i][0][0] / a);
    if (i > 0) while (f <= phi[i - 1]) f += Math.PI * 2;
    phi.push(f);
  }
  phi.push(phi[0] + Math.PI * 2);
  const onEllipse = (f: number): Point => [a * Math.cos(f), b * Math.sin(f)];
  const along = (f: number): Point => [-a * Math.sin(f), b * Math.cos(f)];
  const blend = smooth(clamp((Math.min(g, 1) - 0.25) / 0.75));
  const w = t * Math.PI * 2;

  const nodes: Point[] = [];
  for (let i = 0; i < n; i++) {
    const f = phi[i];
    const nx = b * Math.cos(f), ny = a * Math.sin(f);
    const nl = Math.hypot(nx, ny) || 1;
    const wob =
      amp === 0
        ? 0
        : amp *
          (0.5 * Math.sin(3 * f + w * 1.7 + 0.6) +
            0.3 * Math.sin(5 * f - w * 2.4 + 2.2) +
            0.2 * Math.sin(w * (1.9 + 0.13 * ((i * 7) % 5)) + i * 2.399));
    nodes.push([(nx / nl) * wob, (ny / nl) * wob]);
  }
  nodes.push(nodes[0]);

  const [cx, cy] = centreAt(drop, target, c);
  let d = '';
  for (let i = 0; i < n; i++) {
    const f0 = phi[i], f1 = phi[i + 1];
    const kk = (4 / 3) * Math.tan((f1 - f0) / 4);
    const p0 = onEllipse(f0), p1 = onEllipse(f1), t0 = along(f0), t1 = along(f1);
    const arc: Segment = [p0, [p0[0] + kk * t0[0], p0[1] + kk * t0[1]], [p1[0] - kk * t1[0], p1[1] - kk * t1[1]], p1];
    const s = rect[i];
    const off = [nodes[i], nodes[i], nodes[i + 1], nodes[i + 1]];
    const pt = (j: number) =>
      `${n1(cx + lerp(arc[j][0], s[j][0], blend) + off[j][0])} ${n1(cy + lerp(arc[j][1], s[j][1], blend) + off[j][1])}`;
    if (i === 0) d += `M${pt(0)}`;
    d += `C${pt(1)} ${pt(2)} ${pt(3)}`;
  }
  return `${d}Z`;
}

/** The bloom's growth at `t` seconds into the spread: 3% over at 92% of it, then settling back. */
export function bloomAt(t: number): { g: number; c: number; damp: number } {
  const u = Math.min(1, t / 0.8);
  const e = u < 0.92 ? liquid(u / 0.92) : 1;
  const g = u <= 0.92 ? 1.03 * e : 1.03 - 0.03 * easeInOut((u - 0.92) / 0.08);
  // The rim keeps moving until the ink has filled the box, then comes to rest.
  const damp = t < 0.62 ? 1 : t > 0.86 ? 0 : 0.5 * (1 + Math.cos((Math.PI * (t - 0.62)) / 0.24));
  return { g, c: e, damp };
}
