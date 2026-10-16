import {
  Children, isValidElement, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactElement, type ReactNode,
} from 'react';
import { Form, FormSpy } from 'react-final-form';
import arrayMutators from 'final-form-arrays';
import type { FormApi, Mutator } from 'final-form';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { cx, useReducedMotion } from '../utils';
import { useDragScroll } from '../dragScroll';
import { WizardCelebration, type WizardCelebrationProps } from './celebration';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Values = Record<string, any>;
type Errors = Record<string, any> | undefined | void;
/** The form's mutators (arrayMutators plus yours), as react-final-form gives them to fields: `mutators.setLogo(value)`. */
export type WizardMutators = Record<string, (...args: any[]) => any>;

export interface WizardPageProps<V extends Values = Values> {
  /** The step's name in the step bar ("Dates"), and its title in the V2 layout. */
  label?: string;
  /** V2: a short line under the step's name in the rail ("1 licence, 3 packs"). */
  summary?: (values: V) => ReactNode;
  /** V2: the line under the step's title ("We use this to build your raffle site"). */
  description?: ReactNode;
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
  /** Testing only: Review opens before every step is complete, so you can check it. Submit stays disabled until every step is. */
  reviewUnlocked?: boolean;
  /**
   * Celebrate a successful submit with `WizardCelebration` (confetti, a check, what happens next). `true` uses its default words;
   * pass `{ title, text, actionLabel }` to change them. Off by default. Skipped when `onSubmit` returns submission errors or throws.
   */
  celebrate?: boolean | Pick<WizardCelebrationProps, 'title' | 'text' | 'actionLabel'>;
  /** Submit-type buttons are disabled while this is true. Default: while a SweetAlert2 dialog is open. */
  isSubmitBlocked?: () => boolean;
  /** The step bar's accessible name. Default "Form steps". */
  stepsLabel?: string;
  /** `v1` (default): one card with a step bar, the app's current shape. `v2`: the Raffle Builder layout of RNC V2.1, with a rail. */
  layout?: 'v1' | 'v2';
  /** V2: under the steps in the rail, e.g. the QA checks. Moves below the step on phones. */
  aside?: (values: V) => ReactNode;
  /** V2: the rail's accessible name. Default "Setup form". */
  railLabel?: string;
  /** V2: a top bar above everything, e.g. `<WizardToolbar … />` (back, the product, a breadcrumb, the status and the form's actions). */
  toolbar?: (values: V) => ReactNode;
  /**
   * V2: a live preview beside the step's sections, e.g. `<WizardPreview url={…}><WizardSitePreview … /></WizardPreview>`.
   * Return null for steps without one (usually every step but Website). Below a certain width it moves under the sections.
   */
  preview?: (values: V, step: { label: string; index: number }) => ReactNode;
  /**
   * V2: a Hide preview / Show preview button beside the step's title, so people can give the form the full width. On by default
   * when there's a preview. Hidden, the preview stays mounted (it keeps its desktop or mobile choice).
   */
  previewToggle?: boolean;
  /** V2: start with the preview hidden (uncontrolled). */
  defaultPreviewHidden?: boolean;
  /** V2: the preview's hidden state, controlled. Pair it with `onPreviewHiddenChange`, e.g. to remember it per person. */
  previewHidden?: boolean;
  onPreviewHiddenChange?: (hidden: boolean) => void;
  /** V2: the toggle's words. Defaults "Hide preview" and "Show preview". */
  hidePreviewLabel?: string;
  showPreviewLabel?: string;
  className?: string;
  children?: ReactNode;
}

const swalOpen = () => typeof document !== 'undefined' && !!document.querySelector('.swal2-container');
const isValid = <V extends Values>(validate: ((values: V) => Errors) | undefined, values: V) => Object.keys(validate?.(values) ?? {}).length === 0;

export type WizardStepState = 'complete' | 'incomplete' | 'review' | 'locked';
export interface WizardStep { label: string; state: WizardStepState; summary?: ReactNode }

/** The step bar: one button per step, each naming its state; the current step is marked. Scrolls sideways when narrow. */
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * Keeps every field the form has seen registered (silently) until the wizard unmounts. Leaving a step unmounts its fields; without
 * this, final-form forgets their state, and react-final-form 7 then resets a remounted field to its initial value (losing what
 * people typed). Harmless with react-final-form 6.
 */
