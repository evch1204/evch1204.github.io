import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useIsPresent, useReducedMotion } from 'motion/react';
import { PROJECTS, type Figure, type Project } from '@/content/projects';

/** The id in our own history entry, if the current entry is one of ours. */
function projectInHistory(): string | null {
  const state: unknown = history.state;
  if (state && typeof state === 'object' && 'project' in state && typeof state.project === 'string') return state.project;
  return null;
}

const byId = (id: string) => PROJECTS.find((p) => p.id === id) ?? null;

/**
 * The hero's picture is measured the moment the page mounts, so it has to be
 * decoded by then or the frame the card grows into is the wrong size. Cached
 * pictures resolve at once; a fresh one gets a short head start, no more.
 */
const preload = (figure: Figure) =>
  new Promise<void>((resolve) => {
    if (!figure.src) return resolve();
    const img = new Image();
    img.src = figure.src;
    const done = () => resolve();
    img.decode().then(done, done);
    setTimeout(done, 400);
  });

/** Comfortably after the hero's spring (0.55s) has settled. */
const SETTLE_MS = 700;

/**
 * Which of the tab's two views is showing, and everything that gets between
 * them: the history entry the page owns, the scroll hand-off that keeps the
 * viewport still while the hero flies, the keyboard, and where focus lands
 * when the page closes. `offset` is the margin the showing view is laid out
 * with; `registerCard` is how the grid lends its cards for the focus return.
 */
