/** `runningmap.app.space` — the bare host, used as the card's link text. */
export const hostLabel = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/$/, '');

/** `owner/hand_tracker` — the repo path, used as the card's link text. */
export const repoLabel = (url: string) => url.replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '');
