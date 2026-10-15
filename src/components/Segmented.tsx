import { type ReactNode } from 'react';
import { useFieldId } from './Field';
import { cx } from '../utils';

export interface SegmentedOption<T extends string = string> { value: T; label: ReactNode; disabled?: boolean }

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Names the choice for screen readers, e.g. "Address type". Or pass `aria-labelledby`. */
  'aria-label'?: string;
  'aria-labelledby'?: string;
  name?: string;
  disabled?: boolean;
  className?: string;
}

/** Two or three options side by side, one chosen: radio buttons underneath, so arrow keys move between them. */
export function SegmentedControl<T extends string = string>({ options, value, onChange, name, disabled, className, ...aria }: SegmentedControlProps<T>) {
  const group = useFieldId(name);
  return (
    <div className={cx('rnc-segmented', className)} role="radiogroup" {...aria}>
      {options.map((o) => {
        const off = disabled || o.disabled;
        return (
          <label key={o.value} className={cx('rnc-segmented-option', value === o.value && 'is-on', off && 'is-disabled')}>
            <input type="radio" name={group} value={o.value} checked={value === o.value} disabled={off} onChange={() => onChange(o.value)} />
            {o.label}
          </label>
        );
      })}
    </div>
  );
}
