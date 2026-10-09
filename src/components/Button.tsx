import {
  forwardRef, useEffect, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type CSSProperties, type ElementType,
  type MouseEvent, type ReactNode,
} from 'react';
import { Icon } from './Icon';
import { ICONS, type IconName } from '../generated/icons';
import { cx } from '../utils';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'link' | 'danger' | 'danger-ghost' | 'stage' | 'stage-ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonOwnProps {
  /** The button's job. `primary` (default) for the main action; `danger` only for a destructive confirm. */
  variant?: ButtonVariant;
  /** `sm` 36px, `md` 48px (default), `lg` 56px. */
  size?: ButtonSize;
  /** Default "button", so it never submits a form by accident. */
  type?: 'button' | 'submit' | 'reset';
  /** Shows a spinner, ignores clicks and keeps focus. The width doesn't change. */
  loading?: boolean;
  /** The label while loading, e.g. "Saving…". Default: the normal label. */
  loadingText?: ReactNode;
  /** A design-system icon name ("plus", "upload-simple"…) or your own icon element. */
  startIcon?: ReactNode | IconName;
  endIcon?: ReactNode | IconName;
  /** Only the icon shows. Needs an `aria-label`. */
  iconOnly?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
  /** Renders a link (an <a>, or `as`). */
  href?: string;
  target?: string;
  rel?: string;
  /** Render with another component, e.g. React Router's Link. It receives href and to, className, children and aria-*. */
  as?: ElementType;
  /** For `as` components that take `to` (React Router). Defaults to `href`. */
  to?: unknown;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}
type NativeProps = Omit<ButtonHTMLAttributes<HTMLElement>, keyof ButtonOwnProps> & Omit<AnchorHTMLAttributes<HTMLElement>, keyof ButtonOwnProps | keyof ButtonHTMLAttributes<HTMLElement>>;
export type ButtonProps = ButtonOwnProps & NativeProps & { [data: `data-${string}`]: unknown };

declare const process: { env: { NODE_ENV?: string } };
// Written out in full so the app's bundler replaces it; without a bundler, the ReferenceError means "not development".
const isDev = () => { try { return process.env.NODE_ENV !== 'production'; } catch { return false; } };

function Slot({ icon }: { icon: ReactNode | IconName }) {
  if (icon == null || icon === false) return null;
  const inner = typeof icon === 'string' && icon in ICONS ? <Icon name={icon as IconName} size={24} /> : icon;
  return <span className="rnc-btn-ico" aria-hidden="true">{inner}</span>;
}
const Spinner = () => <span className="rnc-btn-ico" aria-hidden="true"><span className="rnc-btn-spinner" /></span>;

/**
 * One button for every action, built on the native <button> (or <a> with `href`). Sentence-case labels that say what
 * happens ("Save changes"). While `loading`, a spinner takes the start icon's place and clicks are ignored; the button
 * keeps focus and its width. `stage` and `stage-ghost` go on dark stage bands.
 */
export const Button = forwardRef<HTMLElement, ButtonProps>(function Button(
  {
    variant = 'primary', size = 'md', type = 'button', loading, loadingText, startIcon, endIcon, iconOnly, fullWidth, disabled,
    href, target, rel, as, to, onClick, className, children, ...rest
  },
  ref,
) {
  const busy = !!loading;
  const blocked = busy || !!disabled;
  const icon = startIcon ?? (iconOnly ? children : undefined);

  useEffect(() => {
    if (iconOnly && isDev() && !rest['aria-label'] && !rest['aria-labelledby'] && !rest.title) {
      console.warn('[@rafflenexuscanada/design-system] An iconOnly Button needs an aria-label so screen readers can name it.');
    }
  }, [iconOnly, rest['aria-label'], rest['aria-labelledby'], rest.title]); // eslint-disable-line react-hooks/exhaustive-deps

  const idle = <>{icon != null ? <Slot icon={icon} /> : null}{iconOnly ? null : children}{!iconOnly && endIcon != null ? <Slot icon={endIcon} /> : null}</>;
  // With `loading` in play (true or false), both labels sit in one grid cell so the width never jumps.
  const content = loading === undefined ? idle : (
    <span className="rnc-btn-stack">
      <span className="rnc-btn-layer" aria-hidden={busy ? true : undefined}>{idle}</span>
      <span className="rnc-btn-layer" aria-hidden={busy ? undefined : true}>
        <Spinner />{iconOnly ? null : (loadingText ?? children)}{!iconOnly && endIcon != null ? <Slot icon={endIcon} /> : null}
      </span>
    </span>
  );

  const cls = cx('rnc-btn', `rnc-btn-${variant}`, size !== 'md' && `rnc-btn-${size}`, iconOnly && 'rnc-btn-icon', fullWidth && 'rnc-btn-full', className);
  const handleClick = (e: MouseEvent<HTMLElement>) => {
    if (blocked) { e.preventDefault(); return; }
    onClick?.(e);
  };
  const state = busy ? { 'aria-busy': true as const, 'aria-disabled': true as const } : disabled ? { 'aria-disabled': true as const } : {};

  const isLink = href != null || to != null;
  if (isLink || (as && as !== 'button')) {
    // A disabled or loading link can't be truly disabled: drop the href, mark it and block the click.
    if (blocked) {
      return <a ref={ref as never} {...rest} {...state} role="link" tabIndex={busy ? 0 : -1} className={cls} onClick={handleClick}>{content}</a>;
    }
    const El: ElementType = as ?? 'a';
    const linkProps = as ? { href, to: to ?? href } : { href };
    return <El ref={ref} {...rest} {...linkProps} target={target} rel={rel ?? (target === '_blank' ? 'noopener noreferrer' : undefined)} className={cls} onClick={handleClick}>{content}</El>;
  }
  return (
    <button
      ref={ref as never} type={type} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)} {...state}
      disabled={disabled && !busy ? true : undefined} className={cls} onClick={handleClick}
    >
      {content}
    </button>
  );
});
