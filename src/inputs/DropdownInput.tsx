import type { ReactNode } from 'react';
import { Autocomplete, TextField } from '@mui/material';
import { copyToClipboard, FieldFrame, useFieldId, type FinalFormInput, type FinalFormMeta } from './shared';

export interface DropdownOption {
  label: string;
  value: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  [key: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export interface DropdownInputProps {
  disabled?: boolean;
  /** Review mode: read-only, and clicking the field copies the chosen option's label (or its value). */
  disabledAll?: boolean;
  /** The chosen option's `value`. */
  value?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  /** react-final-form's `input`. A choice calls `input.onChange(option.value)`, or `null` when cleared. */
  input?: FinalFormInput;
  options?: DropdownOption[];
  meta?: FinalFormMeta;
  label?: ReactNode;
  /** Marks the field invalid (usually `meta.error && meta.touched`). */
  error?: boolean | any; // eslint-disable-line @typescript-eslint/no-explicit-any
  /** Shown under the field. TextInput passes the error here once the field is touched. */
  helperText?: ReactNode;
  /** Info button beside the label. TextInput passes its `tooltip` here. */
  tooltip?: ReactNode;
  /** Anything else goes to MUI's Autocomplete. An `onChange` here replaces the final-form handler (event, option). */
  [key: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

/**
 * A searchable select (MUI Autocomplete) for react-final-form. Options are `{ label, value }`; the form value is the
 * option's `value`. Reached through `<TextInput type="dropdown">`, or used on its own.
 */
export function DropdownInput({
  disabled = false,
  disabledAll = false,
  value,
  input,
  options = [],
  meta,
  label = 'Input Label',
  error = false,
  helperText,
  tooltip,
  ...rest
}: DropdownInputProps) {
  const isDisabled = disabledAll || disabled;
  const selectedOption = options.find((option) => option.value === value) || null;
  const copyValue = selectedOption?.label || selectedOption?.value || value || '';
  const id = useFieldId(rest.id);
  const invalid = Boolean(error || (meta && meta.error && meta.touched));

  const handleCopyOnClick = () => {
    if (!disabledAll || !copyValue) return;
    copyToClipboard(String(copyValue));
  };

  return (
    <FieldFrame id={id} label={label} tooltip={tooltip} review={disabledAll} copyable={disabledAll} onCopyClick={handleCopyOnClick}>
      <Autocomplete
        disablePortal
        // The source app passes autoComplete="off", which MUI reads as true (inline completion). Kept as shipped.
        autoComplete
        onChange={(_event, newValue: DropdownOption | null) => {
          if (input) input.onChange(newValue?.value ?? null);
        }}
        {...rest}
        id={id}
        disabled={isDisabled}
        options={options}
        value={selectedOption}
        renderInput={(params) => (
          <TextField
            {...params}
            error={invalid}
            helperText={helperText || undefined}
            disabled={isDisabled}
            fullWidth
            autoComplete="new-password"
            sx={disabledAll ? { pointerEvents: 'none' } : {}}
            inputProps={{
              ...params.inputProps,
              autoComplete: 'new-password', // stop the browser offering saved values
            }}
          />
        )}
      />
    </FieldFrame>
  );
}

export default DropdownInput;
