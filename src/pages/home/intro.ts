/**
 * The hello's clock, in seconds, shared by the word and the drop that is made
 * of its ink: the pause before the pen starts, the writing itself, the hold
 * after, and the drain out through the tail of the o. The drop swells at the
 * tail for exactly as long as the drain, and leaves the moment the word has
 * gone.
 */
export const HELLO = { start: 0.2, draw: 2, hold: 0.42, drain: 1.1 } as const;
