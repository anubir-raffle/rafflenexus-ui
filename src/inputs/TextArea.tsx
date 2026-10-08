import type { ReactNode } from 'react';
import { TextField } from '@mui/material';
import { FieldFrame, useFieldId, type FinalFormInput } from './shared';

export interface TextAreaProps {
  disabled?: boolean;
  /** Falls back to `input.value`. */
  value?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  label?: ReactNode;
  error?: boolean | any; // eslint-disable-line @typescript-eslint/no-explicit-any
  input?: FinalFormInput;
  /** Called with the new value. Spread `{...input}` to wire it to react-final-form. */
  onChange?: (value: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
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
  ...rest
}: TextAreaProps) {
  const id = useFieldId(rest.id);
  return (
    <FieldFrame id={id} label={label}>
      <TextField
        minRows={4}
        {...rest}
        id={id}
        multiline
        fullWidth
        error={Boolean(error)}
        value={value ?? input?.value ?? ''}
        autoComplete="off"
        disabled={disabled}
        onChange={(ev) => (rest.onChange ?? input?.onChange)?.(ev.target.value)}
      />
    </FieldFrame>
  );
}

export default TextArea;
