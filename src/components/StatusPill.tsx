import { isValidElement, type HTMLAttributes, type ReactNode } from 'react';
import { Icon } from './Icon';
import type { IconName } from '../generated/icons';
import { cx } from '../utils';

/** Tone by meaning: not started, under way, waiting on someone, done, failed. */
export type StatusTone = 'neutral' | 'progress' | 'review' | 'success' | 'error';

export interface StatusPillProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** The status, in sentence case ("Ready for QA"). */
  children: ReactNode;
  /** Default "neutral". */
  tone?: StatusTone;
  /** A figure after the label, in the mono face ("44%"). */
  value?: ReactNode;
  /** An icon from the set by name, or your own element. Hidden from screen readers: the label says it. */
  icon?: IconName | ReactNode;
  /** A small dot before the label, when there's no icon. */
  dot?: boolean;
  /** "md" 28px (default) or "sm" 24px. */
  size?: 'sm' | 'md';
}

/**
 * Where a record stands, in a word: `<StatusPill tone="progress" value="44%">In progress</StatusPill>`.
 * The word carries the meaning; the tone's colour backs it up. A label, not a control.
 */
export function StatusPill({ children, tone = 'neutral', value, icon, dot = false, size = 'md', className, ...rest }: StatusPillProps) {
  let mark: ReactNode = null;
  if (typeof icon === 'string') mark = <Icon name={icon as IconName} size={size === 'sm' ? 14 : 16} />;
  else if (isValidElement(icon)) mark = <span aria-hidden="true" style={{ display: 'contents' }}>{icon}</span>;
  else if (dot) mark = <span className="rnc-status-dot" aria-hidden="true" />;
  const hasValue = value !== undefined && value !== null && value !== '';
  return (
    <span {...rest} className={cx('rnc-status', `is-${tone}`, size === 'sm' && 'is-sm', className)}>
      {mark}
      <span className="rnc-status-label">{children}</span>
      {hasValue ? <>{' '}<span className="rnc-status-value">{value}</span></> : null}
    </span>
  );
}
