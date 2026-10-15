import {
  Children, isValidElement, useCallback, useEffect, useMemo, useRef, useState, type ReactElement, type ReactNode,
} from 'react';
import { Form, FormSpy } from 'react-final-form';
import arrayMutators from 'final-form-arrays';
import type { FormApi, Mutator } from 'final-form';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { cx } from '../utils';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Values = Record<string, any>;
type Errors = Record<string, any> | undefined | void;
/** The form's mutators (arrayMutators plus yours), as react-final-form gives them to fields: `mutators.setLogo(value)`. */
export type WizardMutators = Record<string, (...args: any[]) => any>;

export interface WizardPageProps<V extends Values = Values> {
  /** The step's name in the step bar ("Dates"). */
  label?: string;
  /** This step's validation. `{}` (or nothing) means the step is complete. */
  validate?: (values: V) => Errors;
  /** Leaves the step out of the step bar and navigation, e.g. Rules of play for BC, AB and MB. */
  hide?: (values: V) => boolean;
  /**
   * Marks the Review step (an eye in the step bar, locked until every other step is complete, hidden in QA mode).
   * Without it, the last visible step is the Review step unless `isQaPage` is set, as in the Raffle Builder.
   */
  review?: boolean;
  /** The step's content, or a function of (mutators, values, changePage). */
  children?: ReactNode | ((mutators: WizardMutators, values: V, changePage: (page: number) => void) => ReactNode);
}

/** One step. Use it as `Wizard.Page` (or `WizardPage`) inside `<Wizard>`. */
export function WizardPage<V extends Values = Values>(props: WizardPageProps<V> & { mutators?: WizardMutators; values?: V; changePage?: (page: number) => void }) {
  const { children, mutators, values, changePage } = props;
  if (typeof children === 'function') return <>{children(mutators ?? {}, (values ?? {}) as V, changePage ?? (() => {}))}</>;
  return <>{children}</>;
}

export interface WizardProps<V extends Values = Values> {
  /** Called on the last visible step (Submit or Complete form). The form is reset afterwards. */
  onSubmit: (values: V) => unknown | Promise<unknown>;
  /** The starting values; they persist across steps. */
  initialValues?: Partial<V>;
  /** Called on every value or focus change, with `{ values, active }`. Debounce it into an autosave. */
  onSave?: (state: { values: V; active?: string }) => void;
  /** Shown in the footer after "Last saved", e.g. "2 minutes ago". */
  lastSaved?: ReactNode;
  /** The footer shows a spinner and "Saving…". */
  isSaving?: boolean;
  /** Read-only: no submit button. (Lock the fields themselves with their own `disabled` props.) */
  disabledAll?: boolean;
  /** Admin QA mode: the Review step is hidden, and the last step shows Complete form when `briefStatus` is 2. */
  isQaPage?: boolean;
  briefStatus?: number;
  /** Accepted for compatibility; not used. */
  user?: unknown;
  /** The app's mutators, merged with `arrayMutators`: `{ setLogo: (args, state, utils) => utils.changeValue(state, 'logo', () => args[0]) }`. */
  mutators?: Record<string, Mutator<any>>;
  /** Top of the card, e.g. `<WizardHeader title={values.name} … />`. */
  header?: (values: V) => ReactNode;
  /** Above the card, e.g. `<WizardDeadline … />`. */
  notice?: (values: V) => ReactNode;
  /** Button labels. Defaults: Back, Next, Review, Submit, Complete form. */
  backLabel?: string;
  nextLabel?: string;
  reviewLabel?: string;
  submitLabel?: string;
  completeLabel?: string;
  /** Called instead of the inline message when someone selects Review before every step is complete (e.g. your SweetAlert). */
  onReviewBlocked?: () => void;
  /** Submit-type buttons are disabled while this is true. Default: while a SweetAlert2 dialog is open. */
  isSubmitBlocked?: () => boolean;
  /** The step bar's accessible name. Default "Form steps". */
  stepsLabel?: string;
  className?: string;
  children?: ReactNode;
}

const swalOpen = () => typeof document !== 'undefined' && !!document.querySelector('.swal2-container');
const isValid = <V extends Values>(validate: ((values: V) => Errors) | undefined, values: V) => Object.keys(validate?.(values) ?? {}).length === 0;

