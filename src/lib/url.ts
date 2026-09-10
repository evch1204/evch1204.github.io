/** `runningmap.app.space` — the bare host, used as the card's link text. The
 *  `www.` goes with the scheme: it is noise in a label, never part of the name. */
export const hostLabel = (url: string) =>
  url.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');

/** `owner/hand_tracker` — the repo path, used as the card's link text. */
export const repoLabel = (url: string) => url.replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '');
