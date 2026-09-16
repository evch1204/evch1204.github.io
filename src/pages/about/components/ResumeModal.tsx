import { Download, ExternalLink, X } from 'lucide-react';
import Modal from '@/components/Modal';
import PillLink from '@/components/PillLink';
import { NAME, RESUME_FILENAME, RESUME_URL } from '@/content/site';
import resumePreview from '@/assets/images/resume-preview-page1.jpg';

/** Enlarged, scrollable resume. Same close behaviour as the project modal. */
export default function ResumeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      overlayClassName="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      backdropClassName="bg-black/50 backdrop-blur-[1px]"
      backdropLabel="Close resume"
      label="Resume"
      panelClassName="relative z-[102] flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-[1.25rem] sm:rounded-[1.5rem] border border-zinc-100 bg-white shadow-[0_32px_64px_rgba(0,0,0,0.18)]"
    >
      <div className="flex shrink-0 items-center gap-3 border-b border-zinc-100 px-5 py-4 sm:px-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">Resume</h2>
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
            className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
      </div>
      {/* The page is taller than the viewport, so this is the scroll area. */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-zinc-100 p-3 sm:p-6">
        <img
          src={resumePreview}
          alt={`${NAME}'s resume`}
          className="mx-auto block w-full max-w-3xl rounded-lg border border-zinc-200 bg-white shadow-sm"
        />
      </div>
    </Modal>
  );
}
