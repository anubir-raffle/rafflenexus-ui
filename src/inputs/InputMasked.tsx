import { useEffect, useRef, useState, type ReactNode } from 'react';
import { InputAdornment, TextField } from '@mui/material';
import { copyToClipboard, FieldFrame, useFieldId, type FinalFormInput, type FinalFormMeta } from './shared';

export interface InputMaskedProps {
  /** react-final-form's `input`. Its value is shown and updated with spaces removed. */
  input: FinalFormInput;
  /** Default "Label". */
  label?: ReactNode;
  /** With a `post` suffix, typing stops once the value would reach this length. */
  maxLength?: number;
  /** Shown under the field when there's no error. */
  helperText?: ReactNode;
  /** Accepted for API compatibility. The field shows `meta.error` directly, as the source app does. */
  error?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  meta?: FinalFormMeta;
  /** Prefix, e.g. "$" or "https://". */
  pre?: ReactNode;
  /** Suffix, e.g. "%". */
  post?: ReactNode;
  tooltip?: ReactNode;
  disabled?: boolean;
  /** Review mode: read-only, and clicking copies prefix + value + suffix. */
  disabledAll?: boolean;
}

// The input is only as wide as its value, so a suffix ("%") sits right after it. A hidden span with the same
// font measures the value.
const MEASURE_FONT = '400 16px/22px var(--font-sans)';
// Space between the value and its prefix or suffix, so "https://" and "%" read as separate from the value.
const AFFIX_GAP = 8;

/**
 * A text field with a prefix and/or suffix (money, percentages, URLs), for react-final-form.
 * Takes exactly the props listed; nothing else is passed on.
 */
export function InputMasked({
  input,
  label = null,
  maxLength = 30,
  helperText = null,
  error, // eslint-disable-line @typescript-eslint/no-unused-vars
  meta,
  pre = null,
  post = null,
  tooltip = null,
  disabled = false,
  disabledAll = false,
}: InputMaskedProps) {
  const isDisabled = disabledAll || disabled;
  const measureRef = useRef<HTMLSpanElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputWidth, setInputWidth] = useState('auto');
  const id = useFieldId();

  const measure = (text: string) => {
    if (!measureRef.current) return;
    measureRef.current.textContent = text;
    setInputWidth(`${Math.max(measureRef.current.scrollWidth + 2, 4)}px`);
  };

  const handleAdornmentClick = () => inputRef.current?.focus();

  const handleCopyOnClick = () => {
    if (disabledAll && input?.value) copyToClipboard(`${pre || ''}${input.value}${post || ''}`);
  };

  const handleChange = (value: string) => {
    const inputValue = value.replace(/\s+/g, ''); // no spaces anywhere
    measure(inputValue || ' ');
    input.onChange(inputValue);
  };

  useEffect(() => {
    measure(input?.value || '');
  }, [input?.value, post]);

  return (
    <FieldFrame id={id} label={label || 'Label'} tooltip={tooltip} review={disabledAll} copyable={disabledAll} onCopyClick={handleCopyOnClick}>
      <TextField
        id={id}
        value={input?.value || ''}
        onChange={(e) => {
          if (post && e.target.value.length === maxLength) return;
          handleChange(e.target.value);
        }}
        error={meta && meta.error ? true : false}
        helperText={(meta && meta.error) || helperText}
        variant="outlined"
        fullWidth
        disabled={isDisabled}
        inputRef={inputRef}
        sx={{
          ...(disabledAll ? { pointerEvents: 'none' } : {}),
          // Doubled classes outrank app-wide rules such as `input:disabled { background: #fff }`
          // or `.MuiInputBase-adornedStart { padding-left: 0 }`, so the field looks the same in any app.
          '& .MuiOutlinedInput-root.MuiInputBase-adornedStart.MuiInputBase-adornedStart': { paddingLeft: '14px' },
          '& .MuiOutlinedInput-root.MuiInputBase-adornedEnd.MuiInputBase-adornedEnd': { paddingRight: '14px' },
          '& .MuiOutlinedInput-root .MuiInputBase-input.MuiInputBase-input': {
            width: inputWidth,
            flex: '0 0 auto',
            paddingLeft: pre ? 0 : undefined,
            paddingRight: post ? 0 : undefined,
            background: 'transparent',
            boxShadow: 'none',
          },
          '& .MuiInputAdornment-root.rnc-masked-affix.rnc-masked-affix': {
            height: 'auto', maxHeight: 'none', margin: 0, cursor: 'pointer', whiteSpace: 'nowrap',
            font: '400 16px/22px var(--font-sans)', letterSpacing: 'normal', color: 'var(--ink-muted)',
          },
          '& .MuiInputAdornment-positionStart.rnc-masked-affix.rnc-masked-affix': { marginRight: `${AFFIX_GAP}px` },
          '& .MuiInputAdornment-positionEnd.rnc-masked-affix.rnc-masked-affix': { marginLeft: `${AFFIX_GAP}px` },
        }}
        InputProps={{
          // disableTypography: the prefix and suffix are plain text, not MUI's <p>, so app-wide `p` styles can't reach them.
          startAdornment: pre ? (
            <InputAdornment position="start" disableTypography className="rnc-masked-affix" onClick={handleAdornmentClick}>
              {pre}
            </InputAdornment>
          ) : undefined,
          endAdornment: post ? (
            <InputAdornment position="end" disableTypography className="rnc-masked-affix" onClick={handleAdornmentClick}>
              {post}
            </InputAdornment>
          ) : undefined,
        }}
      />
      <span ref={measureRef} aria-hidden="true"
        style={{ position: 'absolute', visibility: 'hidden', whiteSpace: 'pre', font: MEASURE_FONT, padding: 0, margin: 0, border: 0, pointerEvents: 'none' }} />
    </FieldFrame>
  );
}
