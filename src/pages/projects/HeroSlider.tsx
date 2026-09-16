import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode, type Ref } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion, type HTMLMotionProps, type PanInfo } from 'motion/react';
import type { Figure } from '@/content/projects';
import { pad2 } from '@/lib/format';
import { EASE } from '@/lib/motion';
import ProjectFigure from './ProjectFigure';
import { HERO_TRANSITION } from './ProjectPanel';

/** The About page's photo frame: white border, big radius, the soft shadow. Thinner and tighter on a phone. */
export const FRAME =
  'overflow-hidden rounded-[1.25rem] border-4 border-white bg-white shadow-[0_16px_40px_rgba(0,0,0,0.12)] md:rounded-[2rem] md:border-[6px] md:shadow-[0_24px_64px_rgba(0,0,0,0.12)]';

/** What a picture is, for keys and de-duplication: the image path, or the drawing's id. */
export const pictureKey = (figure: Figure) => figure.src ?? figure.illustration;

/** The picture in the frame: as tall as it likes up to a cap, never wider than the frame allows. */
const PICTURE = 'block h-auto max-h-[640px] w-auto max-w-full';

/** The picture change: the new one comes in from the side of travel, the old one leaves the other way. */
const SLIDE = {
  enter: (direction: number) => ({ x: direction < 0 ? -40 : 40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction < 0 ? 40 : -40, opacity: 0 }),
};

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

/**
 * One picture as a button at the tile ratio, the active one ringed. The
 * picture is contained rather than cropped: a card crop is more than twice as
 * wide as the tile, and filling would slice the words out of it — the room it
 * leaves is white on a white screenshot. `className` carries the size, the
 * rounding and any shadow; the filmstrip and the gallery differ there and
 * nowhere else.
 */
export const Thumb = ({
  picture,
  index,
  active,
  onPick,
  className,
}: {
  picture: Figure;
  index: number;
  active: boolean;
  onPick: (i: number) => void;
  className: string;
}) => (
  <button
    type="button"
    onClick={() => onPick(index)}
    aria-current={active ? 'true' : undefined}
    aria-label={`Show picture ${pad2(index + 1)}: ${picture.caption}`}
    className={`block aspect-[16/10] shrink-0 overflow-hidden border border-zinc-200 bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 ${
      active ? 'ring-2 ring-zinc-900 ring-offset-2' : ''
    } ${className}`}
  >
    <ProjectFigure figure={picture} className="h-full w-full object-contain" />
  </button>
);

/**
 * Previous / next picture: a white disc on the frame's edge, always visible —
 * touch has no hover to reveal it. From `md` it sits half outside the frame,
 * on the zinc band, rather than over the picture. `delay` holds it back while
 * the frame is still in flight, so it does not hang in the air ahead of it.
 */
const Arrow = ({ direction, delay, onClick }: { direction: 'previous' | 'next'; delay: number; onClick: () => void }) => (
  <motion.button
    type="button"
    onClick={onClick}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1, transition: { duration: 0.3, delay, ease: EASE } }}
    aria-label={direction === 'previous' ? 'Previous picture' : 'Next picture'}
    className={`absolute top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-colors hover:text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 md:h-9 md:w-9 ${
      direction === 'previous' ? 'left-2 md:-left-5' : 'right-2 md:-right-5'
    }`}
  >
    {direction === 'previous' ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
  </motion.button>
);

/**
 * The hero band: from `md`, the photo frame on the card sill's zinc band,
 * reaching a little past the content edges — as far as the gutter allows
 * until the content is centred with room to spare. On a phone the frame takes
 * the full width on its own. `caption` is the row under the frame.
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
    <motion.figure
      ref={ref}
      onKeyDown={onKey}
      className="md:-mx-3 md:rounded-[2rem] md:border md:border-zinc-100 md:bg-zinc-50 md:px-8 md:pb-6 md:pt-8 lg:px-10 lg:pb-7 lg:pt-10 xl:-mx-8"
      {...motionProps}
    >
      {/* The frame hugs the picture: a tall figure is capped in height and centred rather than letterboxed. */}
      <div className="flex justify-center">
        {/* Shrink-wraps the frame, so the arrows hang off the picture's edges and not the band's. */}
        <div className="relative max-w-full">
          <motion.div
            layoutId={layoutId}
            layoutDependency={layoutDependency}
            transition={{ layout: HERO_TRANSITION }}
            className={`relative max-w-full ${FRAME}`}
          >
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
          </motion.div>
          {many ? (
            <>
              <Arrow direction="previous" delay={arrowDelay} onClick={() => step(-1)} />
              <Arrow direction="next" delay={arrowDelay} onClick={() => step(1)} />
            </>
          ) : null}
        </div>
      </div>
      {caption}
      {/* The filmstrip picks without leaving the band; it scrolls sideways when the thumbs outgrow it. */}
      {many ? (
        <ul
          ref={stripRef}
          className="relative mt-4 flex gap-2.5 overflow-x-auto p-1 [scrollbar-width:none] md:mt-5 md:justify-center-safe [&::-webkit-scrollbar]:hidden"
        >
          {pictures.map((picture, i) => (
            <li key={pictureKey(picture)}>
              <Thumb picture={picture} index={i} active={i === current} onPick={show} className="h-14 rounded-lg md:h-16" />
            </li>
          ))}
        </ul>
      ) : null}
    </motion.figure>
  );
}
