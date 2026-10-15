import * as React from 'react';
import type { ReactNode } from 'react';
import { Icon } from './Icon';
import { cx } from '../utils';

let counter = 0;
/** A stable id: React 18's useId when available, otherwise a per-instance counter (React 17). */
export function useFieldId(provided?: string): string {
  const reactUseId = (React as unknown as { useId?: () => string }).useId;
  const generated = reactUseId ? reactUseId() : React.useRef(`rnc-${++counter}`).current;
  return provided || `rnc-f${generated.replace(/:/g, '')}`;
}

export interface FieldBaseProps {
  /** The visible label. Required: every field has one. */
  label: ReactNode;
  /** Help shown under the label, e.g. "We send your tickets here." */
  hint?: ReactNode;
  /** What to fix, e.g. "Enter an email address like name@example.com." Marks the field invalid. */
  error?: ReactNode;
  /** Adds "(optional)" to the label. Mark optional fields, not required ones. */
  optional?: boolean;
  /** Read-only review: the value stays in full ink and a Copy button sits inside the field. */
  review?: boolean;
}

/** Ids for the field and its hint and error, plus the aria props the control needs. */
export function useFieldA11y(id: string, hint?: ReactNode, error?: ReactNode, ...describedBy: (string | undefined)[]) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const ids = [hintId, errorId, ...describedBy].filter(Boolean).join(' ') || undefined;
  return { hintId, errorId, aria: { 'aria-describedby': ids, 'aria-invalid': error ? true : undefined } as const };
}

export function FieldLabel({ htmlFor, label, optional }: { htmlFor: string; label: ReactNode; optional?: boolean }) {
  return <label className="rnc-field-label" htmlFor={htmlFor}>{label}{optional ? <em> (optional)</em> : null}</label>;
}

/** Copies text, with a fallback for browsers without the async clipboard (or without permission). */
export async function copyText(text: string): Promise<void> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); return; }
  } catch { /* fall through to the fallback */ }
  if (typeof document === 'undefined') return;
  const t = document.createElement('textarea');
  t.value = text; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
  document.body.appendChild(t); t.select();
  try { document.execCommand('copy'); } finally { t.remove(); }
}

export interface CopyButtonProps {
  /** What to copy, or a function that returns it when clicked. */
  value: string | (() => string);
  /** Names the field: "Copy {label}". */
  label?: ReactNode;
  className?: string;
}

/** The Copy button inside a read-only field. It turns into a check and says "Copied" for a moment. */
export function CopyButton({ value, label, className }: CopyButtonProps) {
  const [done, setDone] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  React.useEffect(() => () => clearTimeout(timer.current), []);
  const name = typeof label === 'string' && label ? label : 'value';
  return (
    <button type="button" className={cx('rnc-affix-btn', 'rnc-copy-btn', done && 'is-done', className)} aria-label={`Copy ${name}`}
      onClick={async () => { await copyText(typeof value === 'function' ? value() : value); setDone(true); clearTimeout(timer.current); timer.current = setTimeout(() => setDone(false), 1600); }}>
      <Icon name={done ? 'check' : 'copy'} size={20} />
      <span className="rnc-sr-only" role="status">{done ? 'Copied' : ''}</span>
    </button>
  );
}

/** Tracks how many characters a field holds, whether it's controlled (`value`) or not. */
export function useCharCount(value: unknown, defaultValue: unknown) {
  const [own, setOwn] = React.useState(() => String(defaultValue ?? '').length);
  const controlled = value !== undefined && value !== null;
  return { length: controlled ? String(value).length : own, track: (next: string) => { if (!controlled) setOwn(next.length); } };
}

/** "72 characters left" under a field with a limit. Darker near the limit and red at it; read out once it's close. */
export function CharCount({ id, length, max }: { id: string; length: number; max: number }) {
  const left = Math.max(0, max - length);
  const near = left <= Math.max(10, Math.round(max * 0.1));
  return (
    <span id={id} className={cx('rnc-field-count', near && 'is-near', left === 0 && 'is-full')} aria-live={near ? 'polite' : 'off'}>
      {left === 0 ? 'No characters left' : `${left.toLocaleString('en-CA')} character${left === 1 ? '' : 's'} left`}
    </span>
  );
}

export function FieldShell({ className, error, hint, hintId, errorId, label, count, review, children }: { className?: string; error?: ReactNode; hint?: ReactNode; hintId?: string; errorId?: string; label: ReactNode; count?: ReactNode; review?: boolean; children: ReactNode }) {
  const err = error ? <p className="rnc-field-error" id={errorId}>{error}</p> : null;
  return (
    <div className={cx('rnc-field', error ? 'is-invalid' : null, review ? 'is-review' : null, className)}>
      {label}
      {hint ? <p className="rnc-field-hint" id={hintId}>{hint}</p> : null}
      {children}
      {count ? <div className="rnc-field-foot">{err}{count}</div> : err}
    </div>
  );
}
