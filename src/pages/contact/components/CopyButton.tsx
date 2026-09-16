import { useEffect, useState } from 'react';
import { Check, Copy } from 'lucide-react';

/** Copies `text` and says so for a moment. Not offered where the clipboard is out of reach. */
export default function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(id);
  }, [copied]);

  if (!navigator.clipboard) return null;
  // A refused copy leaves the label as it was: there is nothing useful to say.
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => setCopied(true), () => {});
  };
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy ${label}`}
      className="inline-flex h-11 items-center gap-1.5 rounded-full px-3 font-mono text-[11px] text-zinc-400 transition-colors hover:text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 sm:h-8"
    >
      {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
      <span aria-live="polite">{copied ? 'copied' : 'copy'}</span>
    </button>
  );
}
