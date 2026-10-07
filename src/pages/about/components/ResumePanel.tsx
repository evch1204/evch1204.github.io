import { Download, ExternalLink, Maximize2 } from 'lucide-react';
import Eyebrow from '@/components/Eyebrow';
import PillLink from '@/components/PillLink';
import SectionHeading from '@/components/SectionHeading';
import Frame from '@/components/sketch/Frame';
import Tag from '@/components/Tag';
import { NAME, RESUME_FILENAME, RESUME_URL } from '@/content/site';
import { RESUME_SKILLS } from '@/content/skills';
import resumePreview from '@/assets/images/resume-preview-page1.jpg';

/**
 * Resume preview: page one rendered to an image so it shows on every browser
 * (an embedded PDF viewer does not render reliably on mobile), laid on the
 * sheet like a page slipped into the sketchbook, alongside the skills
 * breakdown and the download / open actions.
 */
export default function ResumePanel({ onExpand }: { onExpand: () => void }) {
  return (
    <div>
      <SectionHeading>Resume</SectionHeading>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] lg:gap-14 lg:items-start">
        <button
          type="button"
          onClick={onExpand}
          aria-haspopup="dialog"
          className="sk-frame sk-card group block w-full cursor-pointer rounded-2xl -rotate-1 focus-ring"
        >
          <Frame r={16} double draw />
          <span className="relative block overflow-hidden rounded-2xl">
            <img
              src={resumePreview}
              alt={`First page of ${NAME}'s resume`}
              loading="lazy"
              className="block w-full mix-blend-multiply grayscale"
            />
            {/* Fades the page into the sheet instead of cutting it off mid-line. */}
            <span
              className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-page to-transparent"
              aria-hidden
            />
            <span className="absolute inset-x-0 bottom-0 flex items-center justify-center pb-5">
              <span className="sk-btn px-5 py-2.5 text-sm">
                <Frame r={999} fill tone={1} className="sk-under" />
                <Maximize2 size={14} /> View full resume
              </span>
            </span>
          </span>
        </button>

        <div className="min-w-0 space-y-7">
          {RESUME_SKILLS.map(({ heading, items }) => (
            <div key={heading}>
              <Eyebrow as="h4" className="mb-3">
                {heading}
              </Eyebrow>
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
