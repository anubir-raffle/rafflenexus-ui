import type { ElementType, ReactNode } from 'react';
import { Icon } from '../components/Icon';
import { MARK_NAVY } from '../generated/marks';
import { cx } from '../utils';

export interface WizardHeaderProps {
  /** The raffle's name. */
  title: ReactNode;
  /** The organization, under the name. */
  subtitle?: ReactNode;
  /** The client's logo: an image URL or your own element. Shown beside the Raffle Nexus mark. */
  logo?: string | ReactNode;
  logoAlt?: string;
  /** Default: the Raffle Nexus ticket mark. Pass null to leave it out. */
  mark?: string | null;
  markAlt?: string;
  /** The title's element. Default h2. */
  as?: ElementType;
}

/** Top of the wizard card: the raffle's name and organization, the client's logo beside the Raffle Nexus mark. */
export function WizardHeader({ title, subtitle, logo, logoAlt = '', mark = MARK_NAVY, markAlt = 'Raffle Nexus', as: Title = 'h2' }: WizardHeaderProps) {
  return (
    <div className="rnc-wizard-head">
      <div className="rnc-wizard-titles">
        <Title className="rnc-wizard-title">{title}</Title>
        {subtitle ? <p className="rnc-wizard-subtitle">{subtitle}</p> : null}
      </div>
      {logo || mark ? (
        <div className="rnc-wizard-logos">
          {typeof logo === 'string' ? <img src={logo} alt={logoAlt} /> : logo}
          {mark ? <img src={mark} alt={markAlt} /> : null}
        </div>
      ) : null}
    </div>
  );
}

export interface WizardDeadlineProps {
  /** The deadline as it should read, e.g. "October 20, 2026". */
  date: ReactNode;
  /** Past the deadline: "Past due" in red, with `overdueMessage` under it. */
  overdue?: boolean;
  overdueMessage?: ReactNode;
  label?: ReactNode;
  overdueLabel?: ReactNode;
}

/** "Deadline to submit: October 20, 2026", or Past due with what it means in words. Pass it as the Wizard's `notice`. */
export function WizardDeadline({
  date, overdue, label = 'Deadline to submit:',
  overdueLabel = 'Past due',
  overdueMessage = 'Your raffle launch is at risk of delay. Complete the setup form now and contact your account manager.',
}: WizardDeadlineProps) {
  return (
    <>
      <span className={cx('rnc-wizard-deadline', overdue && 'is-overdue')}>
        <Icon name={overdue ? 'warning' : 'clock'} size={20} />{label} <strong>{overdue ? overdueLabel : date}</strong>
      </span>
      {overdue && overdueMessage ? <p className="rnc-wizard-overdue">{overdueMessage}</p> : null}
    </>
  );
}

export interface WizardSectionProps {
  title: ReactNode;
  /** An info button beside the title, e.g. `<BriefToolTip>…</BriefToolTip>` from /inputs. */
  tooltip?: ReactNode;
  /** The explainer line under the title ("All dates are in Pacific time"). */
  description?: ReactNode;
  /** `lg` (default, the app's h5), `md` (sub-1), `sm` (sub-2). */
  size?: 'lg' | 'md' | 'sm';
  /** The title's element. Default h3. */
  as?: ElementType;
  className?: string;
  children?: ReactNode;
}

/** A section inside a step: a heading (with an optional info button), an explainer line, then the fields. */
export function WizardSection({ title, tooltip, description, size = 'lg', as: Title = 'h3', className, children }: WizardSectionProps) {
  return (
    <section className={cx('rnc-wizard-section', size !== 'lg' && `is-${size}`, className)}>
      <div className="rnc-wizard-section-top">
        <div className="rnc-wizard-section-head">
          <Title className="rnc-wizard-section-title">{title}</Title>
          {tooltip}
        </div>
        {description ? <p className="rnc-wizard-section-desc">{description}</p> : null}
      </div>
      {children != null ? <div className="rnc-wizard-section-body">{children}</div> : null}
    </section>
  );
}

