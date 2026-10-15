import { type FocusEventHandler, type ReactNode } from 'react';
import { CharCount, CopyButton, FieldLabel, FieldShell, useFieldA11y, useFieldId, type FieldBaseProps } from './Field';
import { SegmentedControl } from './Segmented';
import { cx } from '../utils';

/** `rn`: an address on the Raffle Nexus domain (name.rafflenexus.com). `own`: the client's own domain. Matches the app's sub_domain_type. */
export type DomainType = 'rn' | 'own';

export interface DomainFieldProps extends FieldBaseProps {
  type: DomainType;
  onTypeChange: (type: DomainType) => void;
  /** The name (rn) or the whole domain (own), without https://. */
  value: string;
  onChange: (value: string) => void;
  onBlur?: FocusEventHandler<HTMLInputElement>;
  /** Default ".rafflenexus.com". */
  suffix?: string;
  /** Hints for each choice, if they must differ. Off by default: one hint (`hint`, or the default) stays put when the choice changes. */
  rnHint?: ReactNode;
  ownHint?: ReactNode;
  rnLabel?: ReactNode;
  ownLabel?: ReactNode;
  /** The most characters allowed. Defaults: 63 for a Raffle Nexus name (the longest a web address name can be), 253 for a whole domain. */
  maxLength?: number;
  /** Show how many characters are left under the field. Default true. */
  showCount?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
}

const DEFAULT_HINT = 'Use letters, numbers, hyphens and underscores, or a domain you own, like lottery.example.org. For your own domain, we send you the steps to point it at your raffle site.';

/** The full address a DomainField's value points to, e.g. "https://samplehospital.rafflenexus.com". */
export function domainUrl(type: DomainType, value: string, suffix = '.rafflenexus.com'): string {
  if (!value) return '';
  return `https://${type === 'rn' ? `${value}${suffix}` : value}`;
}

/** Strips what people paste around the part we need: https://, www., a path, and (rn) the Raffle Nexus domain. */
function tidy(raw: string, type: DomainType, suffix: string): string {
  let v = raw.trim().replace(/^[a-z]+:\/\//i, '').replace(/\/.*$/, '');
  if (type === 'own') return v.replace(/^www\./i, '').toLowerCase();
  if (v.toLowerCase().endsWith(suffix.toLowerCase())) v = v.slice(0, -suffix.length);
  return v.replace(/\s+/g, '-').toLowerCase();
}

/**
 * The raffle site's web address: an address on rafflenexus.com, or the client's own domain. A segmented choice switches
 * between them; the field shows https:// and the Raffle Nexus domain around the name. When the field is narrow the
 * https:// drops away. `review` makes it read-only with a Copy button (copies the full address).
 */
export function DomainField({
  label, hint, error, optional, review, type, onTypeChange, value, onChange, onBlur, suffix = '.rafflenexus.com',
  rnHint, ownHint,
  rnLabel = 'Raffle Nexus address', ownLabel = 'Your own domain', maxLength, showCount = true, disabled, id, className,
}: DomainFieldProps) {
  const fid = useFieldId(id);
  const shownHint = hint ?? (type === 'rn' ? rnHint : ownHint) ?? DEFAULT_HINT;
  const limit = maxLength ?? (type === 'rn' ? 63 : 253);
  const counted = showCount && !review;
  const { hintId, errorId, aria } = useFieldA11y(fid, shownHint, error, `${fid}-full`, counted ? `${fid}-count` : undefined);
  const locked = disabled || review;
  return (
    <FieldShell className={cx('rnc-domain', className)} error={error} hint={shownHint} hintId={hintId} errorId={errorId} review={review}
      label={<FieldLabel htmlFor={fid} label={label} optional={optional} />}
      count={counted ? <CharCount id={`${fid}-count`} length={value.length} max={limit} /> : null}>
      {!review ? (
        <SegmentedControl<DomainType> aria-label={typeof label === 'string' ? `${label}: type` : 'Address type'} value={type} disabled={locked}
          onChange={onTypeChange} options={[{ value: 'rn', label: rnLabel }, { value: 'own', label: ownLabel }]} />
      ) : null}
      <div className="rnc-affix">
        <span className="rnc-domain-scheme" aria-hidden="true">https://</span>
        <input
          id={fid} className="rnc-input" {...aria} value={value} disabled={disabled} readOnly={review}
          inputMode="url" autoCapitalize="none" autoCorrect="off" spellCheck={false} autoComplete="off"
          maxLength={limit} placeholder={type === 'rn' ? 'your-raffle' : 'lottery.example.org'}
          onChange={(e) => onChange(tidy(e.target.value, type, suffix).slice(0, limit))} onBlur={onBlur}
        />
        {type === 'rn' ? <span aria-hidden="true">{suffix}</span> : null}
        {review ? <CopyButton label={label} value={() => domainUrl(type, value, suffix)} /> : null}
      </div>
      <span className="rnc-sr-only" id={`${fid}-full`}>{value ? `Full address: ${domainUrl(type, value, suffix)}` : ''}</span>
    </FieldShell>
  );
}
