import {
  useCallback, useEffect, useLayoutEffect, useRef, useState, type ElementType, type PointerEvent as ReactPointerEvent, type ReactNode,
} from 'react';
import { Button } from './Button';
import { prefersReducedMotion, cx } from '../utils';

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;
const LEAVE_MS = 220;
const ENTER_MS = 1300;
const SETTLE = 'transform .3s cubic-bezier(.2, .8, .2, 1)';

type Key = string | number;
/** Where an item sits inside its list. Relative to the list, so the whole list moving (an outer list animating, the page
 *  scrolling, a field above growing) isn't mistaken for the item moving. */
type Spot = { left: number; top: number };
/** How far an item's own transform has it shifted right now (mid-slide), read from its computed matrix. */
const shift = (el: HTMLElement) => {
  const t = getComputedStyle(el).transform;
  const n = t && t !== 'none' ? t.slice(t.indexOf('(') + 1, -1).split(',').map(Number) : [];
  if (n.length === 16) return { x: n[12] || 0, y: n[13] || 0 };
  if (n.length === 6) return { x: n[4] || 0, y: n[5] || 0 };
  return { x: 0, y: 0 };
};
/** The item's place in the layout, leaving out any slide under way, so a re-render mid-slide doesn't read the slide as a move. */
const spot = (el: HTMLElement): Spot => {
  const r = el.getBoundingClientRect(); const base = el.parentElement?.getBoundingClientRect(); const s = shift(el);
  return { left: r.left - s.x - (base?.left ?? 0), top: r.top - s.y - (base?.top ?? 0) };
};
interface Entry<T> { key: Key; item: T; leaving?: boolean; at?: number }

/**
 * Keeps removed items on screen for a moment (so they can fade and fold away), marks newly added ones, and slides every item that
 * moved from its old place to its new one (FLIP). `measure` lets a caller hand in the "old" positions, e.g. where items were mid-drag.
 */
function useListMotion<T>(items: T[], getKey: (item: T, index: number) => Key) {
  const keys = items.map(getKey);
  const [leaving, setLeaving] = useState<Entry<T>[]>([]);
  const [entering, setEntering] = useState<Set<Key>>(new Set());
  const prevItems = useRef<{ key: Key; item: T }[] | null>(null);
  const nodes = useRef(new Map<Key, HTMLElement>());
  const rects = useRef(new Map<Key, Spot>());
  const override = useRef<Map<Key, Spot> | null>(null);

  // Work out who arrived and who left since the last render
  const keyString = keys.join('\u0001');
  useIsoLayoutEffect(() => {
    const before = prevItems.current;
    prevItems.current = items.map((item, i) => ({ key: keys[i], item }));
    if (!before) return;
    const now = new Set(keys);
    const was = new Set(before.map((b) => b.key));
    const gone = prefersReducedMotion() ? [] : before.map((b, at) => ({ ...b, at, leaving: true })).filter((b) => !now.has(b.key));
    const added = keys.filter((k) => !was.has(k));
    if (gone.length) setLeaving((l) => [...l.filter((x) => !now.has(x.key)), ...gone]);
    if (added.length && !prefersReducedMotion()) {
      setEntering((e) => new Set([...e, ...added]));
      setTimeout(() => setEntering((e) => { const n = new Set(e); added.forEach((k) => n.delete(k)); return n; }), ENTER_MS);
    }
    if (gone.length) setTimeout(() => setLeaving((l) => l.filter((x) => !gone.some((g) => g.key === x.key))), LEAVE_MS);
  }, [keyString]); // eslint-disable-line react-hooks/exhaustive-deps

  // FLIP: after every change, slide moved items from their old place. Positions are layout positions (no transform), so the
  // re-renders a move sets off (the announcement, the form, autosave) leave a slide under way alone; an item that moves again
  // mid-slide starts from where it is on screen, not from a jump.
  useIsoLayoutEffect(() => {
    const old = override.current ?? rects.current;
    override.current = null;
    const fresh = new Map<Key, Spot>();
    nodes.current.forEach((el, k) => fresh.set(k, spot(el)));
    if (!prefersReducedMotion()) {
      fresh.forEach((r, k) => {
        const o = old.get(k); const el = nodes.current.get(k);
        if (!o || !el || el.classList.contains('is-dragging')) return;
        const dx = o.left - r.left, dy = o.top - r.top;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
        const now = shift(el);
        el.style.transition = 'none';
        el.style.transform = `translate(${dx + now.x}px, ${dy + now.y}px)`;
        void el.offsetHeight;
        el.style.transition = SETTLE;
        el.style.transform = '';
        // Only this item's own slide ending: transitionend bubbles up from the fields and buttons inside it too, and
        // clearing the transition early would cut the slide short.
        const clear = (e: TransitionEvent) => {
          if (e.target !== el || e.propertyName !== 'transform') return;
          el.style.transition = ''; el.removeEventListener('transitionend', clear);
        };
        el.addEventListener('transitionend', clear);
      });
    }
    rects.current = fresh;
  });

  // The rendered list: current items, with leaving ones kept near their old position
  const entries: Entry<T>[] = items.map((item, i) => ({ key: keys[i], item }));
  leaving.slice().sort((a, b) => (a.at ?? 0) - (b.at ?? 0)).forEach((l) => {
    entries.splice(Math.min(entries.length, Math.max(0, l.at ?? entries.length)), 0, l);
  });
  const ref = (key: Key) => (el: HTMLElement | null) => { if (el) nodes.current.set(key, el); else nodes.current.delete(key); };
  // Callers hand in on-screen rects (where rows were mid-drag); keep them relative to the list, like the rest.
  const measure = (map: Map<Key, DOMRect>) => {
    const rel = new Map<Key, Spot>();
    map.forEach((r, k) => { const base = nodes.current.get(k)?.parentElement?.getBoundingClientRect(); rel.set(k, { left: r.left - (base?.left ?? 0), top: r.top - (base?.top ?? 0) }); });
    override.current = rel;
  };
  return { entries, entering, ref, nodes, measure };
}

