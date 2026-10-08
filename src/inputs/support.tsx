import { Component, type CSSProperties, type ReactNode } from 'react';
import { Field } from 'react-final-form';
import { cx } from '../utils';
import { FieldTip, type FinalFormMeta } from './shared';
import { RncInputsTheme } from './theme';

export interface FinalFormErrorProps {
  meta: FinalFormMeta;
  /** Show the error only once the field has been touched. */
  notTouched?: boolean;
  /** Inline instead of on its own line. */
  inline?: boolean;
}

/** A field's validation message, for fields that don't show their own. Keeps the source app's `error` class. */
export function FinalFormError({ meta, notTouched, inline }: FinalFormErrorProps) {
  const className = cx('error', inline ? 'inline' : 'd-block', 'rnc-field-error');
  if (notTouched) {
    return meta.error && meta.touched ? <span className={className}>{meta.error}</span> : null;
  }
  return meta.error ? <span className={className}>{meta.error}</span> : null;
}

export interface BriefToolTipProps {
  /** The tooltip content, when there are no children. */
  title?: ReactNode;
  /** Rich tooltip content (an example image and a caption, say). Wins over `title`. */
  children?: ReactNode;
  style?: CSSProperties;
}

/** An info button that opens a tooltip; for section headings. (The source file is TooltipBriefForm.jsx.) */
export function BriefToolTip({ title, children, style }: BriefToolTipProps) {
  const tooltipContent = children || title;
  return (
    <RncInputsTheme>
      <span style={{ display: 'inline-block', marginLeft: '4px', verticalAlign: 'middle', ...style }}>
        <FieldTip title={tooltipContent} />
      </span>
    </RncInputsTheme>
  );
}

/** The source app's file name for BriefToolTip. */
export const TooltipBriefForm = BriefToolTip;

export interface DebouncingValidatingFieldProps {
  /** Milliseconds to wait after the last change before validating. Default 500. */
  debounce?: number;
  validate?: (...args: any[]) => any; // eslint-disable-line @typescript-eslint/no-explicit-any
  /** Every other react-final-form `<Field>` prop. */
  [key: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

/**
 * A react-final-form `<Field>` whose validation waits until typing stops (for async checks such as
 * "is this subdomain free?"). Superseded validations resolve as valid.
 */
export class DebouncingValidatingField extends Component<DebouncingValidatingFieldProps> {
  static defaultProps = { debounce: 500 };
  private clearTimeout?: () => void;

  validate = (...args: any[]) => // eslint-disable-line @typescript-eslint/no-explicit-any
    new Promise((resolve) => {
      if (this.clearTimeout) this.clearTimeout();
      const timerId = setTimeout(() => {
        resolve(this.props.validate?.(...args));
      }, this.props.debounce);
      this.clearTimeout = () => {
        clearTimeout(timerId);
        resolve(undefined);
      };
    });

  render() {
    const FieldAny = Field as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    return <FieldAny {...this.props} validate={this.validate} />;
  }
}
