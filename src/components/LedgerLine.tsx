import type { ReactNode } from 'react';
import { cx } from '../utils';

export interface LedgerItem {
  label: ReactNode;
  value: ReactNode;
  /** Shows a ✓ and the verified colour, for reconciled or confirmed figures. */
  done?: boolean;
}
export interface LedgerLineProps {
  items: LedgerItem[];
  className?: string;
}

/** A row of labelled figures under one rule, like a ledger. The one rule a section may have. */
export function LedgerLine({ items, className }: LedgerLineProps) {
  return (
    <div className={cx('rnc-ledger', className)}>
      {items.map((it, i) => (
        <div key={i} className={it.done ? 'is-done' : undefined}>
          <small>{it.label}</small>
          <strong>{it.done ? <>✓ {it.value}</> : it.value}</strong>
        </div>
      ))}
    </div>
  );
}
