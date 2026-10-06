/**
 * What the tracer writes and the pen draws. A drawing is the line art of one
 * thing on a reference sheet (see scripts/trace-sketch.mjs): its strokes in
 * the order a hand would take them, and the areas that were solid ink.
 */

/** One stroke of the pen: its path, its length for pacing the writing, how heavy and how dark the ink was. */
export type Stroke = { d: string; len: number; w?: number; o?: number };

/** A solid: hair, a silhouette. Inked when the pen is `at` this share of the way through the drawing. */
export type Fill = { d: string; at: number };

export type Drawing = {
  /** The drawing's own box, `x y width height`: the viewBox of an SVG that shows it alone. */
  box: [number, number, number, number];
  strokes: Stroke[];
  fills: Fill[];
};
