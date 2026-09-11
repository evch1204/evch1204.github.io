import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  /** Remounts the dialog when the thing it shows changes identity. */
  motionKey?: string;
  /**
   * Changes while the dialog stays open — a different project in the same
   * frame — scroll it back to the top and put focus on the panel again.
   */
  resetKey?: string;
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
  children: ReactNode;
};

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * The overlay, the click-to-close backdrop, the dialog frame and the pieces of
 * behaviour every modal needs: focus moves in and is kept in, Escape closes
 * it, and the page behind it stops scrolling while it is open.
 */
export default function Modal({
  open,
  onClose,
  motionKey,
  resetKey,
  overlayClassName,
  backdropClassName,
  backdropLabel,
  panelClassName,
  label,
  labelledBy,
  children,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  /*
   * Opening a dialog moves focus into it, so the keyboard is inside the thing
   * that just appeared; closing it hands focus back to whatever opened it.
   */
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    // `preventScroll`: a panel taller than the phone viewport would otherwise be
    // scrolled into view on open, jumping past its own title.
    panelRef.current?.focus({ preventScroll: true });
    return () => {
      opener?.focus();
    };
  }, [open]);

  /*
   * Which element scrolls depends on the layout — the panel itself as a phone
   * sheet, the overlay around it on desktop — so both go back to the top.
   */
  useEffect(() => {
    if (!open || resetKey === undefined) return;
    const panel = panelRef.current;
    if (!panel) return;
    panel.scrollTop = 0;
    if (panel.parentElement) panel.parentElement.scrollTop = 0;
    panel.focus({ preventScroll: true });
  }, [open, resetKey]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const panel = panelRef.current;
      if (!panel) return;
      // Only what can take focus right now: the phone action bar is display:none
      // on desktop, the desktop toolbar pills on a phone.
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.getClientRects().length > 0,
      );
      if (focusable.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      // Focus starts on the panel itself, which is outside the first-to-last run.
      const outside = active === panel || !panel.contains(active);
      if (e.shiftKey) {
        if (active === first || outside) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last || outside) {
        e.preventDefault();
        first.focus();
      }
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

  /*
   * Rendered into <body> rather than where it is written: a page's <main> is a
   * z-10 stacking context, so a dialog nested inside one would paint under the
   * z-50 header. This keeps the overlay above everything, exactly where it sat
   * when App owned both modals.
   */
  return createPortal(
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
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            aria-labelledby={labelledBy}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className={panelClassName}
          >
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
