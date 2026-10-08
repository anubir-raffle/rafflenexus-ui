import type { CSSProperties, MouseEventHandler, ReactNode } from 'react';
// Named imports throughout: default imports from MUI subpaths break in CommonJS (Jest).
import { Tooltip } from '@mui/material';
import { toast } from 'react-hot-toast';
import { Icon } from '../components/Icon';
import { useFieldId } from '../components/Field';
import { cx } from '../utils';
import { RncInputsTheme } from './theme';

export { useFieldId };

/** The `input` object react-final-form passes to a `<Field>` render prop. */
export interface FinalFormInput {
  name?: string;
  value?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  onChange: (value: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  onBlur?: (event?: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  onFocus?: (event?: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  [key: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

/** The `meta` object react-final-form passes to a `<Field>` render prop. */
export interface FinalFormMeta {
  error?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  touched?: boolean;
  active?: boolean;
  dirty?: boolean;
  [key: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

function fallbackCopyTextToClipboard(text: string) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.top = '-999999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand('copy');
    toast.success('Copied!');
  } catch (err) {
    console.error('Fallback: Could not copy text: ', err);
    toast.error('Failed to copy');
  }
  document.body.removeChild(textArea);
}

/**
 * Copies text and shows a "Copied!" toast (react-hot-toast; the app renders the `<Toaster />`).
 * Uses the Clipboard API, and `document.execCommand('copy')` where that isn't available or fails.
 */
export function copyToClipboard(text: string): void {
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Copied!');
    }).catch((err) => {
      console.error('Failed to copy:', err);
      fallbackCopyTextToClipboard(text);
    });
  } else {
    fallbackCopyTextToClipboard(text);
  }
}

/** The info button beside a label. Hover, focus or tap it to open the tooltip (text, or rich content such as an example image). */
export function FieldTip({ title, label, style, className }: { title: ReactNode; label?: ReactNode; style?: CSSProperties; className?: string }) {
  return (
    <Tooltip title={title} arrow describeChild enterTouchDelay={0} leaveTouchDelay={6000}>
      <button type="button" className={cx('rnc-field-tip', className)} style={style}
        aria-label={typeof label === 'string' && label ? `About ${label}` : 'More information'}>
        <Icon name="info" size={18} />
      </button>
    </Tooltip>
  );
}

export interface FieldFrameProps {
  id: string;
  label?: ReactNode;
  /** Keep the label for screen readers but don't show it (DatePicker `small`). */
  hideLabel?: boolean;
  tooltip?: ReactNode;
  /** Review mode (`disabledAll`): read-only, and a click copies the value. */
  review?: boolean;
  /** The pointer shows the copy cursor (review mode, or DatePicker's disabled-and-copyable state). */
  copyable?: boolean;
  onCopyClick?: MouseEventHandler<HTMLDivElement>;
  className?: string;
  children: ReactNode;
}

/** Label row (with the optional info button), then the MUI control, all in the design system's theme. */
export function FieldFrame({ id, label, hideLabel, tooltip, review, copyable, onCopyClick, className, children }: FieldFrameProps) {
  const hasLabel = label != null && label !== '' && label !== false;
  return (
    <RncInputsTheme>
      <div className={cx('rnc-field', 'rnc-mui-field', review ? 'is-review' : null, className)}>
        {(hasLabel && !hideLabel) || tooltip ? (
          <div className="rnc-field-labelrow">
            {hasLabel && !hideLabel ? <label className="rnc-field-label" htmlFor={id}>{label}</label> : null}
            {tooltip ? <FieldTip title={tooltip} label={label} /> : null}
          </div>
        ) : null}
        <div onClick={onCopyClick} style={{ width: '100%', cursor: copyable ? 'copy' : 'default' }}>
          {children}
        </div>
      </div>
    </RncInputsTheme>
  );
}

/** The message under a field: the helper text when given, otherwise the error once the field has been touched. */
export function helperFor(helperText: ReactNode, meta?: FinalFormMeta | null): ReactNode {
  return helperText ? helperText : (meta && meta.touched && meta.error ? meta.error : false);
}
