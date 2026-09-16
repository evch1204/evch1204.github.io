/**
 * Saves a file without leaving the page: a throwaway anchor carrying the
 * `download` name, clicked and removed again. For a link that is already an
 * `<a>`, a plain `download` attribute does the same job — this is for the
 * places where the click starts somewhere else.
 */
export function triggerDownload(href: string, filename: string) {
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
}