export type WizardStepState = 'complete' | 'incomplete' | 'review' | 'locked';
export interface WizardStep { label: string; state: WizardStepState }

/** The step bar: one button per step, each naming its state; the current step is marked. Scrolls sideways when narrow. */
export function WizardSteps({ steps, current, onSelect, label = 'Form steps' }: { steps: WizardStep[]; current: number; onSelect: (index: number) => void; label?: string }) {
  const nav = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = nav.current?.querySelector<HTMLElement>('[aria-current="step"]');
    if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [current]);
  const words: Record<WizardStepState, string> = { complete: 'complete', incomplete: 'not complete', review: 'ready', locked: 'available once every section is complete' };
  const icons: Record<WizardStepState, 'check' | 'x' | 'eye'> = { complete: 'check', incomplete: 'x', review: 'eye', locked: 'eye' };
  return (
    <nav className="rnc-wizard-steps" aria-label={label} ref={nav}>
      <ol>
        {steps.map((s, i) => (
          <li key={`${s.label}-${i}`}>
            <button
              type="button"
              className={cx('rnc-wizard-step', s.state === 'locked' ? 'is-review is-locked' : `is-${s.state}`)}
              aria-current={i === current ? 'step' : undefined}
              aria-disabled={s.state === 'locked' ? true : undefined}
              aria-label={`${s.label}, ${words[s.state]}`}
              onClick={() => onSelect(i)}
            >
              <span className="rnc-wizard-step-dot" aria-hidden="true"><Icon name={icons[s.state]} size={16} /></span>
              <span>{s.label}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/**
 * The Raffle Builder's setup form: one react-final-form form in steps, with the app's props and behaviour, in the design
 * system's look. A step bar (complete, not complete, Review), per-step validation that runs on mount, Next that never blocks,
 * Review locked until every step is complete, autosave through `onSave`, QA mode and read-only mode.
 */
function WizardRoot<V extends Values = Values>({
  onSubmit, initialValues, onSave, lastSaved, isSaving, disabledAll, isQaPage, briefStatus, mutators, header, notice,
  backLabel = 'Back', nextLabel = 'Next', reviewLabel = 'Review', submitLabel = 'Submit', completeLabel = 'Complete form',
  onReviewBlocked, isSubmitBlocked = swalOpen, stepsLabel = 'Form steps', className, children,
}: WizardProps<V>) {
  const [start] = useState(() => (initialValues ?? {}) as V);
  const [page, setPage] = useState(0);
  const [blocked, setBlocked] = useState(false);
  const body = useRef<HTMLDivElement>(null);
  const moved = useRef(false);
  const pages = Children.toArray(children).filter(isValidElement) as ReactElement<WizardPageProps<V>>[];
  const allMutators = useMemo(() => ({ ...arrayMutators, ...mutators }), [mutators]);

  // Everything works from the visible steps (hidden steps never shift the indexes).
  const visibleOf = useCallback((values: V) => pages.filter((p) => !(p.props.hide?.(values)) && !(isQaPage && p.props.review)), [pages, isQaPage]);
  const reviewOf = useCallback((visible: ReactElement<WizardPageProps<V>>[]) => {
    const explicit = visible.findIndex((p) => p.props.review);
    if (explicit > -1) return explicit;
    if (pages.some((p) => p.props.review)) return -1;
    return isQaPage ? -1 : visible.length - 1;
  }, [pages, isQaPage]);

  // The active step's validate is the form's validation; it changes with the step, so react-final-form re-runs it.
  const latestValues = useRef<V>(start);
  const validate = useCallback((values: V) => {
    const visible = visibleOf(values);
    const active = visible[Math.min(page, visible.length - 1)];
    return (active?.props.validate?.(values) ?? {}) as any;
  }, [visibleOf, page]);

  const goTo = (index: number) => { moved.current = true; setBlocked(false); setPage(index); };
  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    body.current?.focus({ preventScroll: true });
    const top = body.current?.getBoundingClientRect().top ?? 0;
    if (top < 0 && typeof body.current?.scrollIntoView === 'function') body.current.scrollIntoView({ block: 'start' });
  }, [page]);

  const handleSubmit = async (values: V, form: FormApi<V>) => {
    const visible = visibleOf(values);
    if (page >= visible.length - 1) {
      const data = await onSubmit(values);
      form.reset();
      return data as any;
    }
    goTo(Math.min(page + 1, visible.length - 1));
    return undefined;
  };

  return (
    <Form<V>
      initialValues={start}
      validate={validate}
      mutators={allMutators as any}
      onSubmit={handleSubmit as any}
      render={({ handleSubmit: submit, form, values, submitting }) => {
        latestValues.current = values;
        const visible = visibleOf(values);
        const current = Math.min(page, Math.max(0, visible.length - 1));
        const reviewIndex = reviewOf(visible);
        const sections = visible.map((p, i) => ({ p, i })).filter(({ i }) => i !== reviewIndex);
        const done = sections.filter(({ p }) => isValid(p.props.validate, values)).length;
        const allValid = visible.every((p) => isValid(p.props.validate, values));
        const steps: WizardStep[] = visible.map((p, i) => ({
          label: p.props.label ?? (i === reviewIndex ? reviewLabel : `Step ${i + 1}`),
          state: i === reviewIndex ? (done === sections.length ? 'review' : 'locked') : isValid(p.props.validate, values) ? 'complete' : 'incomplete',
        }));
        const select = (i: number) => {
          if (i === reviewIndex && done < sections.length) {
            if (onReviewBlocked) onReviewBlocked(); else setBlocked(true);
            return;
          }
          goTo(i);
        };
        const isLast = current === visible.length - 1;
        const beforeReview = reviewIndex > -1 && current === reviewIndex - 1;
        const submitOff = !allValid || isSubmitBlocked();
        const active = visible[current];
        return (
          <form className={cx('rnc-wizard', className)} onSubmit={(e) => e.preventDefault()} noValidate>
            {notice ? <div className="rnc-wizard-notice">{notice(values)}</div> : null}
            <div className="rnc-wizard-card">
              {header ? header(values) : null}
              {sections.length ? <p className="rnc-wizard-progress">{`${done} of ${sections.length} sections complete`}</p> : null}
              <WizardSteps steps={steps} current={current} onSelect={select} label={stepsLabel} />
              {blocked ? (
                <p className="rnc-wizard-blocked" role="alert">
                  <Icon name="warning" size={20} />Complete every section before you review. The steps marked with a cross still need something.
                </p>
              ) : null}
              <div className="rnc-wizard-body" ref={body} tabIndex={-1} aria-label={steps[current]?.label}>
                {active ? <WizardPage {...active.props} mutators={form.mutators as WizardMutators} values={values} changePage={goTo} /> : null}
              </div>
              <div className="rnc-wizard-foot">
                <span className="rnc-wizard-save" role="status">
                  {isSaving ? <><span className="rnc-btn-spinner" aria-hidden="true" />Saving…</> : lastSaved ? <>Last saved {lastSaved}</> : null}
                </span>
                <div className="rnc-wizard-actions">
                  {current > 0 ? <Button variant="secondary" onClick={() => goTo(current - 1)}>{backLabel}</Button> : null}
                  {!isLast && !beforeReview ? (
                    <Button onClick={() => goTo(Math.min(current + 1, visible.length - 1))}>{nextLabel}</Button>
                  ) : beforeReview ? (
                    <Button startIcon="eye" disabled={submitOff} onClick={() => goTo(current + 1)}>{reviewLabel}</Button>
                  ) : isQaPage && Number(briefStatus) === 2 ? (
                    <Button startIcon="check-circle" disabled={submitOff} loading={submitting} onClick={() => submit()}>{completeLabel}</Button>
                  ) : !isQaPage && !disabledAll ? (
                    <Button disabled={submitOff} loading={submitting} onClick={() => submit()}>{submitLabel}</Button>
                  ) : null}
                </div>
              </div>
            </div>
            {onSave ? <FormSpy<V> subscription={{ active: true, values: true }} onChange={(s) => onSave({ values: s.values as V, active: s.active as string | undefined })} /> : null}
          </form>
        );
      }}
    />
  );
}

type WizardComponent = typeof WizardRoot & { Page: typeof WizardPage };
/** The setup form wizard. Steps go inside as `<Wizard.Page>`. */
export const Wizard = Object.assign(WizardRoot, { Page: WizardPage }) as WizardComponent;
