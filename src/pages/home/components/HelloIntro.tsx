import { useEffect, type RefObject } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { PEN_EASE } from '@/lib/motion';

/**
 * One continuous monoline stroke, the Mac's own hello: its points read off
 * the login screen's lettering, so the h climbs its loop, the e leans up into
 * an eye that crosses at its foot, the two l's are tall open loops with the
 * downstroke crossing the upstroke, and the o closes with a tail. Upright, as
 * it is there.
 */
const HELLO_PATH =
  'M 4 88 C 5.2 87.5, 8.9 86, 11.3 84.8 C 13.6 83.6, 16 82.3, 18.2 80.8 ' +
  'C 20.4 79.4, 22.6 77.8, 24.6 76.1 C 26.6 74.4, 28.4 72.5, 30.1 70.5 ' +
  'C 31.8 68.5, 33.3 66.3, 34.8 64.1 C 36.3 61.9, 37.6 59.6, 38.9 57.3 ' +
  'C 40.2 54.9, 41.4 52.6, 42.6 50.2 C 43.8 47.8, 44.9 45.4, 46 43 C 47.1 40.5, 48.2 38.1, 49.3 35.7 ' +
  'C 50.5 33.3, 51.6 30.9, 52.8 28.5 C 54 26.1, 55.2 23.7, 56.3 21.3 C 57.5 18.9, 58.9 16.4, 59.7 14.2 ' +
  'C 60.5 11.9, 61.4 9.4, 61.3 7.8 C 61.1 6.3, 60 4.9, 58.7 4.8 C 57.4 4.7, 55.2 5.7, 53.6 7.1 ' +
  'C 52 8.5, 50.5 10.8, 49.2 13 C 47.9 15.2, 46.8 17.7, 45.9 20.1 C 44.9 22.6, 44.2 25.2, 43.4 27.7 ' +
  'C 42.6 30.3, 42 32.8, 41.3 35.4 C 40.7 38, 40.1 40.6, 39.5 43.2 C 39 45.8, 38.5 48.4, 38 51.1 ' +
  'C 37.5 53.7, 37.1 56.3, 36.7 59 C 36.3 61.6, 35.9 64.2, 35.6 66.9 C 35.3 69.5, 35 72.2, 34.8 74.8 ' +
  'C 34.5 77.5, 34.3 80.1, 34.2 82.8 C 34.1 85.5, 34 88.2, 34.1 90.7 C 34.2 93.3, 34.4 96.2, 34.8 97.9 ' +
  'C 35.1 99.6, 35.7 101, 36.3 100.9 C 36.9 100.8, 37.6 99, 38.4 97.3 C 39.2 95.5, 40.1 92.6, 41 90.3 ' +
  'C 42 87.9, 43 85.3, 44.1 82.9 C 45.1 80.4, 46.2 78, 47.3 75.6 C 48.4 73.1, 49.5 70.7, 50.6 68.3 ' +
  'C 51.7 65.8, 52.7 63.4, 53.9 61 C 55.1 58.6, 56.3 56.2, 57.7 54 C 59.1 51.8, 60.6 49.5, 62.3 47.9 ' +
  'C 64.1 46.4, 66.2 45, 68.1 44.7 C 70 44.4, 72.1 45.2, 73.7 46.4 C 75.2 47.7, 76.5 50.1, 77.4 52.3 ' +
  'C 78.3 54.6, 78.7 57.3, 79.1 59.9 C 79.6 62.5, 79.8 65.1, 80.2 67.8 ' +
  'C 80.5 70.4, 80.8 73.1, 81.1 75.7 C 81.5 78.4, 81.8 81, 82.4 83.6 C 82.9 86.2, 83.5 88.8, 84.4 91.2 ' +
  'C 85.4 93.5, 86.5 96, 88.1 97.8 C 89.6 99.6, 91.7 101.1, 93.9 102 ' +
  'C 96 102.9, 98.7 103.3, 101.1 103.2 ' +
  'C 105.8 103.2, 110.3 104.1, 115.1 103.6 C 131.4 102, 149.5 92.1, 159.9 79.5 ' +
  'C 166.7 71.1, 173.5 56.1, 164.6 46.7 C 162.3 44.2, 159.1 42.8, 155.8 42.6 ' +
  'C 140.9 41.6, 134.3 59.1, 134 71.2 C 133.9 75.7, 134.2 80.8, 135.9 85 ' +
  'C 140.3 95.9, 154.3 103.8, 165.6 103.8 C 167 103.7, 168.4 103.3, 169.8 103.1 ' +
  'C 172.2 102.7, 174.9 101.8, 177.3 100.9 ' +
  'C 179.8 100, 182.2 98.8, 184.5 97.6 C 186.8 96.3, 189.1 94.9, 191.3 93.4 ' +
  'C 193.5 91.9, 195.6 90.3, 197.7 88.6 C 199.7 86.9, 201.7 85.1, 203.6 83.3 ' +
  'C 205.4 81.4, 207.3 79.4, 209 77.4 C 210.7 75.4, 212.4 73.3, 214 71.2 ' +
  'C 215.7 69.1, 217.2 67, 218.8 64.8 C 220.4 62.7, 221.9 60.5, 223.4 58.3 ' +
  'C 224.9 56.1, 226.4 53.9, 227.9 51.6 C 229.3 49.4, 230.8 47.2, 232.2 44.9 ' +
  'C 233.6 42.6, 234.9 40.4, 236.3 38 C 237.6 35.7, 238.9 33.4, 240.1 31 ' +
  'C 241.4 28.7, 242.6 26.3, 243.7 23.9 C 244.7 21.5, 245.9 19, 246.4 16.6 ' +
  'C 247 14.3, 247.3 11.6, 246.8 9.8 C 246.3 8.1, 244.9 6.4, 243.3 6 C 241.7 5.5, 239.4 6.1, 237.4 7.1 ' +
  'C 235.5 8.1, 233.5 10.1, 231.8 11.9 C 230.1 13.8, 228.6 16.1, 227.2 18.3 ' +
  'C 225.8 20.5, 224.6 22.9, 223.4 25.3 C 222.2 27.6, 221.1 30.1, 220 32.5 ' +
  'C 219 35, 218 37.4, 217.1 39.9 C 216.2 42.4, 215.3 45, 214.5 47.5 C 213.7 50, 212.9 52.6, 212.2 55.1 ' +
  'C 211.4 57.7, 210.8 60.3, 210.2 62.9 C 209.7 65.5, 209.2 68.1, 208.8 70.7 ' +
  'C 208.4 73.3, 208 76, 207.8 78.6 C 207.7 81.2, 207.7 83.9, 207.9 86.5 ' +
  'C 208.2 89.1, 208.5 91.8, 209.3 94.2 C 210.1 96.5, 211.1 99, 212.6 100.7 ' +
  'C 214.1 102.5, 216.1 104, 218.2 104.7 C 220.3 105.4, 222.9 105.3, 225.3 105.1 ' +
  'C 227.8 104.8, 230.4 103.9, 232.8 103.1 C 235.3 102.2, 237.8 101.2, 240.2 100.1 ' +
  'C 242.6 99, 245.1 97.9, 247.4 96.7 C 249.8 95.4, 252.1 94.2, 254.3 92.7 ' +
  'C 256.4 91.2, 258.4 89.5, 260.3 87.7 C 262.2 85.9, 263.9 83.8, 265.6 81.8 ' +
  'C 267.4 79.8, 269 77.7, 270.7 75.6 C 272.3 73.5, 273.9 71.4, 275.5 69.2 ' +
  'C 277.1 67.1, 278.7 65, 280.3 62.8 C 281.8 60.6, 283.3 58.4, 284.8 56.2 ' +
  'C 286.3 54, 287.8 51.8, 289.2 49.6 C 290.7 47.3, 292.1 45.1, 293.5 42.8 ' +
  'C 294.9 40.5, 296.2 38.2, 297.5 35.9 C 298.8 33.5, 300.1 31.2, 301.3 28.8 ' +
  'C 302.5 26.5, 303.7 24, 304.7 21.6 C 305.6 19.2, 306.7 16.6, 306.9 14.4 ' +
  'C 307.2 12.1, 307 9.6, 306.1 8.2 C 305.2 6.7, 303.3 5.8, 301.6 5.8 C 299.8 5.8, 297.5 7, 295.6 8.4 ' +
  'C 293.7 9.7, 291.8 11.8, 290.2 13.8 C 288.6 15.8, 287.3 18.1, 286 20.4 ' +
  'C 284.6 22.7, 283.5 25.1, 282.3 27.5 C 281.2 29.9, 280.1 32.3, 279.1 34.8 ' +
  'C 278.1 37.3, 277.2 39.8, 276.3 42.3 C 275.4 44.8, 274.5 47.3, 273.8 49.9 ' +
  'C 273 52.4, 272.2 55, 271.5 57.5 C 270.8 60.1, 270.3 62.7, 269.7 65.3 ' +
  'C 269.2 67.9, 268.7 70.6, 268.4 73.2 C 268.1 75.8, 267.8 78.4, 267.7 81.1 ' +
  'C 267.7 83.7, 267.8 86.4, 268.2 88.9 C 268.6 91.5, 269.1 94.2, 270.1 96.4 ' +
  'C 271.1 98.6, 272.4 100.9, 274.2 102.3 C 275.9 103.8, 278.1 104.8, 280.3 105.2 ' +
  'C 282.6 105.6, 285.2 105.1, 287.7 104.6 C 290.1 104.1, 292.7 103.1, 295.2 102.2 ' +
  'C 297.6 101.3, 300.1 100.2, 302.5 99.1 C 304.9 97.9, 307.3 96.8, 309.6 95.5 ' +
  'C 312 94.3, 314.3 92.9, 316.4 91.4 C 318.5 89.9, 320.5 88.1, 322.3 86.2 ' +
  'C 324.2 84.4, 325.8 82.3, 327.3 80.1 C 328.8 78, 330 75.6, 331.3 73.3 ' +
  'C 332.6 71, 333.7 68.5, 335.1 66.2 C 336.4 63.9, 337.7 61.6, 339.2 59.4 ' +
  'C 340.7 57.2, 342.2 55, 343.9 53.1 C 345.6 51.1, 347.4 49.1, 349.4 47.7 ' +
  'C 351.4 46.2, 353.8 45, 356.1 44.4 C 358.4 43.8, 361.1 43.7, 363.3 44.2 ' +
  'C 365.6 44.7, 367.8 45.9, 369.6 47.5 C 371.3 49, 372.7 51.3, 373.8 53.5 ' +
  'C 374.9 55.8, 375.6 58.4, 376.1 60.9 C 376.6 63.4, 376.8 66.1, 376.8 68.7 ' +
  'C 376.9 71.3, 376.8 74, 376.5 76.6 C 376.1 79.2, 375.5 81.7, 374.7 84.2 ' +
  'C 373.9 86.7, 372.9 89.2, 371.6 91.4 C 370.3 93.6, 368.8 95.7, 367 97.4 ' +
  'C 365.2 99.1, 363 100.6, 360.8 101.6 C 358.5 102.6, 356 103.2, 353.5 103.4 ' +
  'C 351.1 103.5, 348.5 103.2, 346.2 102.3 C 344 101.5, 341.9 100.1, 340.2 98.4 ' +
  'C 338.5 96.8, 337.1 94.5, 336.1 92.2 C 335.1 90, 334.5 87.4, 334.2 84.9 ' +
  'C 333.9 82.4, 334.1 79.8, 334.5 77.2 C 334.8 74.7, 335.5 72.1, 336.4 69.6 ' +
  'C 337.3 67.2, 338.5 64.9, 339.8 62.6 C 341.2 60.4, 342.7 58.2, 344.4 56.2 ' +
  'C 346.1 54.2, 348 52.4, 350 50.8 C 352.1 49.2, 354.3 47.7, 356.6 46.7 ' +
  'C 358.9 45.7, 361.4 44.9, 363.8 44.7 C 366.3 44.4, 368.9 44.7, 371.3 45.3 ' +
  'C 373.7 45.9, 375.9 47.2, 378.2 48.4 C 380.5 49.6, 382.6 51.3, 385 52.3 ' +
  'C 387.3 53.4, 389.7 54.5, 392.2 54.9 C 394.6 55.2, 397.2 55.2, 399.6 54.6 ' +
  'C 401.9 54, 404.2 52.7, 406.4 51.4 C 408.6 50.2, 410.6 48.3, 412.7 47.1 ' +
  'C 414.8 45.9, 417.9 44.5, 419 44';

