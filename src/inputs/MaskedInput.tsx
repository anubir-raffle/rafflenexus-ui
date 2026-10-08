import type { ReactNode } from 'react';
import { useMask, type MaskOptions } from '@react-input/mask';
import { TextInput } from './TextInput';
import type { FinalFormInput, FinalFormMeta } from './shared';

export interface MaskedInputProps {
  /** Passed to `useMask()`, e.g. `{ mask: '(___) ___-____', placeholder: '(123) 456-7890' }`. */
  maskOptions?: MaskOptions;
  input: FinalFormInput;
  meta?: FinalFormMeta;
  placeholder?: string;
  error?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  tooltip?: ReactNode;
  label?: ReactNode;
  disabledAll?: boolean;
  disabled?: boolean;
}

/**
 * A masked text field (phone numbers and the like) built on `@react-input/mask`, rendered by TextInput.
 * The mask always shows, `_` accepts letters, digits, dots, dashes and underscores, and typing overwrites
 * the mask (so a fixed prefix can't be edited).
 */
export function MaskedInput({
  maskOptions,
  input,
  meta,
  placeholder,
  error,
  tooltip,
  label,
  disabledAll = false,
  disabled = false,
}: MaskedInputProps) {
  const inputRef = useMask({
    ...maskOptions,
    showMask: true,
    replacement: { _: /[a-zA-Z0-9._-]/ },
    // Passed as the source app does. @react-input/mask 2.x has no `overwrite` option, so it has no effect.
    overwrite: true,
  } as MaskOptions);

  return (
    <TextInput
      {...input}
      meta={meta}
      label={label || null}
      ref={inputRef}
      placeholder={placeholder}
      tooltip={tooltip}
      error={error}
      disabled={disabled}
      disabledAll={disabledAll}
    />
  );
}

export default MaskedInput;
