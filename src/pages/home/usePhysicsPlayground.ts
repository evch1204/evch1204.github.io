import { useCallback, useEffect, useRef, useState } from 'react';
import { createPlayground, type Playground } from './physics/playground';
import type { CtaKind } from './physics/types';

/**
 * The React side of the playground: created once on mount and destroyed on
 * unmount, so the blocks keep their positions across every tab switch. `isPaused`
 * travels through a ref the tick loop reads, plus a pause/resume call when it
 * flips; `busy` is the one piece of engine state the UI needs back.
 */
export function usePhysicsPlayground({
  isPaused,
  onCta,
}: {
  isPaused: boolean;
  onCta: (kind: CtaKind) => void;
}) {
  const [busy, setBusy] = useState(false);

  const pausedRef = useRef(isPaused);
  pausedRef.current = isPaused;
  const onCtaRef = useRef(onCta);
  onCtaRef.current = onCta;

  const playgroundRef = useRef<Playground | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  /** The italic line stays put and acts as a shelf the falling pieces land on. */
  const shelfRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const hint = hintRef.current;
    if (!container || !hint) return;

    const playground = createPlayground({
      container,
      root: rootRef.current,
      hint,
      intro: introRef.current,
      shelf: shelfRef.current,
      paused: pausedRef,
      onCta: (kind) => onCtaRef.current(kind),
    });
    playgroundRef.current = playground;

    return () => {
      playgroundRef.current = null;
      playground.destroy();
    };
  }, []);

  useEffect(() => {
    const playground = playgroundRef.current;
    if (!playground) return;
    if (isPaused) playground.pause();
    else playground.resume();
  }, [isPaused]);

  /** Both buttons have the same shape: flag busy, run the flight, unflag. */
  const runBusy = useCallback(async (action: 'dropAll' | 'reset') => {
    const playground = playgroundRef.current;
    if (!playground) return;
    setBusy(true);
    try {
      await playground[action]();
    } finally {
      setBusy(false);
    }
  }, []);

  const dropAll = useCallback(() => runBusy('dropAll'), [runBusy]);
  const reset = useCallback(() => runBusy('reset'), [runBusy]);

  return { busy, dropAll, reset, containerRef, hintRef, introRef, rootRef, shelfRef };
}
