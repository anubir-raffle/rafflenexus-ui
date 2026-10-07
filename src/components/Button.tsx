import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from '../utils';

export type ButtonVariant = 'primary' | 'secondary' | 'stage' | 'stage-ghost';

type Common = { variant?: ButtonVariant; className?: string; children?: ReactNode };
export type ButtonProps =
  | (Common & { href: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children'>)
  | (Common & { href?: undefined } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>);

/**
 * The brand button. Sentence-case labels that say what happens ("Talk to our lottery team").
 * Use `stage` and `stage-ghost` on dark stage bands. Pass `href` to render a link.
 */
export function Button({ variant = 'primary', className, children, ...rest }: ButtonProps) {
  const cls = cx('rnc-btn', `rnc-btn-${variant}`, className);
  if ('href' in rest && rest.href) return <a {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)} className={cls}>{children}</a>;
  const { type = 'button', ...btn } = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return <button type={type} {...btn} className={cls}>{children}</button>;
}
