import { useEffect, useRef, type MouseEvent, type ReactNode } from 'react';
import { cx } from '../utils';

export interface ErrorSummaryItem {
  /** The id of the field with the problem (the summary links to it). */
  fieldId: string;
  /** The same message the field shows. */
  message: ReactNode;
}
export interface ErrorSummaryProps {
  errors: ErrorSummaryItem[];
  /** Default: "Check one thing before you continue" or "Check N things before you continue". */
  title?: ReactNode;
  /** Move focus to the summary when it appears (default true), so keyboard and screen-reader users land on it. */
  autoFocus?: boolean;
  className?: string;
}

/** Shown at the top of a form after a failed submit. Takes focus and links to each field with a problem. */
export function ErrorSummary({ errors, title, autoFocus = true, className }: ErrorSummaryProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (autoFocus && errors.length) ref.current?.focus(); }, [autoFocus, errors.length]);
  if (!errors.length) return null;
  const heading = title ?? (errors.length === 1 ? 'Check one thing before you continue' : `Check ${errors.length} things before you continue`);
  const go = (fieldId: string) => (e: MouseEvent) => {
    const el = typeof document !== 'undefined' ? document.getElementById(fieldId) : null;
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView?.({ block: 'center' });
    (el as HTMLElement).focus();
  };
  return (
    <div ref={ref} className={cx('rnc-errsum', className)} role="alert" tabIndex={-1}>
      <h2>{heading}</h2>
      <ul>{errors.map((er) => <li key={er.fieldId}><a href={`#${er.fieldId}`} onClick={go(er.fieldId)}>{er.message}</a></li>)}</ul>
    </div>
  );
}
