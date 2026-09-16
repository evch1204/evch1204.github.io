/**
 * The contract the card window, the page hero and the flight between them
 * share. It lives here rather than in either component so that neither has to
 * import the other.
 */

/** The one `layoutId` a project's card window and its page hero share, so one grows into the other. */
export const heroLayoutId = (projectId: string) => `project-hero-${projectId}`;

/** How the shared window travels between the card and the page: a spring with a little settle, ~0.55s. */
export const HERO_TRANSITION = { type: 'spring', bounce: 0.15, duration: 0.55 } as const;

/** The About page's photo frame: white border, big radius, the soft shadow. Thinner and tighter on a phone. */
export const FRAME =
  'overflow-hidden rounded-[1.25rem] border-4 border-white bg-white shadow-[0_16px_40px_rgba(0,0,0,0.12)] md:rounded-[2rem] md:border-[6px] md:shadow-[0_24px_64px_rgba(0,0,0,0.12)]';
