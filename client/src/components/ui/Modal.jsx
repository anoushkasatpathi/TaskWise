import { createContext, useContext, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { IconButton } from './Button.jsx';

/** Lets ModalHost close a dialog (with its exit animation) without each dialog tracking `open`. */
export const ModalFrameContext = createContext(true);

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Dialog with enter/exit animation. While open it keeps keyboard focus
 * inside itself (standard dialog behaviour), closes on Escape, and gives focus
 * back to whatever opened it.
 *
 * size: sm | md | lg  (on phones every size becomes a bottom sheet)
 */
export default function Modal({ open: openProp, onClose, title, subtitle, size = 'md', children, footer, className = '', labelledBy }) {
  const frameOpen = useContext(ModalFrameContext);
  const open = Boolean(openProp && frameOpen);
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);
  const panel = useRef(null);
  const restoreTo = useRef(null);
  const titleId = useId();

  // Keep the dialog mounted while its exit animation plays.
  useEffect(() => {
    if (open) {
      setMounted(true);
      setClosing(false);
    } else if (mounted) {
      setClosing(true);
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const t = setTimeout(() => {
        setMounted(false);
        setClosing(false);
      }, reduce ? 120 : 240);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [open, mounted]);

  useEffect(() => {
    if (!open) return undefined;
    restoreTo.current = document.activeElement;
    const t = requestAnimationFrame(() => {
      const el = panel.current;
      if (!el) return;
      // Focus the requested field, otherwise the dialog itself (no stray focus ring on Close).
      const target = el.querySelector('[data-autofocus]') || el;
      target.focus({ preventScroll: true });
    });
    return () => {
      cancelAnimationFrame(t);
      const el = restoreTo.current;
      if (el && typeof el.focus === 'function' && document.contains(el)) el.focus({ preventScroll: true });
    };
  }, [open]);

  if (!mounted) return null;

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose?.();
    }
    if (e.key === 'Tab') {
      const items = [...panel.current.querySelectorAll(FOCUSABLE)].filter((n) => !n.closest('[inert]') && n.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  return createPortal(
    <div className={`modal-root ${closing ? 'is-closing' : ''}`} onKeyDown={onKeyDown}>
      <div className="modal-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        ref={panel}
        className={`modal modal--${size} ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy || (title ? titleId : undefined)}
        tabIndex={-1}
      >
        {(title || onClose) && (
          <header className="modal__head">
            <div className="modal__titles">
              {title && (
                <h2 className="modal__title" id={titleId}>
                  {title}
                </h2>
              )}
              {subtitle && <p className="modal__subtitle">{subtitle}</p>}
            </div>
            {onClose && <IconButton icon="x" label="Close" onClick={onClose} className="modal__close" />}
          </header>
        )}
        <div className="modal__body">{children}</div>
        {footer && <footer className="modal__foot">{footer}</footer>}
      </div>
    </div>,
    document.body
  );
}
