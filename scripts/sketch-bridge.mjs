// The Golden Gate Bridge, for the view from the About page's window. Neither reference sheet has
// one in line art, so this is not traced: it is constructed from the bridge's own proportions
// (two portal towers of four stepped cells above the deck, a main cable sagging to just over the
// roadway at mid-span, side spans falling to the anchorages, suspenders at even spacing) and then
// given a pencil's wobble, so it sits with the traced skyline around it.

/** A small seeded generator: the same bridge every run. */
function seeded(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const lengthOf = (pts) => pts.reduce((n, p, i) => (i ? n + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);

/**
 * @param {object} at
 * @param {number} at.left   x where the bridge runs off the picture (the window frame)
 * @param {number} at.west   x of the first tower's centre
 * @param {number} at.east   x of the second tower's centre
 * @param {number} at.shore  x where the roadway meets the land
 * @param {number} at.deck   y of the roadway at the first tower
 * @param {number} at.top    y of the tower tops
 * @param {number} at.water  y of the waterline at the piers
 * @param {number} at.rise   how much the roadway climbs across the picture, in px (perspective)
 */
export function goldenGate({ left, west, east, shore, deck, top, water, rise = 0 }) {
  const rnd = seeded(101);
  const wobble = (v, amount = 0.22) => v + (rnd() - 0.5) * 2 * amount;
  const strokes = [];
  /** A straight run as a pencil would draw it: a few points along the way, none quite on the ruler. */
  const line = (a, b, w, o, steps = Math.max(2, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 6))) => {
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      pts.push([wobble(a[0] + (b[0] - a[0]) * t), wobble(a[1] + (b[1] - a[1]) * t)]);
    }
    strokes.push({ pts, len: lengthOf(pts), w, o });
  };
  const curve = (fn, x0, x1, w, o) => {
    const steps = Math.max(4, Math.round(Math.abs(x1 - x0) / 2.5));
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const x = x0 + ((x1 - x0) * i) / steps;
      pts.push([wobble(x, 0.12), wobble(fn(x), 0.16)]);
    }
    strokes.push({ pts, len: lengthOf(pts), w, o });
  };
  const deckAt = (x) => deck - (rise * (x - left)) / (shore - left);
  const height = deck - top;

  // The roadway: its top line and the stiffening truss under it.
  line([left, deckAt(left)], [shore, deckAt(shore)], 1, 0.7, 9);
  line([left, deckAt(left) + 1.5], [shore - 1, deckAt(shore) + 1.5], 0.8, 0.5, 9);

  // The towers: two legs leaning in a little, four cells above the roadway that shorten as they climb, a pier below.
  for (const x of [west, east]) {
    const base = 2.1, crown = 1.5;
    const d = deckAt(x);
    line([x - base, water], [x - crown, top], 1.1, 0.75, 5);
    line([x + base, water], [x + crown, top], 1.1, 0.75, 5);
    const half = (y) => crown + ((base - crown) * (y - top)) / (water - top);
    for (const share of [0, 0.2, 0.43, 0.7]) {
      const y = top + height * share;
      line([x - half(y), y], [x + half(y), y], 0.9, 0.7, 2);
      line([x - half(y), y + 1.1], [x + half(y), y + 1.1], 0.8, 0.55, 2);
    }
    line([x - half(d + 3.2), d + 3.2], [x + half(d + 3.2), d + 3.2], 0.9, 0.6, 2);
    line([x - base - 1, water], [x + base + 1, water], 1, 0.7, 2);
  }

  // The main cable between the towers: a parabola that comes down to just over the roadway.
  const mid = (west + east) / 2, halfSpan = (east - west) / 2;
  const low = deckAt(mid) - 1.6;
  const main = (x) => low - (low - top) * ((x - mid) / halfSpan) ** 2;
  curve(main, west, east, 0.9, 0.65);
  // The side spans: off the picture to the west, down to the anchorage on the shore to the east.
  const westLow = deckAt(left) - 3.2;
  const westSpan = (x) => top + (westLow - top) * ((west - x) / (west - left)) ** 1.25;
  curve(westSpan, west, left, 0.9, 0.65);
  const anchor = shore - 2.5;
  const eastLow = deckAt(anchor) - 0.6;
  const eastSpan = (x) => top + (eastLow - top) * ((x - east) / (anchor - east)) ** 1.25;
  curve(eastSpan, east, anchor, 0.9, 0.65);

  // Suspenders, evenly hung, each from the cable to the roadway.
  const hang = (fn, from, to) => {
    for (let x = from + 2.6; x < to - 1.4; x += 2.6) {
      const y = fn(x);
      if (deckAt(x) - y > 1.6) line([x, y], [x, deckAt(x)], 0.8, 0.4, 2);
    }
  };
  hang(westSpan, left, west - 1.5);
  hang(main, west + 1.5, east - 1.5);
  hang(eastSpan, east + 1.5, anchor);

  // The bay under it.
  for (const [x, y, run] of [[left + 3, water + 2.4, 9], [west + 8, water + 1.4, 11], [mid + 4, water + 3.2, 8], [east + 4, water + 1.8, 7]]) {
    curve((v) => y + Math.sin((v - x) * 0.9) * 0.45, x, x + run, 0.8, 0.45);
  }
  return { strokes, shapes: [] };
}
