import type { Ref } from 'react';
import { AnimatePresence, motion, useIsPresent, useReducedMotion, type HTMLMotionProps } from 'motion/react';
import Section from '@/components/Section';
import ProjectGrid from './components/ProjectGrid';
import ProjectPage from './ProjectPage';
import { useProjectRouting } from './useProjectRouting';

/**
 * One of the tab's two views, laid out `offset` px below its natural place
 * (see the scroll hand-off). On its way out it is out of the pointer's reach:
 * a second click on the card that just opened, or on the page that is closing,
 * must not start the swap over. `ref` is what `popLayout` measures by.
 */
function View({ offset, ref, ...rest }: HTMLMotionProps<'div'> & { offset: number; ref?: Ref<HTMLDivElement> }) {
  const present = useIsPresent();
  return <motion.div ref={ref} {...rest} style={{ marginTop: offset }} className={present ? 'w-full' : 'w-full pointer-events-none'} />;
}

/**
 * The Projects tab: the grid, and the project page it opens into. The page
 * takes the grid's place with a shared-element animation from the card, has a
 * history entry of its own (Back returns to the grid), and hands the scroll
 * position and the keyboard back when it closes.
 */
export default function ProjectsPage() {
  const reduced = useReducedMotion();
  const { selected, prev, next, arrival, offset, open, select, goBack, registerCard } = useProjectRouting();

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
            <View key="page" offset={offset}>
              <ProjectPage
                key={selected.id}
                project={selected}
                prev={prev}
                next={next}
                arrival={arrival}
                onBack={goBack}
                onSelect={select}
              />
            </View>
          ) : (
            <View
              key="grid"
              offset={offset}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.25 } }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
            >
              <ProjectGrid shared={!reduced} onOpen={open} registerCard={registerCard} />
            </View>
          )}
        </AnimatePresence>
      </div>
    </Section>
  );
}
