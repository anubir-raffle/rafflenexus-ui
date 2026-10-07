import { useEffect, useRef, useState, type AnchorHTMLAttributes, type CSSProperties, type MouseEvent } from 'react';
import { Icon } from './Icon';
import { cx, prefersReducedMotion } from '../utils';

export interface TicketButtonColors {
  /** Main part background. Default var(--action). */
  bg?: string;
  /** Text colour. Default var(--on-action). */
  fg?: string;
  /** Stub background. Default: bg, 18% darker. */
  stub?: string;
  stubFg?: string;
  /** Focus ring. Default var(--focus). */
  ring?: string;
}
export interface TicketButtonProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children'> {
  /** What happens: "Order tickets", "Buy tickets", "Support the hospital". */
  label: string;
  /** Text on the stub, e.g. "from $10" or the order total. Without it the stub shows a ticket icon. */
  stub?: string;
  size?: 'default' | 'big';
  fullWidth?: boolean;
  /** On client raffle sites, pass the client's colours. */
  colors?: TicketButtonColors;
}

/**
 * The buy action, shaped like a ticket: the stub tilts on hover and a hole punches through it on click.
 * Renders a link (pass href) or a button. Motion stops under reduced motion.
 */
export function TicketButton({ label, stub, size = 'default', fullWidth, colors, className, style, onClick, href, ...rest }: TicketButtonProps) {
  const [punch, setPunch] = useState(0);
  const [bits, setBits] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const vars: Record<string, string> = {};
  if (colors?.bg) vars['--tb-bg'] = colors.bg;
  if (colors?.fg) vars['--tb-fg'] = colors.fg;
  if (colors?.stub) vars['--tb-stub'] = colors.stub;
  if (colors?.stubFg) vars['--tb-stub-fg'] = colors.stubFg;
  if (colors?.ring) vars['--tb-ring'] = colors.ring;

  const handle = (e: MouseEvent<HTMLAnchorElement & HTMLButtonElement>) => {
    onClick?.(e as MouseEvent<HTMLAnchorElement>);
    if (prefersReducedMotion()) return;
    setPunch((n) => n + 1); setBits(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setBits(false), 700);
  };
  const props = {
    className: cx('rnc-tbtn', size === 'big' && 'big', fullWidth && 'full', punch > 0 && 'punched', className),
    style: { ...(vars as CSSProperties), ...style },
    'aria-label': stub ? `${label}, ${stub}` : undefined,
    onClick: handle,
  };
  const inner = (
    <>
      <span className="tb-main">{label}</span>
      <span className="tb-stub" aria-hidden="true">
        {stub ? <span className="tb-price">{stub}</span> : <Icon name="ticket" size={22} />}
        <i key={punch} className="tb-hole" />
        {bits ? Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return <i key={`${punch}-${i}`} className="tb-bit" style={{ ['--x' as string]: `${Math.round(Math.cos(a) * 26)}px`, ['--y' as string]: `${Math.round(Math.sin(a) * 26)}px` } as CSSProperties} />;
        }) : null}
      </span>
    </>
  );
  return href
    ? <a href={href} {...rest} {...props}>{inner}</a>
    : <button type="button" {...(rest as object)} {...props}>{inner}</button>;
}
