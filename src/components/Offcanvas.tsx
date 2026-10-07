import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';
import { useFieldId } from './Field';
import { cx, prefersReducedMotion } from '../utils';

export interface OffcanvasProps {
  /** Whether the panel is open. */
  open: boolean;
  /** Called when the person closes it (Escape, the close button or a click on the dimmed page). */
  onClose: () => void;
  /** The edge it slides in from. Default "right". */
  side?: 'left' | 'right' | 'top' | 'bottom';
  /** The panel's heading, also its accessible name. Use `ariaLabel` instead when there's no visible title. */
  title?: ReactNode;
  ariaLabel?: string;
  /** Width (left/right) or height (top/bottom), any CSS length. Default 380px / 50vh. */
  size?: string;
  children?: ReactNode;
  /** Close on a click on the dimmed page. Default true. */
  closeOnBackdrop?: boolean;
  /** Close with the Escape key. Default true. */
  closeOnEscape?: boolean;
  /** Show the close button. Default true. */
  showClose?: boolean;
  /** Close button's accessible name. Default "Close". */
  closeLabel?: string;
  /** The element to focus when it opens. Default: the first focusable element inside. */
  initialFocus?: RefObject<HTMLElement | null>;
  /** No padding around the content (for a Sidebar or a full-bleed list). */
  flush?: boolean;
  className?: string;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const EXIT_MS = 180;

/**
 * A panel that slides in from an edge over a dimmed page (a modal dialog). Focus moves inside and stays there,
 * the page behind doesn't scroll, and when it closes focus returns to whatever opened it. No motion under reduced motion.
 */
export function Offcanvas({
  open, onClose, side = 'right', title, ariaLabel, size, children, closeOnBackdrop = true, closeOnEscape = true,
  showClose = true, closeLabel = 'Close', initialFocus, flush, className,
}: OffcanvasProps) {
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const titleId = `${useFieldId()}-title`;

  // Mount on open; on close, play the exit (unless reduced motion), then unmount.
  useEffect(() => {
    if (open) { setClosing(false); setMounted(true); return; }
    if (!mounted) return;
    if (prefersReducedMotion()) { setMounted(false); return; }
    setClosing(true);
    const t = setTimeout(() => { setMounted(false); setClosing(false); }, EXIT_MS);
    return () => clearTimeout(t);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // While open: remember what had focus, move focus in, lock page scroll, and restore all of it afterwards.
  useEffect(() => {
    if (!open) return;
    returnTo.current = document.activeElement as HTMLElement | null;
    const body = document.body;
    const prevOverflow = body.style.overflow;
    body.style.overflow = 'hidden';
    const focusIn = () => {
      const target = initialFocus?.current || panel.current?.querySelector<HTMLElement>(FOCUSABLE) || panel.current;
      target?.focus();
    };
    focusIn(); // the panel renders on the same commit that opens it, so it's already in the DOM
    const raf = requestAnimationFrame(() => { if (!panel.current?.contains(document.activeElement)) focusIn(); });
    return () => {
      cancelAnimationFrame(raf);
      body.style.overflow = prevOverflow;
      const back = returnTo.current;
      if (back && typeof back.focus === 'function' && document.contains(back)) back.focus();
    };
  }, [open, initialFocus]);

  // Render whenever it's open, even on the first render before `mounted` catches up, so focus can move in at once.
  if (!(open || mounted) || typeof document === 'undefined') return null;

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && closeOnEscape) { e.stopPropagation(); onCloseRef.current(); return; }
    if (e.key !== 'Tab' || !panel.current) return;
    const nodes = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (!nodes.length) { e.preventDefault(); return; }
    const first = nodes[0], last = nodes[nodes.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  const style = size ? ({ ['--oc-size' as string]: size } as CSSProperties) : undefined;

  return createPortal(
    <>
      <div className={cx('rnc-offcanvas-backdrop', closing && 'is-closing')} onClick={closeOnBackdrop ? () => onCloseRef.current() : undefined} aria-hidden="true" />
      <div
        ref={panel} role="dialog" aria-modal="true" aria-labelledby={title ? titleId : undefined} aria-label={title ? undefined : ariaLabel}
        tabIndex={-1} className={cx('rnc-offcanvas', `from-${side}`, flush && 'is-flush', closing && 'is-closing', className)} style={style} onKeyDown={onKeyDown}
      >
        {title || showClose ? (
          <div className="rnc-offcanvas-head">
            {title ? <h2 className="rnc-offcanvas-title" id={titleId}>{title}</h2> : null}
            {showClose ? <button type="button" className="rnc-offcanvas-close" aria-label={closeLabel} onClick={() => onCloseRef.current()}><Icon name="x" size={20} /></button> : null}
          </div>
        ) : null}
        <div className="rnc-offcanvas-body">{children}</div>
      </div>
    </>,
    document.body,
  );
}
