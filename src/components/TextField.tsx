import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { CharCount, CopyButton, FieldLabel, FieldShell, useCharCount, useFieldA11y, useFieldId, type FieldBaseProps } from './Field';
import { cx } from '../utils';

interface CountProps {
  /** The most characters allowed. Shows how many are left under the field (turn that off with `showCount={false}`). */
  maxLength?: number;
  showCount?: boolean;
}

export interface TextFieldProps extends FieldBaseProps, CountProps, Omit<InputHTMLAttributes<HTMLInputElement>, 'children'> {
  /** Class for the field wrapper (the input itself takes `inputClassName`). */
  className?: string;
  inputClassName?: string;
}

/**
 * A labelled text input with an optional hint and error. Use the right `type` and `autocomplete`
 * (email, tel, name…). Placeholders show an example, never the label. With `maxLength` it counts the characters left;
 * with `review` it's read-only with a Copy button inside.
 */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, hint, error, optional, review, id, className, inputClassName, type = 'text', maxLength, showCount = true, value, defaultValue, onChange, readOnly, 'aria-describedby': describedBy, ...rest }, ref,
) {
  const fid = useFieldId(id);
  const { length, track } = useCharCount(value, defaultValue);
  const counted = !!maxLength && showCount && !review;
  const countId = counted ? `${fid}-count` : undefined;
  const { hintId, errorId, aria } = useFieldA11y(fid, hint, error, describedBy, countId);
  const input = (
    <input ref={ref} id={fid} type={type} className={cx('rnc-input', inputClassName)} {...aria} {...rest} maxLength={maxLength}
      value={value} defaultValue={defaultValue} readOnly={review || readOnly}
      onChange={(e) => { track(e.target.value); onChange?.(e); }} />
  );
  return (
    <FieldShell className={className} error={error} hint={hint} hintId={hintId} errorId={errorId} review={review}
      label={<FieldLabel htmlFor={fid} label={label} optional={optional} />}
      count={counted ? <CharCount id={countId!} length={length} max={maxLength!} /> : null}>
      {review ? <div className="rnc-affix">{input}<CopyButton label={label} value={() => String(value ?? (document.getElementById(fid) as HTMLInputElement | null)?.value ?? '')} /></div> : input}
    </FieldShell>
  );
});

export interface TextAreaProps extends FieldBaseProps, CountProps, Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'children'> {
  className?: string;
  inputClassName?: string;
}

/** A labelled multi-line text box with an optional hint and error, a count with `maxLength`, and Copy in `review`. */
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, hint, error, optional, review, id, className, inputClassName, maxLength, showCount = true, value, defaultValue, onChange, readOnly, 'aria-describedby': describedBy, ...rest }, ref,
) {
  const fid = useFieldId(id);
  const { length, track } = useCharCount(value, defaultValue);
  const counted = !!maxLength && showCount && !review;
  const countId = counted ? `${fid}-count` : undefined;
  const { hintId, errorId, aria } = useFieldA11y(fid, hint, error, describedBy, countId);
  const area = (
    <textarea ref={ref} id={fid} className={cx('rnc-textarea', inputClassName)} {...aria} {...rest} maxLength={maxLength}
      value={value} defaultValue={defaultValue} readOnly={review || readOnly}
      onChange={(e) => { track(e.target.value); onChange?.(e); }} />
  );
  return (
    <FieldShell className={className} error={error} hint={hint} hintId={hintId} errorId={errorId} review={review}
      label={<FieldLabel htmlFor={fid} label={label} optional={optional} />}
      count={counted ? <CharCount id={countId!} length={length} max={maxLength!} /> : null}>
      {review ? <div className="rnc-copywrap">{area}<CopyButton label={label} value={() => String(value ?? (document.getElementById(fid) as HTMLTextAreaElement | null)?.value ?? '')} /></div> : area}
    </FieldShell>
  );
});
