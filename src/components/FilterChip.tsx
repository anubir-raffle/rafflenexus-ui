import {
  Children, createContext, isValidElement, useContext, useLayoutEffect, useMemo, useRef, useState,
  type HTMLAttributes, type ReactNode, type RefObject,
} from 'react';
import { Icon } from './Icon';
import { cx } from '../utils';

interface ChipGroupContext {
  /** Called just before a chip asks to be removed, so the group can move focus once it's gone. */
  willRemove(button: HTMLButtonElement, name: string): void;
}
const GroupContext = createContext<ChipGroupContext | null>(null);

const asText = (v: ReactNode) => (typeof v === 'string' || typeof v === 'number' ? String(v) : '');

export interface FilterChipProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** The filter ("Hide archived"), or its name when there's a value ("Status"). */
  label: ReactNode;
  /** The chosen value, shown in bold after the label ("In progress"). */
  value?: ReactNode;
  /** Removes the filter. Leave it out for a fixed filter the person can't turn off (a grey chip with no ×). */
  onRemove?: () => void;
  /** The × button's name. Default "Remove filter: {label}: {value}". Pass it when label or value isn't plain text. */
  removeLabel?: string;
}

/** One filter in force, with a × to remove it: `<FilterChip label="Status" value="In progress" onRemove={…} />`. */
export function FilterChip({ label, value, onRemove, removeLabel, className, ...rest }: FilterChipProps) {
  const group = useContext(GroupContext);
  const hasValue = value !== undefined && value !== null && value !== '';
  const name = [asText(label), hasValue ? asText(value) : ''].filter(Boolean).join(': ');
  return (
    <span {...rest} className={cx('rnc-chip', !onRemove && 'is-disabled', className)}>
      <span className="rnc-chip-text" title={name || undefined}>
        {label}
        {hasValue ? <>: <span className="rnc-chip-value">{value}</span></> : null}
      </span>
      {onRemove ? (
        <button
          type="button" className="rnc-chip-remove" aria-label={removeLabel ?? `Remove filter: ${name}`}
          onClick={(e) => { group?.willRemove(e.currentTarget, name); onRemove(); }}
        >
          <Icon name="x" size={14} />
        </button>
      ) : null}
    </span>
  );
}

export interface FilterChipGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** `FilterChip`s, one per filter in force. With none, the group renders nothing. */
  children?: ReactNode;
  /** Names the group for screen readers. Default "Active filters". */
  label?: string;
  /** Shows "Clear all" after the chips. */
  onClearAll?: () => void;
  /** Default "Clear all". */
  clearAllLabel?: string;
  /** Where focus goes when the last chip is removed or everything is cleared (the search field, usually). */
  returnFocusRef?: RefObject<HTMLElement | null>;
  /** Say each removal in a polite live region ("Removed Status: In progress."). Default true. */
  announce?: boolean;
}

/**
 * The filters in force, then "Clear all". After a removal, focus moves to the next chip's ×, or to `returnFocusRef`
 * when none are left, so keyboard users keep their place.
 */
export function FilterChipGroup({
  children, label = 'Active filters', onClearAll, clearAllLabel = 'Clear all', returnFocusRef, announce = true, className, ...rest
}: FilterChipGroupProps) {
  const box = useRef<HTMLDivElement>(null);
  const pending = useRef<{ index: number; message: string } | null>(null);
  const [message, setMessage] = useState('');
  const chips = Children.toArray(children).filter(isValidElement);

  const ctx = useMemo<ChipGroupContext>(() => ({
    willRemove(button, name) {
      const all = Array.from(box.current?.querySelectorAll('.rnc-chip-remove') ?? []);
      pending.current = { index: Math.max(0, all.indexOf(button)), message: name ? `Removed ${name}.` : 'Filter removed.' };
    },
  }), []);

  // Runs after every render: once the parent has dropped the chip, put focus somewhere sensible.
  useLayoutEffect(() => {
    const p = pending.current;
    if (!p) return;
    pending.current = null;
    const left = box.current ? Array.from(box.current.querySelectorAll<HTMLButtonElement>('.rnc-chip-remove')) : [];
    const target = left.length ? left[Math.min(p.index, left.length - 1)] : returnFocusRef?.current;
    target?.focus();
    if (announce) setMessage(p.message);
  });

  const clearAll = () => {
    pending.current = { index: 0, message: 'All filters cleared.' };
    onClearAll?.();
  };

  return (
    <>
      {chips.length ? (
        <div {...rest} ref={box} role="group" aria-label={label} className={cx('rnc-chips', className)}>
          <GroupContext.Provider value={ctx}>{chips}</GroupContext.Provider>
          {onClearAll ? <button type="button" className="rnc-chips-clear" onClick={clearAll}>{clearAllLabel}</button> : null}
        </div>
      ) : null}
      {announce ? <span className="rnc-sr-only" role="status" aria-live="polite">{message}</span> : null}
    </>
  );
}
