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
      <div className="rnc-wizard-section-head">
        <Title className="rnc-wizard-section-title">{title}</Title>
        {tooltip}
      </div>
      {description ? <p className="rnc-wizard-section-desc">{description}</p> : null}
      {children != null ? <div className="rnc-wizard-section-body">{children}</div> : null}
    </section>
  );
}
