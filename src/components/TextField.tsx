import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { FieldLabel, FieldShell, useFieldA11y, useFieldId, type FieldBaseProps } from './Field';
import { cx } from '../utils';

export interface TextFieldProps extends FieldBaseProps, Omit<InputHTMLAttributes<HTMLInputElement>, 'children'> {
  /** Class for the field wrapper (the input itself takes `inputClassName`). */
  className?: string;
  inputClassName?: string;
}

/**
 * A labelled text input with an optional hint and error. Use the right `type` and `autocomplete`
 * (email, tel, name…). Placeholders show an example, never the label.
 */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, hint, error, optional, id, className, inputClassName, type = 'text', 'aria-describedby': describedBy, ...rest }, ref,
) {
  const fid = useFieldId(id);
  const { hintId, errorId, aria } = useFieldA11y(fid, hint, error, describedBy);
  return (
    <FieldShell className={className} error={error} hint={hint} hintId={hintId} errorId={errorId} label={<FieldLabel htmlFor={fid} label={label} optional={optional} />}>
      <input ref={ref} id={fid} type={type} className={cx('rnc-input', inputClassName)} {...aria} {...rest} />
    </FieldShell>
  );
});

export interface TextAreaProps extends FieldBaseProps, Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'children'> {
  className?: string;
  inputClassName?: string;
}

/** A labelled multi-line text box with an optional hint and error. */
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, hint, error, optional, id, className, inputClassName, 'aria-describedby': describedBy, ...rest }, ref,
) {
  const fid = useFieldId(id);
  const { hintId, errorId, aria } = useFieldA11y(fid, hint, error, describedBy);
  return (
    <FieldShell className={className} error={error} hint={hint} hintId={hintId} errorId={errorId} label={<FieldLabel htmlFor={fid} label={label} optional={optional} />}>
      <textarea ref={ref} id={fid} className={cx('rnc-textarea', inputClassName)} {...aria} {...rest} />
    </FieldShell>
  );
});
