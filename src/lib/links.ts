/**
 * What an `<a>` needs to open somewhere else safely. A `mailto:` hands the
 * address to the mail client in place, so it gets neither — every other link
 * opens in its own tab and must not be able to reach back at this one.
 */
export function linkProps(href: string) {
  if (href.startsWith('mailto:')) return {};
  return { target: '_blank', rel: 'noopener noreferrer' } as const;
}
