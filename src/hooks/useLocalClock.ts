import { useEffect, useState } from 'react';
import { readLocalClock } from '@/lib/clock';

/**
 * The wall clock in `tz`, refreshed every half minute. `paused` stops the
 * ticking while the reader is elsewhere; coming back re-reads the time at
 * once, so the clock never shows the minute it was paused on.
 */
export function useLocalClock(tz: string, paused = false) {
  const [clock, setClock] = useState(() => readLocalClock(tz));

  useEffect(() => {
    if (paused) return;
    setClock(readLocalClock(tz));
    const id = window.setInterval(() => setClock(readLocalClock(tz)), 30_000);
    return () => window.clearInterval(id);
  }, [tz, paused]);

  return clock;
}
