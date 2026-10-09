import { useEffect, useRef, type KeyboardEvent, type ReactNode, type Ref } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion, type HTMLMotionProps, type PanInfo } from 'motion/react';
import Frame from '@/components/sketch/Frame';
import type { Figure } from '@/content/projects';
import { EASE } from '@/lib/motion';
import { FRAME, FRAME_INNER, HERO_TRANSITION } from '@/pages/projects/hero';
import { pictureKey } from '@/pages/projects/pictures';
import type { Slides } from '@/pages/projects/useSlides';
import ProjectFigure from './ProjectFigure';
import Thumb from './Thumb';

/** The picture in the frame: as tall as it likes up to a cap, never wider than the frame allows. */
const PICTURE = 'block h-auto max-h-[640px] w-auto max-w-full';

/** The picture change: the new one comes in from the side of travel, the old one leaves the other way. */
const SLIDE = {
  enter: (direction: number) => ({ x: direction < 0 ? -40 : 40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction < 0 ? 40 : -40, opacity: 0 }),
};

/**
 * Previous / next picture: a circle drawn by hand on the frame's edge, always
 * visible — touch has no hover to reveal it. From `md` it sits half outside
 * the frame rather than over the picture. `delay` holds it back while the
 * frame is still in flight, so it does not hang in the air ahead of it.
 */
const Arrow = ({ direction, delay, onClick }: { direction: 'previous' | 'next'; delay: number; onClick: () => void }) => (
  <motion.button
    type="button"
    onClick={onClick}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1, transition: { duration: 0.3, delay, ease: EASE } }}
    aria-label={direction === 'previous' ? 'Previous picture' : 'Next picture'}
    className={`sk-frame group !absolute top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-page text-pencil transition-colors hover:text-ink focus-ring md:h-10 md:w-10 ${
      direction === 'previous' ? 'left-2 md:-left-5' : 'right-2 md:-right-5'
    }`}
  >
    <Frame r={999} weight={1.5} tone={0.9} />
    {direction === 'previous' ? (
      <ArrowLeft size={17} className="transition-transform duration-300 group-hover:-translate-x-0.5" />
    ) : (
      <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-0.5" />
    )}
  </motion.button>
);

/**
 * The hero: the project's picture in a frame ruled by hand. `caption` is the
 * row under the frame.
 *
 * With more than one picture the frame is also the page's slider: arrows on
 * its edges, a swipe, the arrow keys, and a filmstrip under the caption. The
 * frame is the shared element of the opening flight and keeps its identity
 * and its size throughout: the first picture sets the stage, invisibly, and
 * every picture — including the first — is laid over it, contained. So the
 * arrows and the page below hold still while the pictures change.
 */
export default function HeroSlider({
  pictures,
  slides,
  layoutId,
  layoutDependency,
  arrowDelay,
  caption,
  action,
  ref,
  ...motionProps
}: HTMLMotionProps<'figure'> & {
  pictures: Figure[];
  slides: Slides;
  /** Shared with the card's window, so one grows into the other; none when motion is reduced. */
  layoutId?: string;
  layoutDependency: string;
  /** How long the arrows wait before fading in. */
  arrowDelay: number;
  caption: ReactNode;
  /** A control positioned against the frame like the arrows: the demo's button, stuck on its bottom edge. */
  action?: ReactNode;
  ref?: Ref<HTMLElement>;
}) {
  const reduced = useReducedMotion();
  const { current, direction, step, show } = slides;
  const many = pictures.length > 1;
  const hero = pictures[current];
  const stripRef = useRef<HTMLUListElement>(null);

  // The filmstrip follows the hero: the active thumb is brought to the middle
  // of the strip, without scrolling the page.
  useEffect(() => {
    const strip = stripRef.current;
    const thumb = strip?.children[current] as HTMLElement | undefined;
    if (!strip || !thumb) return;
    strip.scrollTo({ left: thumb.offsetLeft - (strip.clientWidth - thumb.offsetWidth) / 2, behavior: reduced ? 'auto' : 'smooth' });
  }, [current, reduced]);

  // The arrow keys walk the pictures whenever the focus is anywhere in the hero.
  // A chord (Alt+← is the browser's back) or a held key is not a request to move.
  const onKey = (event: KeyboardEvent<HTMLElement>) => {
    if (!many || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.repeat) return;
    event.preventDefault();
    step(event.key === 'ArrowLeft' ? -1 : 1);
  };

  // Touch: a throw past ~50px of travel, momentum counted, is a step. A tap with a twitch in it is not.
  const onSwipe = (_: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.x) < 20) return;
    const thrown = info.offset.x + info.velocity.x * 0.2;
    if (thrown < -50) step(1);
    else if (thrown > 50) step(-1);
  };

  return (
    <motion.figure ref={ref} onKeyDown={onKey} {...motionProps}>
      {/* The frame hugs the picture: a tall figure is capped in height and centred rather than letterboxed. */}
      <div className="flex justify-center">
        {/* Shrink-wraps the frame, so the arrows hang off the picture's edges and not the page's. */}
        <div className="relative max-w-full">
          <motion.div
            layoutId={layoutId}
            layoutDependency={layoutDependency}
            transition={{ layout: HERO_TRANSITION }}
            className={`max-w-full ${FRAME}`}
          >
            <Frame r={16} weight={1.6} tone={0.9} double />
            <div className={`relative ${FRAME_INNER}`}>
              {many ? (
                <>
                  {/* The stage: the first picture's box, kept whichever picture is showing. */}
                  <ProjectFigure figure={pictures[0]} eager className={`${PICTURE} invisible`} />
                  <AnimatePresence initial={false} custom={direction}>
                    <motion.div
                      key={pictureKey(hero)}
                      custom={direction}
                      variants={SLIDE}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: reduced ? 0 : 0.4, ease: EASE }}
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={0.15}
                      onDragEnd={onSwipe}
                      className="absolute inset-0"
                    >
                      {/* Inert: the pointer belongs to the swipe, not to the browser's own image drag. */}
                      <ProjectFigure figure={hero} eager className="pointer-events-none h-full w-full object-contain" />
                    </motion.div>
                  </AnimatePresence>
                </>
              ) : (
                <ProjectFigure figure={hero} eager className={PICTURE} />
              )}
            </div>
          </motion.div>
          {many ? (
            <>
              <Arrow direction="previous" delay={arrowDelay} onClick={() => step(-1)} />
              <Arrow direction="next" delay={arrowDelay} onClick={() => step(1)} />
            </>
          ) : null}
          {action}
        </div>
      </div>
      {caption}
      {/* The filmstrip picks without leaving the hero; it scrolls sideways when the thumbs outgrow it. */}
      {many ? (
        <ul
          ref={stripRef}
          className="relative mt-4 flex gap-3 overflow-x-auto p-1.5 [scrollbar-width:none] md:mt-5 md:justify-center-safe [&::-webkit-scrollbar]:hidden"
        >
          {pictures.map((picture, i) => (
            <li key={pictureKey(picture)}>
              <Thumb picture={picture} index={i} active={i === current} onPick={show} className="h-14 md:h-16" />
            </li>
          ))}
        </ul>
      ) : null}
    </motion.figure>
  );
}