export interface AnimatedListProps<T> {
  items: T[];
  /** A stable key per item (an id, not the index), so moves and removals animate the right row. */
  getKey: (item: T, index: number) => Key;
  renderItem: (item: T, index: number) => ReactNode;
  /** The list element. Default "ul". */
  as?: ElementType;
  className?: string;
  itemClassName?: string;
  'aria-label'?: string;
}

/**
 * A list that shows what changed: an added item grows in (with a brief highlight), a removed one fades and folds away, and the rest
 * slide to their new places. Instant under reduced motion. Use stable keys.
 */
export function AnimatedList<T>({ items, getKey, renderItem, as: List = 'ul', className, itemClassName, 'aria-label': ariaLabel }: AnimatedListProps<T>) {
  const { entries, entering, ref } = useListMotion(items, getKey);
  let visibleIndex = -1;
  return (
    <List className={cx('rnc-alist', className)} aria-label={ariaLabel}>
      {entries.map((e) => {
        if (!e.leaving) visibleIndex++;
        return (
          <li key={e.key} ref={ref(e.key)} className={cx('rnc-alist-item', e.leaving && 'is-leaving', entering.has(e.key) && 'is-entering', itemClassName)} aria-hidden={e.leaving || undefined}>
            {renderItem(e.item, e.leaving ? -1 : visibleIndex)}
          </li>
        );
      })}
    </List>
  );
}

export interface SortableItemTools {
  index: number;
  total: number;
  /** Spread on your drag grip: `<button {...handle}>`. Or use `grip`, the design system's. */
  handle: { onPointerDown: (e: ReactPointerEvent<HTMLElement>) => void; 'aria-label': string; type: 'button' };
  /** The design system's grip button, ready to place. */
  grip: ReactNode;
  /** Move earlier and Move later buttons, for keyboards and screen readers. */
  moves: ReactNode;
  moveEarlier: () => void;
  moveLater: () => void;
  isDragging: boolean;
}

export interface SortableListProps<T> {
  items: T[];
  getKey: (item: T, index: number) => Key;
  /** Called with the new order after a drag or a move. */
  onReorder: (items: T[]) => void;
  renderItem: (item: T, tools: SortableItemTools) => ReactNode;
  /** The item's name in announcements and button labels, e.g. (slide, i) => `Slide ${i + 1}`. */
  itemLabel?: (item: T, index: number) => string;
  /** The list's accessible name, e.g. "Slides". */
  'aria-label'?: string;
  /** Locks the order (read-only forms). */
  disabled?: boolean;
  className?: string;
}

