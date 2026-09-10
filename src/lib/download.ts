/**
 * Saves a file without leaving the page: a throwaway anchor carrying the
 * `download` name, clicked and removed again. The home screen's Resume block is
 * the one caller — the About page links can use a plain `download` attribute.
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