/** Seconds: the pause before the pen starts, the writing itself, and the hold after. */
const START = 0.2;
const DRAW = 2;
const HOLD = 0.42;
/** The drain: slow to let go of the first stroke, then gone. */
const DRAIN = 1.1;
const DRAIN_EASE = [0.5, 0, 0.75, 0.4] as const;

type HelloIntroProps = {
  /** The stroke, for the burst to read where its tail is. */
  pathRef: RefObject<SVGPathElement | null>;
  /** True once the word should drain out through its tail. */
  draining: boolean;
  /** The word has been written and held: time for the ink to leave. Must be stable. */
  onWritten: () => void;
  /** The reader tapped or pressed Enter, Space or Escape during the writing: straight to the home. Must be stable. */
  onSkip: () => void;
};

/**
 * The Mac's first-boot hello: one stroke written in real time, held a beat,
 * then drained out through the tail of the o, where the burst picks the ink
 * up as drops. The sheet behind it lifts as the drain starts, so the page is
 * there for the drops to draw on. Nothing here takes the pointer; the page's own
 * controls are kept inert until they are shown.
 */
export default function HelloIntro({ pathRef, draining, onWritten, onSkip }: HelloIntroProps) {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (draining) return;
    const total = reduced ? 0.9 : START + DRAW + HOLD;
    const id = window.setTimeout(onWritten, total * 1000);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') onSkip();
    };
    window.addEventListener('pointerdown', onSkip);
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener('pointerdown', onSkip);
      window.removeEventListener('keydown', onKey);
    };
  }, [draining, onWritten, onSkip, reduced]);

  return (
    <motion.div className="hello-intro" aria-hidden exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
      <motion.div
        className="hello-intro-sheet"
        initial={false}
        animate={{ opacity: draining ? 0 : 1 }}
        transition={{ duration: 0.5 }}
      />
      <svg className="hello-intro-mark" viewBox="-8 -8 439 126">
        <g>
          {/* The round cap would leave a dot at the tail once the dash has gone past it, so the stroke fades at the very end. */}
          <motion.path
            ref={pathRef}
            d={HELLO_PATH}
            initial={{ pathLength: reduced ? 1 : 0, pathOffset: 0, opacity: 1 }}
            animate={draining ? { pathLength: 1, pathOffset: 1, opacity: 0 } : { pathLength: 1, pathOffset: 0, opacity: 1 }}
            transition={
              draining
                ? { duration: DRAIN, ease: DRAIN_EASE, opacity: { delay: DRAIN - 0.08, duration: 0.08 } }
                : { duration: reduced ? 0 : DRAW, delay: START, ease: PEN_EASE }
            }
          />
        </g>
      </svg>
    </motion.div>
  );
}
