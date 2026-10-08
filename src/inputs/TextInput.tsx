import { forwardRef, useState, type ReactNode, type WheelEvent } from 'react';
import { IconButton, InputAdornment, TextField } from '@mui/material';
import { Icon } from '../components/Icon';
import { DropdownInput, type DropdownOption } from './DropdownInput';
import { copyToClipboard, FieldFrame, helperFor, useFieldId, type FinalFormInput, type FinalFormMeta } from './shared';

export interface TextInputProps {
  /** An ordinary disabled field. */
  disabled?: boolean;
  /** Review mode: the value is locked, and clicking the field copies it and shows a "Copied!" toast. */
  disabledAll?: boolean;
  /** Falls back to `input.value`, then "". */
  value?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  label?: ReactNode;
  /** Marks the field invalid; usually `meta.error && meta.touched`. */
  error?: boolean | any; // eslint-disable-line @typescript-eslint/no-explicit-any
  type?: 'text' | 'password' | 'number' | 'dropdown';
  /** Shown under the field. Without it, the error shows there once the field is touched. */
  helperText?: ReactNode;
  /** react-final-form's `input`. Required for `type="dropdown"`. */
  input?: FinalFormInput;
  /** Number fields: the value is passed on as `parseFloat(value).toFixed(decimal)`. */
  decimal?: number | null;
  min?: number | string | null;
  max?: number | string | null;
  /** Dropdown fields: `[{ label, value }]`. */
  options?: DropdownOption[];
  meta?: FinalFormMeta;
  /** Info button beside the label; its tooltip shows this (text or rich content). */
  tooltip?: ReactNode;
  placeholder?: string;
  /** Password fields: a show/hide button at the end of the field. */
  showPasswordToggle?: boolean;
  /** Called with the new value (not the event). Spread `{...input}` to wire it to react-final-form. */
  onChange?: (value: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  /** Everything else goes to the underlying MUI TextField (or Autocomplete for dropdowns). */
  [key: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

/**
 * The hub input for react-final-form: text, password, number, or a searchable dropdown (`type="dropdown"`,
 * rendered by DropdownInput). Spread the Field's `input` onto it and pass `meta`:
 * `<TextInput {...input} meta={meta} label="Support email" error={meta.error && meta.touched} />`.
 */
export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput({
  disabled = false,
  disabledAll = false,
  value,
  label = 'Input Label',
  error = false,
  type = 'text',
  helperText = null,
  input,
  decimal = null,
  min = null,
  max = null,
  options = [],
  meta,
  tooltip = null,
  placeholder = '',
  showPasswordToggle = false,
  ...rest
}, ref) {
  const [showPassword, setShowPassword] = useState(false);
  const isDisabled = disabledAll || disabled;
  const currentValue = value ?? input?.value ?? '';
  const id = useFieldId(rest.id);
  const helper = helperFor(helperText, meta);
  // Call sites spread react-final-form's `input`, so onChange arrives in rest. Fall back to input.onChange.
  const emit = (v: unknown) => (rest.onChange ?? input?.onChange)?.(v);

  const handleCopyOnClick = () => {
    if (disabledAll && currentValue) copyToClipboard(String(currentValue));
  };

  if (type === 'dropdown') {
    return (
      <DropdownInput
        {...rest}
        error={error}
        label={label}
        input={input}
        meta={meta}
        helperText={helper}
        value={currentValue}
        options={options}
        disabled={isDisabled}
        disabledAll={disabledAll}
        tooltip={tooltip}
        onChange={(_event: unknown, newValue: DropdownOption | null) => {
          input?.onChange(newValue?.value ?? null);
        }}
        className={tooltip ? 'has-tooltip' : ''}
      />
    );
  }

  const frame = { id, label, tooltip, review: disabledAll, copyable: disabledAll, onCopyClick: handleCopyOnClick };

  if (type === 'number') {
    return (
      <FieldFrame {...frame}>
        <TextField
          {...rest}
          id={id}
          error={Boolean(error)}
          fullWidth
          type="number"
          helperText={helper}
          value={currentValue}
          autoComplete="false"
          disabled={isDisabled}
          placeholder={placeholder}
          inputRef={ref}
          onChange={(ev) => {
            if (decimal) {
              emit(parseFloat(ev.target.value).toFixed(decimal));
              return;
            }
            emit(ev.target.value);
          }}
          sx={disabledAll ? { pointerEvents: 'none' } : {}}
          InputProps={{
            inputProps: {
              min,
              max,
              step: '1',
              // Scrolling over a focused number field would change it: leave the field instead.
              onWheel: (e: WheelEvent<HTMLInputElement>) => e.currentTarget.blur(),
            },
          }}
        />
      </FieldFrame>
    );
  }

  const passwordToggle = type === 'password' && showPasswordToggle;
  return (
    <FieldFrame {...frame}>
      <TextField
        {...rest}
        id={id}
        error={Boolean(error)}
        fullWidth
        type={passwordToggle ? (showPassword ? 'text' : 'password') : type}
        helperText={helper}
        value={currentValue}
        autoComplete="false"
        disabled={isDisabled}
        onChange={(ev) => emit(ev.target.value)}
        placeholder={placeholder}
        sx={disabledAll ? { pointerEvents: 'none' } : {}}
        InputProps={{
          inputRef: ref,
          ...rest.InputProps,
          ...(passwordToggle && {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((show) => !show)}
                  onMouseDown={(event) => event.preventDefault()}
                  edge="end"
                >
                  <Icon name={showPassword ? 'eye-slash' : 'eye'} size={22} />
                </IconButton>
              </InputAdornment>
            ),
          }),
        }}
      />
    </FieldFrame>
  );
});

export default TextInput;
