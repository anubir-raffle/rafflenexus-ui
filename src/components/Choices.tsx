import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react';
import { useFieldId } from './Field';
import { cx } from '../utils';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'children'> {
  /** The visible label, to the right of the box. */
  label: ReactNode;
  /** A second line under the label. */
  hint?: ReactNode;
  /** What to fix. Shown under the checkbox and marks it invalid. */
  error?: ReactNode;
}

/** A 24px checkbox with its label to the right. */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox({ label, hint, error, id, className, ...rest }, ref) {
  const fid = useFieldId(id);
  const errorId = error ? `${fid}-error` : undefined;
  return (
    <div className={cx('rnc-field', error ? 'is-invalid' : null, className)}>
      <label className="rnc-check" htmlFor={fid}>
        <input ref={ref} id={fid} type="checkbox" aria-invalid={error ? true : undefined} aria-describedby={errorId} {...rest} />
        <span>{label}{hint ? <small>{hint}</small> : null}</span>
      </label>
      {error ? <p className="rnc-field-error" id={errorId}>{error}</p> : null}
    </div>
  );
});

export interface RadioOption {
  value: string;
  label: ReactNode;
  hint?: ReactNode;
  disabled?: boolean;
}
export interface RadioGroupProps {
  /** The question, shown as the fieldset's legend. */
  legend: ReactNode;
  /** The input name shared by the radios. */
  name: string;
  options: RadioOption[];
  /** Controlled value. */
  value?: string;
  /** Uncontrolled starting value. */
  defaultValue?: string;
  onChange?: (value: string) => void;
  hint?: ReactNode;
  error?: ReactNode;
  optional?: boolean;
  required?: boolean;
  id?: string;
  className?: string;
}

/** A set of 24px radio buttons in a fieldset with a legend. */
export function RadioGroup({ legend, name, options, value, defaultValue, onChange, hint, error, optional, required, id, className }: RadioGroupProps) {
  const fid = useFieldId(id);
  const hintId = hint ? `${fid}-hint` : undefined;
  const errorId = error ? `${fid}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  return (
    <fieldset className={cx('rnc-fieldset', error ? 'is-invalid' : null, className)} id={fid} aria-describedby={describedBy}>
      <legend className="rnc-legend">{legend}{optional ? <em> (optional)</em> : null}</legend>
      {hint ? <p className="rnc-field-hint" id={hintId}>{hint}</p> : null}
      {options.map((o, i) => (
        <label className="rnc-check" key={o.value} htmlFor={`${fid}-${i}`}>
          <input
            id={`${fid}-${i}`} type="radio" name={name} value={o.value} disabled={o.disabled} required={required}
            {...(value !== undefined ? { checked: value === o.value } : { defaultChecked: defaultValue === o.value })}
            onChange={(e) => { if (e.target.checked) onChange?.(o.value); }}
          />
          <span>{o.label}{o.hint ? <small>{o.hint}</small> : null}</span>
        </label>
      ))}
      {error ? <p className="rnc-field-error" id={errorId}>{error}</p> : null}
    </fieldset>
  );
}

export interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'children' | 'role'> {
  /** The visible label. */
  label: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/**
 * An on/off switch for settings that apply straight away ("Show the live jackpot on the site").
 * In a form that's submitted, use a Checkbox instead.
 */
export function Switch({ label, checked, onChange, className, disabled, onClick, ...rest }: SwitchProps) {
  return (
    <button
      type="button" role="switch" aria-checked={checked} disabled={disabled} className={cx('rnc-switch', className)}
      onClick={(e) => { onClick?.(e); if (!e.defaultPrevented) onChange(!checked); }} {...rest}
    >
      <span className="rnc-switch-track" aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}
