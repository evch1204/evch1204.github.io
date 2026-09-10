import { ExternalLink, Github, X } from 'lucide-react';
import Modal from '@/components/Modal';
import Tag from '@/components/Tag';
import type { Project } from '@/content/projects';
import { hostLabel } from '@/lib/url';

export default function ProjectDetailModal({
  project,
  onClose,
}: {
  project: Project | null;
  onClose: () => void;
}) {
  return (
    <Modal
      open={project !== null}
      onClose={onClose}
      motionKey={project?.id}
      overlayClassName="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 pt-16 pb-12 sm:pt-24"
      backdropClassName="bg-black/45 backdrop-blur-[1px]"
      backdropLabel="Close project details"
      labelledBy="project-modal-title"
      panelClassName="relative z-[102] my-auto w-full max-w-2xl rounded-[1.5rem] sm:rounded-[2rem] border border-zinc-100 bg-white p-6 sm:p-10 shadow-[0_32px_64px_rgba(0,0,0,0.12)]"
      stopPanelClick
    >
      {project ? (
        <>
          <div className="flex items-start justify-between gap-4 mb-6">
            <h2 id="project-modal-title" className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight pr-2">
              {project.modalTitle}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
              aria-label="Close"
            >
              <X size={22} />
            </button>
          </div>

          <p className="text-sm text-zinc-600 leading-relaxed font-medium mb-8">{project.overview}</p>

          <div className="mb-8">
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-400 mb-3">Key Features</h3>
            <ul className="list-disc list-inside space-y-2 text-sm text-zinc-600 font-medium leading-relaxed">
              {project.keyFeatures.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>

          <div className="mb-10">
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-400 mb-3">Technologies Used</h3>
            <ul className="flex flex-wrap gap-2">
              {project.technologies.map((t) => (
                <li key={t}>
                  <Tag variant="detail">{t}</Tag>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-zinc-200 text-zinc-900 font-bold text-sm hover:bg-zinc-50 transition-colors"
            >
              Close
            </button>
            {project.githubUrl ? (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-colors ${
                  project.liveUrl
                    ? 'border border-zinc-200 text-zinc-900 hover:bg-zinc-50'
                    : 'bg-zinc-900 text-white hover:bg-black'
                }`}
              >
                <Github size={18} />
                View on GitHub
              </a>
            ) : null}
            {project.liveUrl ? (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-zinc-900 text-white font-bold text-sm hover:bg-black transition-colors"
              >
                <ExternalLink size={18} />
                {hostLabel(project.liveUrl)}
              </a>
            ) : null}
          </div>
        </>
      ) : null}
    </Modal>
  );
}
