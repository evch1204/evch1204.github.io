import { ExternalLink, X } from 'lucide-react';
import Modal from '@/components/Modal';
import PillLink from '@/components/PillLink';
import Frame from '@/components/sketch/Frame';
import type { Project } from '@/content/projects';
import { youtubeEmbedUrl } from '@/lib/url';

/**
 * The project's demo video, played in a dialog framed like the rest of the
 * sheet: the project's name and a way out to YouTube across the top, the
 * video filling the frame below. The player only exists while the dialog is
 * open, so closing it also stops the sound.
 */
export default function DemoModal({ project, open, onClose }: { project: Project; open: boolean; onClose: () => void }) {
  if (!project.demoUrl) return null;
  return (
    <Modal
      open={open}
      onClose={onClose}
      overlayClassName="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      backdropClassName="bg-ink/45 backdrop-blur-[1px]"
      backdropLabel="Close demo"
      label={`${project.cardTitle} demo`}
      panelClassName="sk-frame relative z-[102] flex w-full max-w-5xl flex-col rounded-[1.25rem] bg-page shadow-[0_32px_64px_rgba(0,0,0,0.2)] outline-none"
    >
      <Frame r={20} weight={1.6} tone={0.9} />
      <div className="flex shrink-0 items-center gap-3 px-5 py-4 sm:px-6">
        <h2 className="sk-heading">{project.cardTitle}</h2>
        <span className="text-sm font-semibold text-graphite">Demo</span>
        <div className="ml-auto flex items-center gap-2">
          <PillLink size="sm" variant="outline" href={project.demoUrl}>
            <ExternalLink size={14} /> <span className="hidden sm:inline">Open on YouTube</span>
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
      <div className="sk-rule p-3 sm:p-6">
        {/* Ink behind the player, so the frame reads as a screen while the video loads. */}
        <div className="aspect-video w-full overflow-hidden rounded-lg bg-ink">
          <iframe
            src={youtubeEmbedUrl(project.demoUrl)}
            title={`${project.cardTitle} demo`}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="block h-full w-full border-0"
          />
        </div>
      </div>
    </Modal>
  );
}
