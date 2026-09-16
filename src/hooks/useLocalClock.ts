import { useEffect, useState } from 'react';
import { readLocalClock } from '@/lib/clock';

/**
 * The wall clock in `tz`, refreshed every half minute. `paused` stops the
 * ticking while the reader is elsewhere; coming back re-reads the time at
 * once, so the clock never shows the minute it was paused on.
 */
export function useLocalClock(tz: string, paused = false) {
  const [clock, setClock] = useState(() => readLocalClock(tz));
  const [watching, setWatching] = useState({ tz, paused });

  /*
   * The catch-up read happens here rather than in the effect below: an effect
   * would paint the stale minute first and correct it a frame later, and React
   * discards a render that adjusts its own state before anyone sees it.
   */
  if (watching.tz !== tz || watching.paused !== paused) {
    setWatching({ tz, paused });
    if (!paused) setClock(readLocalClock(tz));
  }

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => setClock(readLocalClock(tz)), 30_000);
    return () => window.clearInterval(id);
  }, [tz, paused]);

  return clock;
}
