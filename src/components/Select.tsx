import { forwardRef, type ReactNode, type SelectHTMLAttributes } from 'react';
import { FieldLabel, FieldShell, useFieldA11y, useFieldId, type FieldBaseProps } from './Field';
import { cx } from '../utils';

export interface SelectOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}
export interface SelectProps extends FieldBaseProps, Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  /** The choices. Or pass <option> elements as children. */
  options?: SelectOption[];
  /** A first, empty choice such as "Choose a province". */
  placeholder?: string;
  children?: ReactNode;
  className?: string;
  selectClassName?: string;
}

/**
 * A labelled, native select (it works with every keyboard, screen reader and phone picker), styled with a chevron.
 * For actions or links, use Dropdown instead.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, optional, id, options, placeholder, children, className, selectClassName, 'aria-describedby': describedBy, ...rest }, ref,
) {
  const fid = useFieldId(id);
  const { hintId, errorId, aria } = useFieldA11y(fid, hint, error, describedBy);
  return (
    <FieldShell className={className} error={error} hint={hint} hintId={hintId} errorId={errorId} label={<FieldLabel htmlFor={fid} label={label} optional={optional} />}>
      <span className="rnc-select-wrap">
        <select ref={ref} id={fid} className={cx('rnc-select', selectClassName)} {...aria} {...rest}>
          {placeholder != null ? <option value="">{placeholder}</option> : null}
          {options ? options.map((o) => <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>) : children}
        </select>
      </span>
    </FieldShell>
  );
});
