import { useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  /** Remounts the dialog when the thing it shows changes identity. */
  motionKey?: string;
  /** Positioning of the full-screen layer the dialog sits in. */
  overlayClassName: string;
  /** Tint and blur of the click-to-close backdrop. */
  backdropClassName: string;
  /** Accessible name for the backdrop's close button. */
  backdropLabel: string;
  panelClassName: string;
  /** Name for a dialog with no visible title to point at. */
  label?: string;
  /** id of the dialog's visible title, when it has one. */
  labelledBy?: string;
  /** Keeps a click inside the panel from reaching anything behind it. */
  stopPanelClick?: boolean;
  children: ReactNode;
};

/**
 * The overlay, the click-to-close backdrop, the dialog frame and the two pieces
 * of behaviour every modal needs: Escape closes it, and the page behind it stops
 * scrolling while it is open.
 */
export default function Modal({
  open,
  onClose,
  motionKey,
  overlayClassName,
  backdropClassName,
  backdropLabel,
  panelClassName,
  label,
  labelledBy,
  stopPanelClick = false,
  children,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key={motionKey}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={overlayClassName}
        >
          <button
            type="button"
            className={`fixed inset-0 z-[101] ${backdropClassName}`}
            aria-label={backdropLabel}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={label}
            aria-labelledby={labelledBy}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className={panelClassName}
            onClick={stopPanelClick ? (e) => e.stopPropagation() : undefined}
          >
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
