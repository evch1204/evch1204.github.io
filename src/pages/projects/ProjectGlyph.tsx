/**
 * Line-art marks used in a project card's panel when the project has no live
 * page to screenshot (research, embedded and CLI work). Drawn on a 72x48 grid
 * so they share a stroke weight and optical size with the lucide icons.
 */
import type { ReactNode } from 'react';
import type { GlyphName } from '@/content/projects';

const PATHS: Record<GlyphName, ReactNode> = {
  hand: (
    <>
      <path d="M46 12l11 5.5v13L46 36l-11-5.5v-13L46 12Z" />
      <path d="M35 17.5 46 23l11-5.5M46 23v13" opacity="0.5" />
      <path d="M15 42V28M15 28l-6-6M15 28V16M15 28l6-9M15 28l9-4" />
      <circle cx="9" cy="22" r="1.8" fill="currentColor" stroke="none" />
      <circle cx="15" cy="16" r="1.8" fill="currentColor" stroke="none" />
      <circle cx="21" cy="19" r="1.8" fill="currentColor" stroke="none" />
      <circle cx="24" cy="24" r="1.8" fill="currentColor" stroke="none" />
    </>
  ),
  chart: (
    <>
      <path d="M12 40h48" />
      <rect x="17" y="28" width="8" height="12" />
      <rect x="31" y="19" width="8" height="21" />
      <rect x="45" y="25" width="8" height="15" />
      <path d="M17 33l14-11 14 7 10-15" opacity="0.5" />
    </>
  ),
  scrape: (
    <>
      <circle cx="12" cy="14" r="4" />
      <circle cx="12" cy="34" r="4" />
      <path d="M16.5 15.5 30 21M16.5 32.5 30 27" />
      <rect x="32" y="11" width="28" height="26" rx="3" />
      <path d="M32 19h28M32 29h28M46 11v26" opacity="0.6" />
    </>
  ),
  route: (
    <>
      <path d="M10 38c6-2 4-10 10-12s10 6 16 2 6-12 14-14" />
      <circle cx="10" cy="38" r="3" />
      <path d="M54 8a5 5 0 0 1 5 5c0 3.5-5 9-5 9s-5-5.5-5-9a5 5 0 0 1 5-5Z" />
      <path d="M4 44h64" strokeDasharray="2 4" opacity="0.45" />
    </>
  ),
  draw: (
    <>
      <path d="M8 34c6-15 12 6 18-6s10 11 15-2" />
      <path d="M8 42c8-4 16-4 22 0" opacity="0.45" />
      <path d="M46 10 60 24l-6.5 1L50 31 46 10Z" />
    </>
  ),
  calendar: (
    <>
      <rect x="18" y="10" width="36" height="30" rx="4" />
      <path d="M18 19h36M27 6v8M45 6v8" />
      <path d="M27 29l4 4 9-9" />
    </>
  ),
  doc: (
    <>
      <path d="M22 5h18l10 10v27a2 2 0 0 1-2 2H22a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
      <path d="M40 5v10h10" />
      <path d="M26 24h18M26 30h18M26 36h11" />
    </>
  ),
};

export default function ProjectGlyph({ name }: { name: GlyphName }) {
  return (
    <svg
      width="108"
      height="72"
      viewBox="0 0 72 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-zinc-400"
      aria-hidden
    >
      {PATHS[name]}
    </svg>
  );
}