const GRIP = (
  <svg viewBox="0 0 16 22" aria-hidden="true" focusable="false">
    {[4, 11, 18].map((y) => [5, 11].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" fill="currentColor" />))}
  </svg>
);

/**
 * A list people reorder by dragging the grip (the row lifts, the others make room, and everything settles into place) or with Move
 * earlier / Move later. Each move is announced ("Slide 2 moved to position 1 of 4"). Escape cancels a drag.
 */
export function SortableList<T>({ items, getKey, onReorder, renderItem, itemLabel = (_i, n) => `Item ${n + 1}`, 'aria-label': ariaLabel, disabled, className }: SortableListProps<T>) {
  const { entries, entering, ref, nodes, measure } = useListMotion(items, getKey);
  const [dragKey, setDragKey] = useState<Key | null>(null);
  const [said, setSaid] = useState('');
  type Handlers = { mv: (e: PointerEvent) => void; up: (e: PointerEvent) => void; key: (e: KeyboardEvent) => void };
  const drag = useRef<{ key: Key; from: number; to: number; startY: number; mids: number[]; step: number; pointer: number; h: Handlers } | null>(null);
  const api = useRef<{ onMove: (e: PointerEvent) => void; onUp: (e: PointerEvent) => void; onKey: (e: KeyboardEvent) => void } | null>(null);
  const keys = items.map(getKey);
  // After a Move button moves its row, keep focus on that row's moves (the other button when this one is now disabled)
  const refocus = useRef<{ key: Key; later: boolean } | null>(null);
  useIsoLayoutEffect(() => {
    const r = refocus.current; refocus.current = null;
    const buttons = r ? nodes.current.get(r.key)?.querySelectorAll<HTMLButtonElement>('.rnc-sort-moves button') : undefined;
    if (!r || !buttons || buttons.length < 2) return;
    const want = buttons[r.later ? 1 : 0]; const other = buttons[r.later ? 0 : 1];
    const target = want.disabled ? other : want;
    if (document.activeElement !== target) target.focus({ preventScroll: true });
  });
  const press = (key: Key, from: number, later: boolean) => { refocus.current = { key, later }; move(from, from + (later ? 1 : -1)); };

  // Named by where it was ("Slide 3 moved to position 1 of 3"), so the announcement says which one moved
  const announce = (from: number, to: number, list: T[]) => setSaid(`${itemLabel(list[to], from)} moved to position ${to + 1} of ${list.length}.`);
  const move = useCallback((from: number, to: number) => {
    if (to < 0 || to >= items.length || from === to) return;
    const next = items.slice(); const [it] = next.splice(from, 1); next.splice(to, 0, it);
    onReorder(next); announce(from, to, next);
  }, [items, onReorder]); // eslint-disable-line react-hooks/exhaustive-deps

  // Shift the rows between the dragged row's old and new place to make room
  const paint = (d: NonNullable<typeof drag.current>, dy: number) => {
    keys.forEach((k, i) => {
      const el = nodes.current.get(k); if (!el) return;
      if (k === d.key) { el.style.transition = 'none'; el.style.transform = `translateY(${dy}px)`; return; }
      let shift = 0;
      if (d.from < d.to && i > d.from && i <= d.to) shift = -d.step;
      if (d.from > d.to && i >= d.to && i < d.from) shift = d.step;
      el.style.transition = prefersReducedMotion() ? 'none' : SETTLE;
      el.style.transform = shift ? `translateY(${shift}px)` : '';
    });
  };
  const end = (commit: boolean) => {
    const d = drag.current; if (!d) return;
    drag.current = null;
    window.removeEventListener('pointermove', d.h.mv); window.removeEventListener('pointerup', d.h.up); window.removeEventListener('keydown', d.h.key);
    // Hand the rows' current on-screen spots to the list, so they settle from there into the new order
    const spots = new Map<Key, DOMRect>();
    nodes.current.forEach((el, k) => spots.set(k, el.getBoundingClientRect()));
    nodes.current.forEach((el) => { el.style.transition = 'none'; el.style.transform = ''; });
    setDragKey(null);
    if (commit && d.to !== d.from) { measure(spots); move(d.from, d.to); }
    else { measure(spots); setSaid(commit ? '' : 'Move cancelled.'); }
  };
  const onMove = (e: PointerEvent) => {
    const d = drag.current; if (!d || e.pointerId !== d.pointer) return;
    const dy = e.clientY - d.startY;
    const centre = d.mids[d.from] + dy;
    let to = d.from;
    d.mids.forEach((m, i) => { if (i < d.from && centre < m) to = Math.min(to, i); if (i > d.from && centre > m) to = Math.max(to, i); });
    d.to = to;
    paint(d, dy);
  };
  const onUp = (e: PointerEvent) => { if (drag.current && e.pointerId === drag.current.pointer) end(true); };
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') end(false); };
  api.current = { onMove, onUp, onKey };
  useEffect(() => () => { const d = drag.current; if (d) { window.removeEventListener('pointermove', d.h.mv); window.removeEventListener('pointerup', d.h.up); window.removeEventListener('keydown', d.h.key); } }, []);

  const start = (key: Key, index: number) => (e: ReactPointerEvent<HTMLElement>) => {
    if (disabled || e.button !== 0) return;
    e.preventDefault();
    const rows = keys.map((k) => nodes.current.get(k)!.getBoundingClientRect());
    const step = rows.length > 1 ? Math.abs(rows[1].top - rows[0].top) : rows[0].height;
    const h: Handlers = { mv: (ev) => api.current?.onMove(ev), up: (ev) => api.current?.onUp(ev), key: (ev) => api.current?.onKey(ev) };
    drag.current = { key, from: index, to: index, startY: e.clientY, mids: rows.map((r) => r.top + r.height / 2), step, pointer: e.pointerId, h };
    setDragKey(key);
    window.addEventListener('pointermove', h.mv); window.addEventListener('pointerup', h.up); window.addEventListener('keydown', h.key);
  };

  let visibleIndex = -1;
  return (
    <>
      <ul className={cx('rnc-alist', className)} aria-label={ariaLabel}>
        {entries.map((e) => {
          if (e.leaving) return <li key={e.key} ref={ref(e.key)} className="rnc-alist-item is-leaving" aria-hidden="true">{renderItem(e.item, blankTools(items.length))}</li>;
          const index = ++visibleIndex;
          const name = itemLabel(e.item, index);
          const handle = { onPointerDown: start(e.key, index), 'aria-label': `Drag to reorder ${name}`, type: 'button' as const };
          const tools: SortableItemTools = {
            index, total: items.length, handle, isDragging: dragKey === e.key,
            moveEarlier: () => move(index, index - 1), moveLater: () => move(index, index + 1),
            grip: disabled ? null : <button className="rnc-sort-grip" {...handle}>{GRIP}</button>,
            moves: disabled ? null : (
              <span className="rnc-sort-moves">
                <Button variant="ghost" size="sm" iconOnly startIcon="arrow-up" aria-label={`Move ${name} earlier`} disabled={index === 0} onClick={() => press(e.key, index, false)} />
                <Button variant="ghost" size="sm" iconOnly startIcon="arrow-down" aria-label={`Move ${name} later`} disabled={index === items.length - 1} onClick={() => press(e.key, index, true)} />
              </span>
            ),
          };
          return (
            <li key={e.key} ref={ref(e.key)} className={cx('rnc-alist-item', entering.has(e.key) && 'is-entering', dragKey === e.key && 'is-dragging')}>
              {renderItem(e.item, tools)}
            </li>
          );
        })}
      </ul>
      <span className="rnc-sr-only" role="status" aria-live="polite">{said}</span>
    </>
  );
}

function blankTools(total: number): SortableItemTools {
  const noop = () => {};
  return { index: -1, total, handle: { onPointerDown: noop, 'aria-label': '', type: 'button' }, grip: null, moves: null, moveEarlier: noop, moveLater: noop, isDragging: false };
}