function KeepFieldState({ form }: { form: FormApi<any> }) {
  const kept = useRef(new Map<string, () => void>());
  useEffect(() => {
    for (const name of form.getRegisteredFields()) {
      if (!kept.current.has(name)) kept.current.set(name, form.registerField(name, () => {}, {}));
    }
  });
  useEffect(() => () => { kept.current.forEach((off) => off()); kept.current.clear(); }, []);
  return null;
}

export function WizardSteps({ steps, current, onSelect, label = 'Form steps', layout = 'v1' }: { steps: WizardStep[]; current: number; onSelect: (index: number) => void; label?: string; layout?: 'v1' | 'v2' }) {
  const nav = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLOListElement>(null);
  const rail = layout === 'v2';
  const reduce = useReducedMotion();

  // When the steps scroll sideways (narrow screens): fades and arrows show there's more, the current step comes to the
  // middle, and a mouse can drag the row (touch already can).
  const { edges, dragProps: stepDrag } = useDragScroll(track);
  useEffect(() => {
    const t = track.current; const el = t?.querySelector<HTMLElement>('[aria-current="step"]');
    if (!t || !el || t.scrollWidth <= t.clientWidth) return;
    const li = el.closest('li') as HTMLElement | null ?? el;
    const left = li.offsetLeft - (t.clientWidth - li.offsetWidth) / 2;
    if (typeof t.scrollTo === 'function') t.scrollTo({ left, behavior: reduce ? 'auto' : 'smooth' }); else t.scrollLeft = left;
  }, [current, reduce]);
  const nudge = (dir: 1 | -1) => {
    const t = track.current; if (!t) return;
    const by = dir * Math.max(120, t.clientWidth * 0.7);
    if (typeof t.scrollBy === 'function') t.scrollBy({ left: by, behavior: reduce ? 'auto' : 'smooth' }); else t.scrollLeft += by;
  };

  // V2: one white card under the current step that glides to the next one (instead of jumping)
  const [marker, setMarker] = useState<{ style: CSSProperties; ready: boolean } | null>(null);
  const place = useCallback(() => {
    const ol = list.current; const el = ol?.querySelector<HTMLElement>('[aria-current="step"]');
    if (!ol || !el) return;
    // Measured against the list itself: each step's <li> is positioned (for the connecting line), so offsetTop would be 0 for
    // every step and the card would never leave the first one (Miguel, 2026-10-16: "clicking next doesn't highlight the next tab").
    const r = el.getBoundingClientRect(); const o = ol.getBoundingClientRect();
    const x = r.left - o.left - ol.clientLeft; const y = r.top - o.top - ol.clientTop;
    const style: CSSProperties = { transform: `translate(${x}px, ${y}px)`, width: el.offsetWidth, height: el.offsetHeight };
    setMarker((m) => ({ style, ready: !!m }));
  }, []);
  useIsoLayoutEffect(() => { if (rail) place(); }, [rail, current, steps.length, place]);
  useEffect(() => {
    if (!rail || typeof ResizeObserver === 'undefined' || !list.current) return;
    const ro = new ResizeObserver(() => place());
    ro.observe(list.current);
    return () => ro.disconnect();
  }, [rail, place]);

  // A step's circle pops when its state changes (it's done, or Review unlocks); not on the first render
  const prev = useRef<WizardStepState[] | null>(null);
  const [pops, setPops] = useState<number[]>([]);
  const stateKey = steps.map((s) => s.state).join(',');
  useEffect(() => {
    const before = prev.current; const now = steps.map((s) => s.state);
    prev.current = now;
    if (!before) return;
    const changed = now.map((st, i) => (before[i] !== undefined && before[i] !== st && (st === 'complete' || st === 'review') ? i : -1)).filter((i) => i > -1);
    if (!changed.length) return;
    setPops(changed);
    const t = setTimeout(() => setPops([]), 450);
    return () => clearTimeout(t);
  }, [stateKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const words: Record<WizardStepState, string> = { complete: 'complete', incomplete: 'not complete', review: 'ready', locked: 'available once every section is complete' };
  const icons: Record<WizardStepState, 'check' | 'x' | 'eye'> = { complete: 'check', incomplete: 'x', review: 'eye', locked: 'eye' };
  return (
    <nav className={cx('rnc-wizard-steps', rail && 'is-rail', rail && marker && 'has-marker', edges.back && 'can-back', edges.more && 'can-more')} aria-label={label} ref={nav}>
      <button type="button" className="rnc-wizard-steps-arrow is-back" tabIndex={-1} aria-hidden="true" onClick={() => nudge(-1)}><Icon name="caret-left" size={18} /></button>
      <div className="rnc-wizard-steps-track" ref={track} {...stepDrag}>
      <ol ref={list}>
        {rail && marker ? <span className={cx('rnc-wizard-rail-marker', marker.ready && 'is-ready')} style={marker.style} aria-hidden="true" /> : null}
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
              <span className={cx('rnc-wizard-step-dot', pops.includes(i) && 'is-pop')} aria-hidden="true"><Icon name={icons[s.state]} size={16} /></span>
              <span className="rnc-wizard-step-name">{s.label}</span>
              {rail && s.summary != null && s.summary !== '' ? <span className="rnc-wizard-step-sub">{s.summary}</span> : null}
            </button>
          </li>
        ))}
      </ol>
      </div>
      <button type="button" className="rnc-wizard-steps-arrow is-more" tabIndex={-1} aria-hidden="true" onClick={() => nudge(1)}><Icon name="caret-right" size={18} /></button>
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
  onReviewBlocked, reviewUnlocked = false, celebrate = false, isSubmitBlocked = swalOpen, stepsLabel = 'Form steps', layout = 'v1', aside, railLabel = 'Setup form', toolbar, preview, className, children,
  previewToggle = true, defaultPreviewHidden = false, previewHidden, onPreviewHiddenChange, hidePreviewLabel = 'Hide preview', showPreviewLabel = 'Show preview',
}: WizardProps<V>) {
  const [celebrating, setCelebrating] = useState(false);
  const [ownHidden, setOwnHidden] = useState(defaultPreviewHidden);
  const hidden = previewToggle && (previewHidden ?? ownHidden);
  const [revealed, setRevealed] = useState(false);
  const sideId = useId();
  const togglePreview = () => {
    const next = !hidden;
    if (previewHidden === undefined) setOwnHidden(next);
    setRevealed(!next);
    onPreviewHiddenChange?.(next);
  };
  const [start] = useState(() => (initialValues ?? {}) as V);
  const [page, setPage] = useState(0);
  const [blocked, setBlocked] = useState(false);
  const [travel, setTravel] = useState<'forward' | 'back' | null>(null);
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

  const goTo = (index: number) => { moved.current = true; setBlocked(false); setTravel(index >= page ? 'forward' : 'back'); setPage(index); };
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
      const failed = !!data && typeof data === 'object' && Object.keys(data as object).length > 0;
      if (celebrate && !failed) setCelebrating(true);
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
          state: i === reviewIndex ? (done === sections.length || reviewUnlocked ? 'review' : 'locked') : isValid(p.props.validate, values) ? 'complete' : 'incomplete',
          summary: p.props.summary?.(values),
        }));
        const select = (i: number) => {
          if (i === reviewIndex && done < sections.length && !reviewUnlocked) {
            if (onReviewBlocked) onReviewBlocked(); else setBlocked(true);
            return;
          }
          goTo(i);
        };
        const isLast = current === visible.length - 1;
        const beforeReview = reviewIndex > -1 && current === reviewIndex - 1;
        const submitOff = !allValid || isSubmitBlocked();
        const active = visible[current];
        const v2 = layout === 'v2';
        const progress = sections.length ? (
          <div className="rnc-wizard-progress">
            {`${done} of ${sections.length} sections complete`}
            {v2 ? <span className="rnc-wizard-track" aria-hidden="true"><span style={{ width: `${Math.round((done / sections.length) * 100)}%` }} /></span> : null}
          </div>
        ) : null;
        const bar = <WizardSteps steps={steps} current={current} onSelect={select} label={stepsLabel} layout={layout} />;
        const alert = blocked ? (
          <p className="rnc-wizard-blocked" role="alert">
            <Icon name="warning" size={20} />Complete every section before you review. The steps marked with a cross still need something.
          </p>
        ) : null;
        const content = (
          <div className="rnc-wizard-body" ref={body} tabIndex={-1} aria-label={steps[current]?.label}>
            {(() => {
              // Only the step's title and form animate when the step changes (keyed by step, so they remount and play
              // in). The live preview sits outside that, so it stays mounted and still while people move between
              // steps (Miguel, 2026-10-16: "don't animate live preview section").
              const enter = cx('rnc-wizard-enter', travel && `is-${travel} is-moved`);
              const head = v2 ? (
                <div className="rnc-wizard-page-head">
                  <h2 className="rnc-wizard-page-title">{steps[current]?.label}</h2>
                  {active?.props.description ? <p className="rnc-wizard-page-lede">{active.props.description}</p> : null}
                </div>
              ) : null;
              const page = active ? <WizardPage {...active.props} mutators={form.mutators as WizardMutators} values={values} changePage={goTo} /> : null;
              const side = v2 && preview ? preview(values, { label: steps[current]?.label ?? '', index: current }) : null;
              if (side == null || side === false) return <div key={current} className={enter}>{head}{page}</div>;
              // The toggle sits outside the animated head, so it stays put between steps. Hidden, the form takes the full
              // width (Miguel, 2026-10-16: "allow user to hide live preview to expand content").
              const toggle = previewToggle ? (
                <Button className="rnc-wizard-preview-toggle" variant="ghost" size="sm" startIcon={hidden ? 'eye' : 'eye-slash'}
                  aria-expanded={!hidden} aria-controls={sideId} onClick={togglePreview}>
                  {hidden ? showPreviewLabel : hidePreviewLabel}
                </Button>
              ) : null;
              return (
                <>
                  <div className="rnc-wizard-page-bar"><div key={`head-${current}`} className={enter}>{head}</div>{toggle}</div>
                  <div className={cx('rnc-wizard-split', hidden && 'is-solo')}>
                    <div key={current} className={enter}>{page}</div>
                    <div id={sideId} className={cx('rnc-wizard-side', revealed && 'is-revealed')} hidden={hidden}>{side}</div>
                  </div>
                </>
              );
            })()}
          </div>
        );
        const foot = (
          <div className="rnc-wizard-foot">
            <span className="rnc-wizard-save" role="status">
              {isSaving ? <span className="rnc-wizard-save-msg" key="saving"><span className="rnc-btn-spinner" aria-hidden="true" />Saving…</span>
                : lastSaved ? <span className="rnc-wizard-save-msg" key={`saved-${String(lastSaved)}`}>{v2 ? <Icon name="check-circle" size={18} /> : null}Last saved {lastSaved}</span> : null}
            </span>
            <div className="rnc-wizard-actions">
              {current > 0 ? <Button variant="secondary" onClick={() => goTo(current - 1)}>{backLabel}</Button> : null}
              {!isLast && !beforeReview ? (
                <Button onClick={() => goTo(Math.min(current + 1, visible.length - 1))}>{nextLabel}</Button>
              ) : beforeReview ? (
                <Button startIcon="eye" disabled={submitOff && !reviewUnlocked} onClick={() => goTo(current + 1)}>{reviewLabel}</Button>
              ) : isQaPage && Number(briefStatus) === 2 ? (
                <Button startIcon="check-circle" disabled={submitOff} loading={submitting} onClick={() => submit()}>{completeLabel}</Button>
              ) : !isQaPage && !disabledAll ? (
                <Button disabled={submitOff} loading={submitting} onClick={() => submit()}>{submitLabel}</Button>
              ) : null}
            </div>
          </div>
        );
        return (
          <form className={cx('rnc-wizard', v2 && 'is-v2', className)} onSubmit={(e) => e.preventDefault()} noValidate>
            {v2 && toolbar ? toolbar(values) : null}
            {notice ? <div className="rnc-wizard-notice">{notice(values)}</div> : null}
            {v2 ? (
              <div className="rnc-wizard-frame">
                <aside className="rnc-wizard-rail" aria-label={railLabel}>
                  {header ? header(values) : null}
                  {progress}
                  {bar}
                  {aside ? <div className="rnc-wizard-rail-extra">{aside(values)}</div> : null}
                </aside>
                <div className="rnc-wizard-main">{alert}{content}{foot}</div>
              </div>
            ) : (
              <div className="rnc-wizard-card">
                {header ? header(values) : null}
                {progress}
                {bar}
                {alert}
                {content}
                {foot}
              </div>
            )}
            <KeepFieldState form={form as FormApi<any>} />
            {celebrate ? <WizardCelebration open={celebrating} onClose={() => setCelebrating(false)} {...(typeof celebrate === 'object' ? celebrate : {})} /> : null}
            {onSave ? <FormSpy<V> subscription={{ active: true, values: true }} onChange={(st) => onSave({ values: st.values as V, active: st.active as string | undefined })} /> : null}
          </form>
        );
      }}
    />
  );
}

type WizardComponent = typeof WizardRoot & { Page: typeof WizardPage };
/** The setup form wizard. Steps go inside as `<Wizard.Page>`. */
export const Wizard = Object.assign(WizardRoot, { Page: WizardPage }) as WizardComponent;