export interface WizardToolbarProps {
  /** The product's name. Default "Raffle Builder". */
  product?: ReactNode;
  /** The product's mark. Default: the Raffle Nexus ticket mark. Pass null to leave it out. */
  mark?: string | null;
  /** Where the back arrow goes: a URL, or a function (a button). */
  back?: string | (() => void);
  backLabel?: string;
  /** The breadcrumb, e.g. <>Raffles / <b>Sample Lottery</b></>. */
  crumb?: ReactNode;
  /** On the right: the status, e.g. <StatusPill tone="review">Ready for QA</StatusPill>. */
  status?: ReactNode;
  /** On the right, after the status: the form's actions (Download images, Lock editing, Mark form complete). */
  actions?: ReactNode;
}

/** The V2 top bar: back, the product, a breadcrumb, then the status and the form's actions. Pass it as the Wizard's `toolbar`. */
export function WizardToolbar({ product = 'Raffle Builder', mark = MARK_NAVY, back, backLabel = 'Back to your raffles', crumb, status, actions }: WizardToolbarProps) {
  const arrow = <Icon name="caret-left" size={20} />;
  return (
    <header className="rnc-wizard-topbar">
      {typeof back === 'string' ? <a className="rnc-wizard-back" href={back} aria-label={backLabel}>{arrow}</a>
        : back ? <button type="button" className="rnc-wizard-back" aria-label={backLabel} onClick={back}>{arrow}</button> : null}
      <span className="rnc-wizard-product">{mark ? <img src={mark} alt="" /> : null}{product}</span>
      {crumb ? <span className="rnc-wizard-crumb">{crumb}</span> : null}
      <span className="rnc-wizard-grow" />
      {status || actions ? <div className="rnc-wizard-tools">{status}{actions}</div> : null}
    </header>
  );
}

export {
  WizardPreview, WizardSitePreview, usePreviewDevice,
  type WizardPreviewProps, type WizardSitePreviewProps, type PreviewDevice, type WizardSitePack, type WizardSiteDate, type WizardSitePrize, type WizardCauseMedia, type WizardSiteSponsor, type WizardSiteSocial,
} from './preview';

export interface WizardReviewSection {
  label: ReactNode;
  /** The step to go back to (its index among the visible steps; pass it to `changePage`). */
  step: number;
  complete: boolean;
  /** What the section says, in a line or two. */
  summary?: ReactNode;
  /** What's still missing, in words. */
  issues?: ReactNode[];
}

/** The Review step: one card per section with what it says and what's missing, and an Edit link back to its step. */
export function WizardReview({ sections, onEdit, editLabel = 'Edit' }: { sections: WizardReviewSection[]; onEdit: (step: number) => void; editLabel?: string }) {
  return (
    <div className="rnc-review">
      {sections.map((s, i) => (
        <section key={i} className={cx('rnc-review-card', !s.complete && 'is-incomplete')}>
          <div className="rnc-review-head">
            <h3 className="rnc-review-title">
              <span className="rnc-review-dot" aria-hidden="true"><Icon name={s.complete ? 'check' : 'x'} size={14} /></span>
              {s.label}<span className="rnc-sr-only">{s.complete ? ', complete' : ', not complete'}</span>
            </h3>
            <button type="button" className="rnc-btn rnc-btn-link" aria-label={typeof s.label === 'string' ? `${editLabel} ${s.label}` : undefined} onClick={() => onEdit(s.step)}>{editLabel}</button>
          </div>
          {s.summary ? <p className="rnc-review-body">{s.summary}</p> : null}
          {s.issues?.length ? <ul className="rnc-review-issues">{s.issues.map((t, j) => <li key={j}><Icon name="x-circle" size={16} />{t}</li>)}</ul> : null}
        </section>
      ))}
    </div>
  );
}
