import { useState } from 'react';

/**
 * Which picture the hero shows, and which way the last change travelled: the
 * new one slides in from that side, so a pick anywhere on the page reads as
 * movement rather than a cut.
 */
export function useSlides(count: number) {
  const [slide, setSlide] = useState({ current: 0, direction: 0 });
  /** Show a picture by index; the slide travels the way the index moved. */
  const show = (i: number) => setSlide((s) => ({ current: i, direction: Math.sign(i - s.current) || s.direction }));
  /** One step the way the arrow points, wrapping at the ends. */
  const step = (delta: number) => setSlide((s) => ({ current: (s.current + delta + count) % count, direction: delta }));
  return { ...slide, show, step };
}

export type Slides = ReturnType<typeof useSlides>;
