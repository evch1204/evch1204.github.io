/** `runningmap.app.space` — the bare host, used as the card's link text. The
 *  `www.` goes with the scheme: it is noise in a label, never part of the name. */
export const hostLabel = (url: string) =>
  url.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');

/** `owner/hand_tracker` — the repo path, used as the card's link text. */
export const repoLabel = (url: string) => url.replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '');

/**
 * The video id in a YouTube address — `watch?v=…`, `youtu.be/…`, `shorts/…` or
 * `embed/…` — or the address itself when it is already a bare id.
 */
const youtubeId = (url: string) =>
  url.match(/(?:[?&]v=|youtu\.be\/|\/shorts\/|\/embed\/)([\w-]{11})/)?.[1] ?? url;

/**
 * The address a YouTube video plays from inside a page: the no-cookie host,
 * the video started on arrival, no unrelated videos offered at the end.
 */
export const youtubeEmbedUrl = (url: string) =>
  `https://www.youtube-nocookie.com/embed/${youtubeId(url)}?autoplay=1&rel=0`;
