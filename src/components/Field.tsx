import * as React from 'react';
import type { ReactNode } from 'react';
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
}

/** Ids for the field and its hint and error, plus the aria props the control needs. */
export function useFieldA11y(id: string, hint?: ReactNode, error?: ReactNode, describedBy?: string) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const ids = [hintId, errorId, describedBy].filter(Boolean).join(' ') || undefined;
  return { hintId, errorId, aria: { 'aria-describedby': ids, 'aria-invalid': error ? true : undefined } as const };
}

export function FieldLabel({ htmlFor, label, optional }: { htmlFor: string; label: ReactNode; optional?: boolean }) {
  return <label className="rnc-field-label" htmlFor={htmlFor}>{label}{optional ? <em> (optional)</em> : null}</label>;
}

export function FieldShell({ className, error, hint, hintId, errorId, label, children }: { className?: string; error?: ReactNode; hint?: ReactNode; hintId?: string; errorId?: string; label: ReactNode; children: ReactNode }) {
  return (
    <div className={cx('rnc-field', error ? 'is-invalid' : null, className)}>
      {label}
      {hint ? <p className="rnc-field-hint" id={hintId}>{hint}</p> : null}
      {children}
      {error ? <p className="rnc-field-error" id={errorId}>{error}</p> : null}
    </div>
  );
}
