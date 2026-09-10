/**
 * Saves a file the way both resume buttons do: a throwaway anchor carrying the
 * `download` name, clicked and removed again.
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
