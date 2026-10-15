import { useId, useState, type ReactNode } from 'react';
import { Icon } from './Icon';
import { cx } from '../utils';

export interface ExpandableRowProps {
  /** What the row is ("Single ticket"). */
  title: ReactNode;
  /** A short figure on the right of the head ("$10 · 1 ticket"). */
  meta?: ReactNode;
  /** Controlled open state; or leave it out and use `defaultOpen`. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Buttons at the end of the head, e.g. a Remove button. */
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}

/** A row that opens smoothly to edit what it holds: a ticket pack, a prize, a licence. The head says what it is at a glance. */
export function ExpandableRow({ title, meta, open, defaultOpen = false, onOpenChange, actions, children, className }: ExpandableRowProps) {
  const [own, setOwn] = useState(defaultOpen);
  const isOpen = open ?? own;
  const id = useId();
  const toggle = () => { const next = !isOpen; if (open === undefined) setOwn(next); onOpenChange?.(next); };
  return (
    <div className={cx('rnc-xrow', isOpen && 'is-open', className)}>
      <div className="rnc-xrow-head">
        <button type="button" className="rnc-xrow-toggle" aria-expanded={isOpen} aria-controls={id} onClick={toggle}>
          <Icon name="caret-right" size={18} className="rnc-xrow-chev" />
          <span className="rnc-xrow-title">{title}</span>
          {meta != null ? <span className="rnc-xrow-meta">{meta}</span> : null}
        </button>
        {actions ? <span className="rnc-xrow-actions">{actions}</span> : null}
      </div>
      <div className="rnc-xrow-panel" id={id} role="region" aria-label={typeof title === 'string' ? title : undefined}>
        <div><div className="rnc-xrow-inner">{children}</div></div>
      </div>
    </div>
  );
}
