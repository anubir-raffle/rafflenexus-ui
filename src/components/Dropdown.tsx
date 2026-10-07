import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react';
import { Icon } from './Icon';
import type { IconName } from '../generated/icons';
import type { ButtonVariant } from './Button';
import { useFieldId } from './Field';
import { cx } from '../utils';

export interface DropdownItem {
  label: ReactNode;
  /** Renders the item as a link. */
  href?: string;
  /** Runs when the item is chosen. */
  onSelect?: () => void;
  icon?: IconName;
  disabled?: boolean;
}
export interface DropdownProps {
  /** The button's label, e.g. "Export report". */
  label: ReactNode;
  items: DropdownItem[];
  /** Button style. Default "secondary". */
  variant?: ButtonVariant;
  /** Which edge the menu lines up with. Default "start". */
  align?: 'start' | 'end';
  className?: string;
}

/**
 * A button that opens a short menu of actions or links (WAI-ARIA menu button pattern).
 * Arrow keys move between items, Home and End jump, Escape closes and returns focus to the button,
 * and a click outside closes it. For a form choice, use Select.
 */
export function Dropdown({ label, items, variant = 'secondary', align = 'start', className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrap = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const refs = useRef<Array<HTMLElement | null>>([]);
  const id = useFieldId();
  const menuId = `${id}-menu`;
  const btnId = `${id}-btn`;

  useEffect(() => { if (open) refs.current[active]?.focus(); }, [open, active]);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const show = (i: number) => { setActive((i + items.length) % items.length); setOpen(true); };
  const close = (refocus: boolean) => { setOpen(false); if (refocus) btn.current?.focus(); };
  const onButtonKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); show(0); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); show(items.length - 1); }
  };
  const onMenuKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); show(active + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); show(active - 1); }
    else if (e.key === 'Home') { e.preventDefault(); show(0); }
    else if (e.key === 'End') { e.preventDefault(); show(items.length - 1); }
    else if (e.key === 'Escape') { e.preventDefault(); close(true); }
    else if (e.key === 'Tab') close(false);
  };
  const choose = (it: DropdownItem) => (e: ReactMouseEvent) => {
    if (it.disabled) { e.preventDefault(); return; }
    it.onSelect?.();
    close(true);
  };

  return (
    <div ref={wrap} className={cx('rnc-dropdown', align === 'end' && 'align-end', className)}>
      <button
        ref={btn} id={btnId} type="button" className={cx('rnc-btn', `rnc-btn-${variant}`, 'rnc-dropdown-trigger')}
        aria-haspopup="menu" aria-expanded={open} aria-controls={menuId}
        onClick={() => (open ? close(false) : show(0))} onKeyDown={onButtonKey}
      >
        {label}<span className="rnc-chev" aria-hidden="true" />
      </button>
      <ul className="rnc-dropdown-menu" role="menu" id={menuId} aria-labelledby={btnId} hidden={!open} onKeyDown={onMenuKey}>
        {items.map((it, i) => {
          const inner = <>{it.icon ? <Icon name={it.icon} size={18} /> : null}{it.label}</>;
          const common = { role: 'menuitem', tabIndex: -1, className: 'rnc-dropdown-item', 'aria-disabled': it.disabled || undefined, onClick: choose(it) } as const;
          return (
            <li role="none" key={i}>
              {it.href && !it.disabled
                ? <a ref={(el) => { refs.current[i] = el; }} href={it.href} {...common}>{inner}</a>
                : <button ref={(el) => { refs.current[i] = el; }} type="button" {...common}>{inner}</button>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
