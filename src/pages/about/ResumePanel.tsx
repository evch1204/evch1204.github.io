import { Download, ExternalLink, Maximize2 } from 'lucide-react';
import PillLink from '@/components/PillLink';
import SectionHeading from '@/components/SectionHeading';
import Tag from '@/components/Tag';
import { NAME, RESUME_FILENAME, RESUME_URL } from '@/content/site';
import { RESUME_SKILLS } from '@/content/skills';
import resumePreview from '@/assets/images/resume-preview-page1.jpg';

/**
 * Resume preview: page one rendered to an image so it shows on every browser
 * (an embedded PDF viewer does not render reliably on mobile), alongside the
 * skills breakdown and the download / open actions.
 */
export default function ResumePanel({ onExpand }: { onExpand: () => void }) {
  return (
    <div>
      <SectionHeading>Resume</SectionHeading>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] lg:gap-14 lg:items-start">
        <button
          type="button"
          onClick={onExpand}
          aria-haspopup="dialog"
          className="group relative block w-full cursor-pointer overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.06)] transition-shadow duration-500 hover:shadow-[0_28px_60px_rgba(0,0,0,0.10)] focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
        >
          <img
            src={resumePreview}
            alt={`First page of ${NAME}'s resume`}
            loading="lazy"
            className="block w-full transition-transform duration-700 group-hover:scale-[1.01]"
          />
          {/* Fades the page into the card instead of cutting it off mid-line. */}
          <span
            className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white to-transparent"
            aria-hidden
          />
          <span className="absolute inset-x-0 bottom-0 flex items-center justify-center pb-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-5 py-2.5 text-xs font-bold text-white shadow-lg transition-transform duration-300 group-hover:scale-105">
              <Maximize2 size={14} /> View full resume
            </span>
          </span>
        </button>

        <div className="min-w-0 space-y-7">
          {RESUME_SKILLS.map(({ heading, items }) => (
            <div key={heading}>
              <h4 className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">{heading}</h4>
              <ul className="flex flex-wrap gap-2">
                {items.map((item) => (
                  <li key={item}>
                    <Tag variant="detail">{item}</Tag>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="flex flex-col gap-3 pt-1 sm:flex-row">
            <PillLink href={RESUME_URL} download={RESUME_FILENAME}>
              <Download size={18} /> Download PDF
            </PillLink>
            <PillLink variant="outline" href={RESUME_URL}>
              <ExternalLink size={18} /> Open in new tab
            </PillLink>
          </div>
        </div>
      </div>
    </div>
  );
}