export function useProjectRouting() {
  const reduced = useReducedMotion();
  /** False once the tab is on its way out (App swaps tabs with `mode="wait"`, so the exit takes a beat). */
  const present = useIsPresent();
  const presentRef = useRef(true);
  presentRef.current = present;
  const [selected, setSelected] = useState<Project | null>(null);
  const [arrival, setArrival] = useState<'grid' | 'page'>('grid');
  /*
   * The scroll hand-off. A layout animation runs in page coordinates, so
   * changing the scroll position while the hero is in flight would put its
   * start point off screen. Instead, the incoming view is offset so that it
   * is laid out exactly where the viewport already is; once the animation has
   * settled, the offset is dropped and the scroll moved by the same amount in
   * the same frame, and nothing on screen moves — whether or not the reader
   * scrolled in the meantime.
   */
  const [offset, setOffset] = useState(0);
  const settle = useRef<{ shift: number; timer: number } | null>(null);
  const pending = useRef<{ target: number; shift: number } | null>(null);
  /** Where the grid was scrolled to when a project opened, to go back to. */
  const gridScroll = useRef(0);
  /** The card that opened the page: focus returns to it. */
  const openerId = useRef<string | null>(null);
  const cards = useRef(new Map<string, HTMLButtonElement>());
  const selectedRef = useRef<Project | null>(null);
  selectedRef.current = selected;
  /** Set while the tab is mounted: `open` waits on a decode and must not carry on after it is gone. */
  const alive = useRef(true);
  /** The project whose hero `open` is waiting on, so a second click on its card does not start over. */
  const opening = useRef<string | null>(null);
  /** Set between our `history.back()` and its popstate, so a second Back in that gap does not leave the site. */
  const leaving = useRef(false);

  const settleNow = useCallback(() => {
    const s = settle.current;
    if (!s) return;
    settle.current = null;
    clearTimeout(s.timer);
    // A tab on its way out must not scroll the one coming in.
    if (!presentRef.current) return;
    flushSync(() => setOffset(0));
    // Dropping the offset moves the content by exactly `shift`; scroll by the same and what is on screen stays.
    window.scrollTo(0, window.scrollY - s.shift);
  }, []);

  useEffect(() => {
    if (!present) settleNow();
  }, [present, settleNow]);

  /** Shows `next` (or the grid), laid out for `target` scroll. `shared`: the hero travels, so hold the viewport. */
  const swapView = useCallback(
    (next: Project | null, target: number, shared: boolean) => {
      settleNow();
      const shift = shared && !reduced ? window.scrollY - target : 0;
      pending.current = { target, shift };
      setArrival(selectedRef.current ? 'page' : 'grid');
      setSelected(next);
      setOffset(shift);
    },
    [reduced, settleNow],
  );

  useLayoutEffect(() => {
    const p = pending.current;
    if (!p) return;
    pending.current = null;
    if (p.shift === 0) {
      window.scrollTo(0, p.target);
    } else {
      settle.current = { shift: p.shift, timer: window.setTimeout(settleNow, SETTLE_MS) };
    }
    if (!selected && openerId.current) cards.current.get(openerId.current)?.focus({ preventScroll: true });
  }, [selected, settleNow]);

  const open = useCallback(
    async (project: Project) => {
      // Already open, or on its way: a double click is one click.
      if (selectedRef.current?.id === project.id || opening.current === project.id) return;
      opening.current = project.id;
      openerId.current = project.id;
      // The grid may still be arriving, offset: read its place only once it is settled.
      settleNow();
      gridScroll.current = window.scrollY;
      await preload(project.caseStudy.hero);
      if (opening.current === project.id) opening.current = null;
      if (!alive.current) return;
      // Guard against a double entry: a second open before the first was left just replaces it.
      if (projectInHistory()) history.replaceState({ project: project.id }, '');
      else history.pushState({ project: project.id }, '');
      swapView(project, 0, true);
    },
    [settleNow, swapView],
  );

  /** Prev / next: the same history entry, retargeted. */
  const select = useCallback(
    (project: Project) => {
      if (leaving.current) return;
      if (projectInHistory()) history.replaceState({ project: project.id }, '');
      else history.pushState({ project: project.id }, '');
      swapView(project, 0, false);
    },
    [swapView],
  );

  const goBack = useCallback(() => {
    const current = selectedRef.current;
    if (!current || leaving.current) return;
    // Our entry is on top: let the browser pop it, and popstate does the rest.
    if (projectInHistory() === current.id) {
      leaving.current = true;
      history.back();
    } else {
      swapView(null, gridScroll.current, true);
    }
  }, [swapView]);

  useEffect(() => {
    const onPop = () => {
      leaving.current = false;
      const id = projectInHistory();
      const current = selectedRef.current;
      const next = id ? byId(id) : null;
      if (next?.id === current?.id) return;
      if (!next) {
        swapView(null, gridScroll.current, true);
      } else if (!current) {
        // Forward, back onto a page: it opens from wherever its card is now, once the grid has settled.
        openerId.current = next.id;
        settleNow();
        gridScroll.current = window.scrollY;
        swapView(next, 0, true);
      } else {
        swapView(next, 0, false);
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [settleNow, swapView]);

  useEffect(() => {
    alive.current = true;
    // The browser would restore the grid's scroll position the instant our entry pops — before the grid is back.
    const restoration = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    // An entry left over from before a reload opens nothing.
    if (projectInHistory()) history.replaceState(null, '');
    return () => {
      alive.current = false;
      history.scrollRestoration = restoration;
      // Leaving the tab with a page open: the entry stays, but it no longer opens anything.
      if (projectInHistory()) history.replaceState(null, '');
      if (settle.current) clearTimeout(settle.current.timer);
      settle.current = null;
    };
  }, []);

  const index = selected ? PROJECTS.findIndex((p) => p.id === selected.id) : -1;
  const prev = index > 0 ? PROJECTS[index - 1] : null;
  const next = index >= 0 && index < PROJECTS.length - 1 ? PROJECTS[index + 1] : null;

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      // A chord (Alt+← is the browser's back) or a held key is not a request to move.
      if (e.altKey || e.ctrlKey || e.metaKey || e.repeat || e.defaultPrevented) return;
      if (e.key === 'Escape') goBack();
      if (e.key === 'ArrowRight' && next) select(next);
      if (e.key === 'ArrowLeft' && prev) select(prev);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, prev, next, goBack, select]);

  const registerCard = useCallback((id: string, el: HTMLButtonElement | null) => {
    if (el) cards.current.set(id, el);
    else cards.current.delete(id);
  }, []);

  return { selected, prev, next, arrival, offset, open, select, goBack, registerCard };
}
