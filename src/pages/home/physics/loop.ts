import { MAX_STEPS_PER_FRAME, STEP_MS } from './constants';

type LoopOptions = {
  /** One fixed 1/60s of simulation. `now` is the frame's timestamp. */
  step: (now: number) => void;
  /** Writes the bodies to the DOM, once per frame however many steps ran. */
  sync: () => void;
  /** False when there is nothing left to simulate; the loop then stands down. */
  alive: () => boolean;
};

type Loop = {
  /** Starts the loop if it is not already running. */
  start(): void;
  pause(): void;
  resume(): void;
  stop(): void;
};

/**
 * A fixed-timestep rAF loop: it accumulates real time and spends it in whole
 * steps, so the same tuning runs the same on a 60Hz and a 120Hz display.
 */
export function createLoop({ step, sync, alive }: LoopOptions): Loop {
  let rafId = 0;
  let lastFrameTs = 0;
  let accumulator = 0;
  let started = false;
  let stopped = false;

  function tick(now: number) {
    if (stopped) return;

    if (!lastFrameTs) lastFrameTs = now;
    // A backgrounded tab hands back a huge gap; clamp rather than fast-forward.
    accumulator += Math.min(now - lastFrameTs, 100);
    lastFrameTs = now;

    let steps = 0;
    while (accumulator >= STEP_MS && steps < MAX_STEPS_PER_FRAME) {
      step(now);
      accumulator -= STEP_MS;
      steps += 1;
    }
    if (steps === MAX_STEPS_PER_FRAME) accumulator = 0;

    sync();

    if (alive()) {
      rafId = requestAnimationFrame(tick);
    } else {
      started = false;
    }
  }

  return {
    start() {
      if (stopped || started) return;
      started = true;
      rafId = requestAnimationFrame(tick);
    },

    pause() {
      cancelAnimationFrame(rafId);
      rafId = 0;
      // Drop the elapsed time, or resuming would replay the whole gap.
      lastFrameTs = 0;
      accumulator = 0;
    },

    resume() {
      if (!started) return;
      if (!alive()) return;
      if (rafId) return;
      rafId = requestAnimationFrame(tick);
    },

    stop() {
      stopped = true;
      cancelAnimationFrame(rafId);
    },
  };
}
