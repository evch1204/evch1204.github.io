import { Github, Linkedin } from 'lucide-react';

/**
 * The one footer, shared by the home screen and every other tab. The tabs pass
 * the spacing that suits a long scrolling page; home pins it to the bottom of
 * the viewport. Everything inside stays identical so the pages can't drift.
 */
export default function SiteFooter({ className = '' }: { className?: string }) {
  return (
    <footer
      className={`font-sans border-t border-zinc-100 flex flex-col md:flex-row justify-between items-center gap-6 ${className}`}
    >
      <div className="flex flex-col gap-1.5 items-center md:items-start text-center md:text-left">
        <div className="text-sm font-bold tracking-tighter text-zinc-900">TEI CHANG.</div>
        <a
          href="mailto:changtei1204@gmail.com"
          className="text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          ChangTei1204@gmail.com
        </a>
      </div>
      <p className="text-[11px] text-zinc-400 tracking-wide font-medium">
        © 2026 Tei Chang. All rights reserved.
      </p>
      <div className="flex gap-6">
        <a
          href="https://github.com/evch1204"
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-400 hover:text-black transition-colors"
          aria-label="GitHub"
        >
          <Github size={18} />
        </a>
        <a
          href="https://www.linkedin.com/in/evan-chang1/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-400 hover:text-black transition-colors"
          aria-label="LinkedIn"
        >
          <Linkedin size={18} />
        </a>
      </div>
    </footer>
  );
}
