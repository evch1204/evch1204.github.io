import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { ArrowRight } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import Section from '@/components/Section';
import { FEATURED_PROJECT, PROJECTS, PROJECT_GROUPS, projectsInGroup, type Figure, type Project } from '@/content/projects';
import { GITHUB_URL } from '@/content/site';
import FeaturedProjectCard from './FeaturedProjectCard';
import ProjectCard from './ProjectCard';
import ProjectPage from './ProjectPage';
import { heroLayoutId } from './ProjectPanel';

/** Rule + label that separates the two runs of project cards. */
const GroupHeading = ({ label, count }: { label: string; count: number }) => (
  <div className="mt-14 mb-6 flex items-baseline gap-4">
    <h3 className="whitespace-nowrap text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">{label}</h3>
    <span className="h-px flex-1 bg-zinc-200" aria-hidden />
    <span className="text-[11px] font-bold tracking-wider text-zinc-400">
      {String(count).padStart(2, '0')}
    </span>
  </div>
);

/**
 * The featured card, the two runs of cards and the GitHub link — the tab as it
 * was before the page existed. Memoised: the tab re-renders around it while
 * the page opens and closes, and nothing in here changes then.
 */
const ProjectGrid = memo(function ProjectGrid({
  shared,
  onOpen,
  registerCard,
}: {
  /** Give the card windows the layoutId the page hero shares. */
  shared: boolean;
  onOpen: (project: Project) => void;
  registerCard: (id: string, el: HTMLButtonElement | null) => void;
}) {
  return (
    <>
      <FeaturedProjectCard
        project={FEATURED_PROJECT}
        onOpen={() => onOpen(FEATURED_PROJECT)}
        layoutId={shared ? heroLayoutId(FEATURED_PROJECT.id) : undefined}
        ref={(el) => registerCard(FEATURED_PROJECT.id, el)}
      />

      {PROJECT_GROUPS.map((group) => {
        const items = projectsInGroup(group.id);
        if (items.length === 0) return null;
        return (
          <div key={group.id}>
            <GroupHeading label={group.label} count={items.length} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {items.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onOpen={() => onOpen(project)}
                  layoutId={shared ? heroLayoutId(project.id) : undefined}
                  ref={(el) => registerCard(project.id, el)}
                />
              ))}
            </div>
          </div>
        );
      })}
      <div className="mt-16 flex justify-center">
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white border border-zinc-200 text-zinc-900 font-bold hover:border-zinc-900 transition-all duration-300"
        >
          Explore More on GitHub <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </a>
      </div>
    </>
  );
});

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
 * The Projects tab: the grid, and the project page it opens into. The page
 * takes the grid's place with a shared-element animation from the card, has a
 * history entry of its own (Back returns to the grid), and hands the scroll
 * position and the keyboard back when it closes.
 */
export default function ProjectsPage() {
  const reduced = useReducedMotion();
  const [selected, setSelected] = useState<Project | null>(null);
  const [arrival, setArrival] = useState<'grid' | 'page'>('grid');
  /*
   * The scroll hand-off. A layout animation runs in page coordinates, so
   * changing the scroll position while the hero is in flight would put its
   * start point off screen. Instead, the incoming view is offset so that it
   * is laid out exactly where the viewport already is; once the animation has
   * settled, the offset is dropped and the scroll set in the same frame, and
   * nothing on screen moves.
   */
  const [offset, setOffset] = useState(0);
  const settle = useRef<{ target: number; timer: number } | null>(null);
  const pending = useRef<{ target: number; shift: number } | null>(null);
  /** Where the grid was scrolled to when a project opened, to go back to. */
  const gridScroll = useRef(0);
  /** The card that opened the page: focus returns to it. */
  const openerId = useRef<string | null>(null);
  const cards = useRef(new Map<string, HTMLButtonElement>());
  const selectedRef = useRef<Project | null>(null);
  selectedRef.current = selected;

  const settleNow = useCallback(() => {
    const s = settle.current;
    if (!s) return;
    settle.current = null;
    clearTimeout(s.timer);
    flushSync(() => setOffset(0));
    window.scrollTo(0, s.target);
  }, []);

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
      settle.current = { target: p.target, timer: window.setTimeout(settleNow, SETTLE_MS) };
    }
    if (!selected && openerId.current) cards.current.get(openerId.current)?.focus({ preventScroll: true });
  }, [selected, settleNow]);

  const open = useCallback(
    async (project: Project) => {
      openerId.current = project.id;
      gridScroll.current = window.scrollY;
      await preload(project.caseStudy.hero);
      // Guard against a double entry: a second open before the first was left just replaces it.
      if (projectInHistory()) history.replaceState({ project: project.id }, '');
      else history.pushState({ project: project.id }, '');
      swapView(project, 0, true);
    },
    [swapView],
  );

  /** Prev / next: the same history entry, retargeted. */
  const select = useCallback(
    (project: Project) => {
      if (projectInHistory()) history.replaceState({ project: project.id }, '');
      else history.pushState({ project: project.id }, '');
      swapView(project, 0, false);
    },
    [swapView],
  );

  const goBack = useCallback(() => {
    const current = selectedRef.current;
    if (!current) return;
    // Our entry is on top: let the browser pop it, and popstate does the rest.
    if (projectInHistory() === current.id) history.back();
    else swapView(null, gridScroll.current, true);
  }, [swapView]);

  useEffect(() => {
    const onPop = () => {
      const id = projectInHistory();
      const current = selectedRef.current;
      const next = id ? byId(id) : null;
      if (next?.id === current?.id) return;
      if (!next) {
        swapView(null, gridScroll.current, true);
      } else if (!current) {
        // Forward, back onto a page: it opens from wherever its card is now.
        openerId.current = next.id;
        gridScroll.current = window.scrollY;
        swapView(next, 0, true);
      } else {
        swapView(next, 0, false);
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [swapView]);

  useEffect(() => {
    // The browser would restore the grid's scroll position the instant our entry pops — before the grid is back.
    const restoration = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    // An entry left over from before a reload opens nothing.
    if (projectInHistory()) history.replaceState(null, '');
    return () => {
      history.scrollRestoration = restoration;
      // Leaving the tab with a page open: the entry stays, but it no longer opens anything.
      if (projectInHistory()) history.replaceState(null, '');
      if (settle.current) clearTimeout(settle.current.timer);
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

  return (
    <Section title="Creations">
      {/*
       * `relative flex-col`: the leaving view is popped out of flow at its last
       * position, measured against this box, and the incoming view's offset
       * margin must not collapse through it. No LayoutGroup around this: the
       * card window and the hero find each other by layoutId alone, and a
       * group would also re-snapshot the hero the instant the leaving view
       * unmounts — mid-removal, briefly back in flow — and then animate it a
       * whole grid's height for nothing.
       */}
      <div className="relative flex w-full flex-col">
        <AnimatePresence mode="popLayout" initial={false}>
          {selected ? (
            <motion.div key="page" style={{ marginTop: offset }} className="w-full">
              <ProjectPage
                key={selected.id}
                project={selected}
                prev={prev}
                next={next}
                arrival={arrival}
                onBack={goBack}
                onSelect={select}
              />
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              style={{ marginTop: offset }}
              className="w-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.25 } }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
            >
              <ProjectGrid shared={!reduced} onOpen={open} registerCard={registerCard} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Section>
  );
}
