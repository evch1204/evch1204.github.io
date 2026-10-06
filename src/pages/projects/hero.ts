/**
 * The contract the card window, the page hero and the flight between them
 * share. It lives here rather than in either component so that neither has to
 * import the other.
 */

/** The one `layoutId` a project's card window and its page hero share, so one grows into the other. */
export const heroLayoutId = (projectId: string) => `project-hero-${projectId}`;

/** How the shared window travels between the card and the page: a spring with a little settle, ~0.55s. */
export const HERO_TRANSITION = { type: 'spring', bounce: 0.15, duration: 0.55 } as const;

/**
 * A picture's frame on the project page: a patch of paper for a `<Frame />`
 * to rule round, and inside it the box that crops the picture to the frame's
 * corners.
 */
export const FRAME = 'sk-frame rounded-2xl bg-page';
export const FRAME_INNER = 'overflow-hidden rounded-2xl';
