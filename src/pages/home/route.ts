/**
 * The pen's route: a smooth curve through a list of points, sampled flat so
 * the pen can be placed along it by arc length. Catmull-Rom through the
 * points, as cubic Béziers.
 */

export type Point = [number, number];

type Route = {
  /** Arc length at which the curve passes each point, in order. */
  nodeAt: number[];
  total: number;
  samples: Point[];
  cum: number[];
};

const SAMPLES_PER_SEGMENT = 24;

export function buildRoute(points: Point[]): Route {
  const samples: Point[] = [points[0]];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];
    const c1: Point = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Point = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    for (let k = 1; k <= SAMPLES_PER_SEGMENT; k++) {
      const t = k / SAMPLES_PER_SEGMENT;
      const u = 1 - t;
      samples.push([
        u * u * u * p1[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p2[0],
        u * u * u * p1[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p2[1],
      ]);
    }
  }
  const cum = [0];
  for (let j = 1; j < samples.length; j++) {
    const dx = samples[j][0] - samples[j - 1][0];
    const dy = samples[j][1] - samples[j - 1][1];
    cum.push(cum[j - 1] + Math.hypot(dx, dy));
  }
  const nodeAt = points.map((_, i) => cum[i * SAMPLES_PER_SEGMENT]);
  return { nodeAt, total: cum[cum.length - 1], samples, cum };
}

/** Where the curve is, `len` along it. */
export function pointAt(route: Route, len: number): Point {
  const { samples, cum } = route;
  let lo = 0;
  let hi = cum.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] < len) lo = mid + 1;
    else hi = mid;
  }
  const i = Math.max(lo, 1);
  const seg = cum[i] - cum[i - 1] || 1;
  const t = Math.min(1, Math.max(0, (len - cum[i - 1]) / seg));
  return [
    samples[i - 1][0] + (samples[i][0] - samples[i - 1][0]) * t,
    samples[i - 1][1] + (samples[i][1] - samples[i - 1][1]) * t,
  ];
}

/** The centre of an element, in the coordinates of `base`'s box. */
export function centreIn(el: Element, base: DOMRect): Point {
  const r = el.getBoundingClientRect();
  return [r.left + r.width / 2 - base.left, r.top + r.height / 2 - base.top];
}
