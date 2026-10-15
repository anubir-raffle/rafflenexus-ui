import type { ReactNode } from 'react';
import { TextField } from '@mui/material';
import { copyToClipboard, FieldFrame, useFieldId, withCount, type FinalFormInput } from './shared';

export interface TextAreaProps {
  disabled?: boolean;
  /** Falls back to `input.value`. */
  value?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  label?: ReactNode;
  error?: boolean | any; // eslint-disable-line @typescript-eslint/no-explicit-any
  input?: FinalFormInput;
  /** Called with the new value. Spread `{...input}` to wire it to react-final-form. */
  onChange?: (value: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  /** The most characters allowed. Shows how many are left under the box; `showCount={false}` hides that. */
  maxLength?: number;
  showCount?: boolean;
  /** Review mode: read-only, with a Copy button inside the box (and a click copies), like TextInput. */
  disabledAll?: boolean;
  /** Everything else goes to the underlying MUI TextField (minRows, maxRows, placeholder, helperText…). */
  [key: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

/**
 * The multi-line counterpart to TextInput: grows with its text, from 4 rows.
 * Like the source app's TextArea, it has no `meta`, `tooltip` or `disabledAll` (yet).
 */
export function TextArea({
  disabled = false,
  value,
  label = 'Input Label',
  error = false,
  input,
  maxLength,
  showCount = true,
  disabledAll = false,
  helperText,
  ...rest
}: TextAreaProps) {
  const id = useFieldId(rest.id);
  const current = value ?? input?.value ?? '';
  const counted = !!maxLength && showCount && !disabledAll;
  const copy = () => { if (disabledAll && current) copyToClipboard(String(current)); };
  return (
    <FieldFrame id={id} label={label} review={disabledAll} copyable={disabledAll} onCopyClick={copy}>
      <TextField
        minRows={4}
        {...rest}
        id={id}
        multiline
        fullWidth
        error={Boolean(error)}
        value={current}
        autoComplete="off"
        disabled={disabled || disabledAll}
        helperText={withCount(helperText, `${id}-count`, String(current).length, maxLength, counted)}
        inputProps={{ ...rest.inputProps, ...(maxLength ? { maxLength } : null), ...(counted ? { 'aria-describedby': `${id}-count` } : null) }}
        sx={disabledAll ? { pointerEvents: 'none', ...rest.sx } : rest.sx}
        onChange={(ev) => (rest.onChange ?? input?.onChange)?.(ev.target.value)}
      />
    </FieldFrame>
  );
}

export default TextArea;
