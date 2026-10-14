import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { cx } from '../utils';

/** done: reached. late: reached late (or overdue). next: the step it's waiting on. pending: not reached. */
export type StepState = 'done' | 'late' | 'next' | 'pending';

export interface TimelineStep {
  /** The step's name ("Created"). Shown above the date, or only read out when `showLabels` is false. */
  label: string;
  /** When it was reached: a Date (formatted "May 18, 2026"), or your own text. Empty means not reached. */
  date?: Date | string | number | null;
  /** Leave it out and it's worked out: a date means "done"; the first step without one is "next"; later ones "pending". */
  state?: StepState;
}

export interface StepTimelineProps extends Omit<HTMLAttributes<HTMLOListElement>, 'children'> {
  steps: TimelineStep[];
  /** Show each step's name above its date. Default true. In a table, put the names in the header with `StepTimelineLabels` and pass false. */
  showLabels?: boolean;
  /** Turns a Date into text. Default "May 18, 2026". */
  formatDate?: (date: Date) => string;
  /** Default "Not set". */
  emptyText?: string;
  /** Default "Up next". */
  nextText?: string;
  /** Read out after a late step's date. Default "late". */
  lateText?: string;
}

const DEFAULT_FORMAT = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const defaultFormat = (d: Date) => DEFAULT_FORMAT.format(d);
const isEmpty = (v: TimelineStep['date']) => v === undefined || v === null || v === '';

/** Works out each step's state when it isn't given. */
export function stepStates(steps: TimelineStep[]): StepState[] {
  const firstEmpty = steps.findIndex((s) => isEmpty(s.date));
  return steps.map((s, i) => s.state ?? (!isEmpty(s.date) ? 'done' : i === firstEmpty ? 'next' : 'pending'));
}

const reached = (s: StepState | undefined) => s === 'done' || s === 'late';

/**
 * A record's steps on one line, the date each was reached under it:
 * `<StepTimeline steps={[{ label: 'Created', date: form.createdAt }, { label: 'Started', date: form.startedAt, state: 'late' }, …]} />`.
 * Green joins the steps reached; a blue ring marks the one it's waiting on; a red diamond marks a late step.
 */
export function StepTimeline({
  steps, showLabels = true, formatDate = defaultFormat, emptyText = 'Not set', nextText = 'Up next', lateText = 'late',
  className, style, ...rest
}: StepTimelineProps) {
  const states = stepStates(steps);
  const text = (d: TimelineStep['date']): ReactNode => {
    if (d instanceof Date) return Number.isNaN(d.getTime()) ? '' : formatDate(d);
    return d as ReactNode;
  };
  return (
    <ol {...rest} className={cx('rnc-steps', className)} style={{ ...style, '--steps-n': steps.length } as CSSProperties}>
      {steps.map((step, i) => {
        const state = states[i];
        const done = reached(state) && !isEmpty(step.date);
        return (
          <li key={i} className={cx('rnc-step', `is-${state}`)}>
            <span className="rnc-step-track" aria-hidden="true">
              <span className="rnc-step-node" />
              {i < steps.length - 1 ? <span className={cx('rnc-step-line', reached(states[i + 1]) && 'is-reached')} /> : null}
            </span>
            {showLabels ? <span className="rnc-step-label">{step.label}</span> : <span className="rnc-sr-only">{step.label}: </span>}
            {done ? (
              <>
                <span className="rnc-step-date">{text(step.date)}</span>
                {state === 'late' ? <span className="rnc-sr-only">, {lateText}</span> : null}
              </>
            ) : reached(state) ? (
              // Marked reached but no date: a dash, and the state in words for screen readers.
              <><span className="rnc-step-empty" aria-hidden="true">—</span><span className="rnc-sr-only">{state === 'late' ? lateText : 'done'}</span></>
            ) : (
              <span className="rnc-step-empty">{state === 'next' ? nextText : emptyText}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export interface StepTimelineLabelsProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** The step names, in order ("Created", "Started", …). Same count as the timelines under them. */
  labels: string[];
  /** Read out in place of the names (the column's name, "Timeline"). Default "Timeline". */
  srLabel?: string;
}

/**
 * The step names once, for a table header, on the same tracks as the `StepTimeline`s in the rows:
 * `<th><StepTimelineLabels labels={['Created', 'Started', 'Submitted', 'Completed']} /></th>`.
 */
export function StepTimelineLabels({ labels, srLabel = 'Timeline', className, style, ...rest }: StepTimelineLabelsProps) {
  return (
    <>
      <span className="rnc-sr-only">{srLabel}</span>
      <span {...rest} aria-hidden="true" className={cx('rnc-steps-labels', className)} style={{ ...style, '--steps-n': labels.length } as CSSProperties}>
        {labels.map((l, i) => <span key={i}>{l}</span>)}
      </span>
    </>
  );
}
