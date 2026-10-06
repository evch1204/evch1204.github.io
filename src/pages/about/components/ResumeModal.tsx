import { Download, ExternalLink, X } from 'lucide-react';
import Modal from '@/components/Modal';
import PillLink from '@/components/PillLink';
import Frame from '@/components/sketch/Frame';
import { NAME, RESUME_FILENAME, RESUME_URL } from '@/content/site';
import resumePreview from '@/assets/images/resume-preview-page1.jpg';

/** The resume preview, enlarged and scrollable, in a dialog framed like the rest of the sheet. */
export default function ResumeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      overlayClassName="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      backdropClassName="bg-ink/45 backdrop-blur-[1px]"
      backdropLabel="Close resume"
      label="Resume"
      panelClassName="sk-frame relative z-[102] flex max-h-[92dvh] w-full max-w-4xl flex-col rounded-[1.25rem] bg-page shadow-[0_32px_64px_rgba(0,0,0,0.2)] outline-none"
    >
      <Frame r={20} weight={1.6} tone={0.9} />
      <div className="flex shrink-0 items-center gap-3 px-5 py-4 sm:px-6">
        <h2 className="sk-heading">Resume</h2>
        <div className="ml-auto flex items-center gap-2">
          <PillLink size="sm" href={RESUME_URL} download={RESUME_FILENAME}>
            <Download size={14} /> <span className="hidden sm:inline">Download PDF</span>
          </PillLink>
          <PillLink size="sm" variant="outline" href={RESUME_URL}>
            <ExternalLink size={14} /> <span className="hidden sm:inline">Open PDF</span>
          </PillLink>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-pencil transition-[color,rotate] duration-300 hover:rotate-90 hover:text-ink focus-ring"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
      </div>
      {/* The page is taller than the viewport, so this is the scroll area. */}
      <div className="sk-rule min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-b-[1.25rem] p-3 sm:p-6">
        <img src={resumePreview} alt={`${NAME}'s resume`} className="mx-auto block w-full max-w-3xl rounded-lg bg-white" />
      </div>
    </Modal>
  );
}
