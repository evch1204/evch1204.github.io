import { useEffect, useState } from 'react';
import { readLocalClock } from '@/lib/clock';

/** The wall clock in `tz`, refreshed every half minute. */
export function useLocalClock(tz: string) {
  const [clock, setClock] = useState(() => readLocalClock(tz));
  const [watching, setWatching] = useState(tz);

  /*
   * A change of zone is read here rather than in the effect below: an effect
   * would paint the old zone's minute first and correct it a frame later, and
   * React discards a render that adjusts its own state before anyone sees it.
   */
  if (watching !== tz) {
    setWatching(tz);
    setClock(readLocalClock(tz));
  }

  useEffect(() => {
    const id = window.setInterval(() => setClock(readLocalClock(tz)), 30_000);
    return () => window.clearInterval(id);
  }, [tz]);

  return clock;
}
