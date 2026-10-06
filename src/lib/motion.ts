/** The site's one easing curve for entrances and exits: fast out, long settle. */
export const EASE = [0.23, 1, 0.32, 1] as const;

/** The pen that writes the hello and the doodles: eases off the mark and slows gently into the last stroke. */
export const PEN_EASE = [0.45, 0.02, 0.2, 1] as const;
