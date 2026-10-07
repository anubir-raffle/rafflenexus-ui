import { cx } from '../utils';

export interface VerifiedBadgeProps {
  /** The regulator, e.g. "IGCO" (BC), "AGLC", "SLGA", "LGCA", "AGCO". */
  regulator: string;
  /** The licence number exactly as issued. */
  licence: string;
  /** Default "Licensed raffle". */
  title?: string;
  /** Adds "· GLI-certified RNG". Default true. Only for draws that use the certified RNG. */
  rng?: boolean;
  /** Use on dark stage bands. */
  onStage?: boolean;
  className?: string;
}

/** Licensed and certified, with the licence number. Green (`verified`) is only for licensed, confirmed and reconciled. */
export function VerifiedBadge({ regulator, licence, title = 'Licensed raffle', rng = true, onStage, className }: VerifiedBadgeProps) {
  return (
    <div className={cx('rnc-badge', className)} role="note">
      <div className="rnc-badge-check">
        <svg width={18} height={18} viewBox="0 0 16 16" aria-hidden="true">
          <path d="M3.5 8.5l3 3 6-7" fill="none" stroke={`var(--${onStage ? 'stage-verified' : 'verified'})`} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div>
        <b>{title}</b>
        <span>{`${regulator} licence #${licence}${rng ? ' · GLI-certified RNG' : ''}`}</span>
      </div>
    </div>
  );
}
