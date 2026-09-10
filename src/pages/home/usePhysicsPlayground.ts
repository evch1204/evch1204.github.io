import { useCallback, useEffect, useRef, useState } from 'react';
import { createPlayground, type Playground } from './physics/playground';
import type { CtaKind } from './physics/types';

/** The kinds of block the engine can report a tap on — re-exported so the screen
 *  takes it from the hook rather than reaching into the engine's own types. */
export type { CtaKind };

/**
 * The React side of the playground: created once on mount and destroyed on
 * unmount, so the blocks keep their positions across every tab switch. A flip of
 * `isPaused` stops or restarts the loop outright; `busy` is the one piece of
 * engine state the UI needs back.
 */
export function usePhysicsPlayground({
  isPaused,
  onCta,
}: {
  isPaused: boolean;
  onCta: (kind: CtaKind) => void;
}) {
  const [busy, setBusy] = useState(false);

  const onCtaRef = useRef(onCta);
  onCtaRef.current = onCta;

  const playgroundRef = useRef<Playground | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
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
      shelf: shelfRef.current,
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
  const runBusy = useCallback(async (flight: (p: Playground) => Promise<void>) => {
    const playground = playgroundRef.current;
    if (!playground) return;
    setBusy(true);
    try {
      await flight(playground);
    } finally {
      setBusy(false);
    }
  }, []);

  const dropAll = useCallback(() => runBusy((p) => p.dropAll()), [runBusy]);
  const reset = useCallback(() => runBusy((p) => p.reset()), [runBusy]);

  return { busy, dropAll, reset, containerRef, hintRef, rootRef, shelfRef };
}
